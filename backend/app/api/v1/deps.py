from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.core.clerk import verify_clerk_token
from app.db.database import get_db
from app.models.user import User


def get_token(
    request: Request,
    access_token: str | None = Cookie(default=None),
) -> tuple[str, bool]:
    """Returns (token, is_clerk)"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        # Very simple heuristic: Clerk tokens are usually much longer or we can try to decode
        # Better: check if it's a valid Clerk token first
        return token, True

    if access_token:
        return access_token, False

    return None, False


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
) -> User:
    token, maybe_clerk = get_token(request, access_token)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = None
    user_id = None
    email = None

    if maybe_clerk:
        payload = verify_clerk_token(token)
        if payload:
            email = payload.get("email") or payload.get("email_address")
            # Clerk 'sub' is the clerk user id
            clerk_id = payload.get("sub")
            
            # Try lookup by clerk id first
            user = db.query(User).filter(User.oauth_provider_id == clerk_id, User.oauth_provider == "clerk").first()
            if user:
                return user
                
            # If not found, try by email
            if email:
                user = db.query(User).filter(User.email == email).first()
                if user:
                    # Link clerk account
                    user.oauth_provider = "clerk"
                    user.oauth_provider_id = clerk_id
                    db.commit()
                    return user
                
                # Auto-create user if email present
                user = User(
                    email=email,
                    username=email.split("@")[0] + "_" + clerk_id[-4:],
                    full_name=payload.get("name") or payload.get("full_name"),
                    hashed_password="!", # No password for OAuth users
                    oauth_provider="clerk",
                    oauth_provider_id=clerk_id,
                    avatar_url=payload.get("picture") or payload.get("image_url")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                return user

    # Fallback to local JWT
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
    except Exception:
        pass

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
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
