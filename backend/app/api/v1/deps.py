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
                email = payload.get("email") or payload.get("email_address")
                clerk_id = payload.get("sub")
                
                logger.debug(f"Clerk token verified for clerk_id={clerk_id}, email={email}")
                
                # Try lookup by clerk id first
                user = db.query(User).filter(
                    User.oauth_provider_id == clerk_id, 
                    User.oauth_provider == "clerk"
                ).first()
                if user:
                    logger.debug(f"Found user {user.email} by Clerk ID")
                    return user
                    
                # If not found, try by email
                if email:
                    user = db.query(User).filter(User.email == email).first()
                    if user:
                        # Link clerk account
                        user.oauth_provider = "clerk"
                        user.oauth_provider_id = clerk_id
                        user.full_name = payload.get("name") or payload.get("full_name") or user.full_name
                        user.avatar_url = payload.get("picture") or payload.get("image_url") or user.avatar_url
                        db.commit()
                        logger.debug(f"Linked Clerk account to existing user {user.email}")
                        return user
                    
                    # Auto-create user if email present
                    username_base = email.split("@")[0]
                    username = username_base
                    counter = 1
                    while db.query(User).filter(User.username == username).first():
                        username = f"{username_base}_{counter}"
                        counter += 1
                    
                    user = User(
                        email=email,
                        username=username,
                        full_name=payload.get("name") or payload.get("full_name") or username,
                        hashed_password="!clerk-oauth",
                        oauth_provider="clerk",
                        oauth_provider_id=clerk_id,
                        avatar_url=payload.get("picture") or payload.get("image_url")
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    logger.info(f"Auto-created user {email} from Clerk token")
                    return user
                else:
                    logger.warning(f"Clerk token missing email")
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
