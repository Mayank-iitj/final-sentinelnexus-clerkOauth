from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import get_settings
from app.core.security import decode_token
from app.core.clerk import verify_clerk_token
from app.db.database import get_db
from app.models.user import User

settings = get_settings()


def _get_or_create_dev_user(db: Session) -> User:
    """Get or create a development test user."""
    try:
        test_email = "test@sentinelnexus.dev"
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(
                email=test_email,
                username="dev_user",
                full_name="Development User",
                hashed_password="!",
                oauth_provider="clerk",
                oauth_provider_id="dev_user_id",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    except Exception as e:
        logger.error(f"Failed to create dev user: {e}")
        raise


def _fetch_clerk_user_details(clerk_user_id: str) -> dict | None:
    """
    Fetch user details from Clerk Backend API using the clerk user ID.
    This is the fallback when the JWT doesn't contain email (which is normal
    for Clerk session tokens).
    """
    import urllib.request
    import json

    if not settings.CLERK_SECRET_KEY:
        logger.warning("CLERK_SECRET_KEY not set — cannot fetch user details from Clerk API")
        return None

    try:
        url = f"https://api.clerk.com/v1/users/{clerk_user_id}"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {settings.CLERK_SECRET_KEY}")
        req.add_header("Content-Type", "application/json")

        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())

        email = None
        email_addresses = data.get("email_addresses", [])
        if email_addresses:
            # Use primary email, or first available
            for ea in email_addresses:
                if ea.get("id") == data.get("primary_email_address_id"):
                    email = ea.get("email_address")
                    break
            if not email:
                email = email_addresses[0].get("email_address")

        return {
            "email": email,
            "first_name": data.get("first_name", ""),
            "last_name": data.get("last_name", ""),
            "image_url": data.get("image_url"),
            "username": data.get("username"),
        }
    except Exception as e:
        logger.error(f"Failed to fetch Clerk user details for {clerk_user_id}: {e}")
        return None


def _find_or_create_clerk_user(db: Session, clerk_id: str, payload: dict) -> User | None:
    """
    Find a user by Clerk ID, or by email, or auto-create them.
    Uses the Clerk Backend API as a fallback when the JWT payload lacks email.
    """
    # 1. Try lookup by Clerk ID first (fastest path)
    user = db.query(User).filter(
        User.oauth_provider_id == clerk_id,
        User.oauth_provider == "clerk"
    ).first()
    if user:
        logger.debug(f"Found user {user.email} by Clerk ID")
        return user

    # 2. Extract email from JWT payload (may not be present in session tokens)
    email = payload.get("email") or payload.get("email_address")
    first_name = payload.get("first_name", "")
    last_name = payload.get("last_name", "")
    image_url = payload.get("picture") or payload.get("image_url")

    # 3. If no email in JWT, fetch from Clerk Backend API
    if not email:
        logger.debug(f"No email in JWT for clerk_id={clerk_id}, fetching from Clerk API")
        clerk_details = _fetch_clerk_user_details(clerk_id)
        if clerk_details:
            email = clerk_details.get("email")
            first_name = clerk_details.get("first_name", first_name)
            last_name = clerk_details.get("last_name", last_name)
            image_url = clerk_details.get("image_url", image_url)

    if not email:
        logger.warning(f"Could not resolve email for clerk_id={clerk_id}")
        return None

    # 4. Try lookup by email
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Link the Clerk account
        user.oauth_provider = "clerk"
        user.oauth_provider_id = clerk_id
        full_name = f"{first_name} {last_name}".strip()
        if full_name:
            user.full_name = full_name
        if image_url:
            user.avatar_url = image_url
        db.commit()
        logger.debug(f"Linked Clerk account to existing user {user.email}")
        return user

    # 5. Auto-create user
    username_base = email.split("@")[0]
    username = username_base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{username_base}_{counter}"
        counter += 1

    full_name = f"{first_name} {last_name}".strip() or username

    user = User(
        email=email,
        username=username,
        full_name=full_name,
        hashed_password="!clerk-oauth",
        oauth_provider="clerk",
        oauth_provider_id=clerk_id,
        avatar_url=image_url,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Auto-created user {email} from Clerk token (clerk_id={clerk_id})")
    return user


def get_token(
    request: Request,
    access_token: str | None = Cookie(default=None),
) -> tuple[str | None, bool]:
    """Returns (token, is_clerk). Token can be None."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        return token, True

    if access_token:
        return access_token, False

    return None, False


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
) -> User:
    """
    Get current user from token or return development user.
    Tries multiple auth methods:
    1. Clerk JWT (from Authorization header)
    2. Local JWT (from cookie)
    3. Development mode fallback
    """
    token, maybe_clerk = get_token(request, access_token)

    # Try token-based authentication first
    if token:
        if maybe_clerk:
            # Try Clerk authentication
            payload = verify_clerk_token(token)
            if payload:
                clerk_id = payload.get("sub")
                logger.debug(f"Clerk token verified for clerk_id={clerk_id}")

                user = _find_or_create_clerk_user(db, clerk_id, payload)
                if user:
                    return user
                else:
                    logger.warning(f"Could not resolve Clerk user for clerk_id={clerk_id}")
            else:
                logger.warning(f"Clerk token verification failed")

        # Try local JWT as fallback
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    logger.debug(f"Found user {user.email} by local JWT")
                    return user
        except Exception as e:
            logger.debug(f"Local JWT decode failed: {e}")

    # Development mode: allow without token
    if not settings.is_production:
        logger.debug(f"Development mode: using test user")
        return _get_or_create_dev_user(db)

    # Production: require valid token
    logger.warning(f"Authentication failed: no valid token provided")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing token")


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is active."""
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.email}")
        raise HTTPException(status_code=400, detail="User account is inactive")
    return current_user


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
) -> User | None:
    """Like get_current_user but returns None instead of 401 when unauthenticated."""
    try:
        return get_current_user(request, db, access_token)
    except HTTPException:
        return None
