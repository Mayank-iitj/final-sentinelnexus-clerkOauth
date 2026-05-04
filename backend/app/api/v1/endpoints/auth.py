from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from jose import JWTError
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user_optional
from app.core.config import get_settings
from app.core.rate_limit import safe_rate_limiter
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.database import get_db
from app.schemas.token import TokenResponse
from app.services.redis_store import RefreshTokenStore, new_jti
from app.services.demo_seeder import seed_demo_account
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

def get_redis(request: Request) -> Redis | None:
    return getattr(request.app.state, "redis", None)


def _cookie_options(request: Request) -> dict:
    secure = settings.is_production
    return {
        "httponly": True,
        "secure": secure,
        "samesite": "lax",
        "path": "/",
    }


def _set_auth_cookies(response: JSONResponse, request: Request, *, user_id: str, refresh_jti: str) -> None:
    access = create_access_token({"sub": user_id})
    refresh = create_refresh_token({"sub": user_id, "jti": refresh_jti})

    response.set_cookie("access_token", access, max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, **_cookie_options(request))
    response.set_cookie("refresh_token", refresh, max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600, **_cookie_options(request))


@router.post("/login", response_model=TokenResponse, status_code=403)
def login_disabled():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Password login disabled – use Google OAuth.",
    )


@router.post("/register", status_code=403)
def register_disabled():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Manual registration disabled – use Google OAuth.",
    )


@router.post("/demo", response_model=TokenResponse)
async def demo_login(
    request: Request,
    db: Session = Depends(get_db),
    redis: Redis | None = Depends(get_redis),
    _rl=Depends(safe_rate_limiter(times=5, seconds=60)),
):
    """
    Generates a temporary Demo guest user, seeds the account with mock data,
    and returns auth tokens so the frontend can initiate a real session.
    """
    if redis is None:
        pass # Allow demo login even without Redis, NextAuth only needs access_token

    import uuid
    demo_id = str(uuid.uuid4())
    
    # 1. Create User
    user = User(
        id=demo_id,
        email=f"demo_guest_{demo_id[:8]}@sentinelnexus.demo",
        username=f"demo_user_{demo_id[:8]}",
        full_name="Demo Guest",
        hashed_password="demo_no_login_allowed",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Seed data
    seed_demo_account(db, demo_id)

    # 3. Create tokens
    refresh_jti = new_jti()
    if redis is not None:
        store = RefreshTokenStore(redis)
        from datetime import timedelta
        await store.allow(
            user_id=demo_id,
            jti=refresh_jti,
            ttl=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

    access = create_access_token({"sub": demo_id})
    refresh = create_refresh_token({"sub": demo_id, "jti": refresh_jti})

    resp = JSONResponse({"access_token": access, "token_type": "bearer"})
    _set_auth_cookies(resp, request, user_id=demo_id, refresh_jti=refresh_jti)
    return resp


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    redis: Redis | None = Depends(get_redis),
    refresh_token: str | None = Cookie(default=None),
    _rl=Depends(safe_rate_limiter(times=10, seconds=60)),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    if redis is None:
        raise HTTPException(status_code=503, detail="Token refresh unavailable (Redis offline)")

    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    jti = payload.get("jti")
    if not user_id or not jti:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    store = RefreshTokenStore(redis)
    if not await store.is_allowed(user_id=user_id, jti=jti):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    # Rotate refresh token
    await store.revoke(user_id=user_id, jti=jti)
    new_refresh_jti = new_jti()
    await store.allow(
        user_id=user_id,
        jti=new_refresh_jti,
        ttl=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    access = create_access_token({"sub": user_id})
    refresh_new = create_refresh_token({"sub": user_id, "jti": new_refresh_jti})

    resp = JSONResponse({"access_token": access, "token_type": "bearer"})
    resp.set_cookie("access_token", access, max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, **_cookie_options(request))
    resp.set_cookie("refresh_token", refresh_new, max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600, **_cookie_options(request))
    return resp


@router.post("/logout")
async def logout(request: Request):
    resp = JSONResponse({"ok": True})
    opts = _cookie_options(request)
    resp.delete_cookie("access_token", path=opts["path"])
    resp.delete_cookie("refresh_token", path=opts["path"])
    return resp


@router.get("/token-echo")
async def token_echo(
    request: Request,
    access_token: str | None = Cookie(default=None),
):
    """
    Reads the httpOnly access_token cookie and echoes the value as JSON.
    Used exclusively by the frontend OAuth session bridge so that NextAuth can
    call signIn('backend-jwt') with the token value. Without this endpoint the
    browser JS cannot read an httpOnly cookie.

    This endpoint is intentionally unauthenticated — it only echoes a cookie
    the browser already possesses. An attacker gains nothing they don't already have.
    """
    return JSONResponse({"access_token": access_token})


@router.get("/me")
async def me(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    """Returns basic profile for the currently authenticated user."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "id":             user.id,
        "email":          user.email,
        "username":       user.username,
        "full_name":      user.full_name,
        "avatar_url":     user.avatar_url,
        "oauth_provider": user.oauth_provider,
    }
