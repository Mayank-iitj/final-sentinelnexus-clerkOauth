"""
SentinelNexus OAuth Backend – Google Only
==========================================
Handles Google OAuth2 / OIDC flow.

Flow:
  1. Browser hits /api/v1/auth/login/google
  2. Backend redirects to Google's authorize URL
  3. Google redirects back to /api/v1/auth/callback/google
  4. Backend fetches user profile, upserts user in DB
  5. Backend issues JWT cookies and redirects to frontend /oauth/session-bridge
  6. Frontend session bridge calls NextAuth signIn to create client session

Error handling:
  - All provider errors redirect to /login?error=<code>
  - Never expose raw error details to browser
"""
from __future__ import annotations

from datetime import timedelta
from urllib.parse import urljoin

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from loguru import logger
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.rate_limit import safe_rate_limiter
from app.core.security import create_access_token, create_refresh_token
from app.db.database import get_db
from app.services.oauth import sync_oauth_user
from app.services.redis_store import RefreshTokenStore, new_jti

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

oauth = OAuth()

# ── Provider registration ─────────────────────────────────────────────────────

if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    logger.info("Google OAuth provider registered")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _cookie_options() -> dict:
    return {
        "httponly": True,
        "secure": settings.is_production,
        "samesite": "lax",
        "path": "/",
    }


def _error_redirect(code: str) -> RedirectResponse:
    """Redirect to frontend login page with a human-readable error code."""
    return RedirectResponse(
        url=f"{settings.FRONTEND_BASE_URL}/login?error={code}",
        status_code=302,
    )


def _build_callback_uri(request: Request, callback_name: str, callback_path: str) -> str:
    """
    Build OAuth callback URI using configured backend base URL when available.
    This prevents redirect_uri_mismatch when app is behind proxies/CDNs.
    """
    if settings.BACKEND_BASE_URL:
        base = settings.BACKEND_BASE_URL.rstrip("/") + "/"
        return urljoin(base, callback_path.lstrip("/"))
    return str(request.url_for(callback_name))


async def _issue_cookies_and_redirect(
    *,
    redis: Redis | None,
    user_id: str,
) -> RedirectResponse:
    """
    Issues secure JWT cookies and redirects to the frontend session-bridge page.
    The session-bridge page then calls NextAuth signIn("credentials") so that
    the NextAuth client session is hydrated from the cookies we just set here.

    If Redis is unavailable, refresh tokens are skipped (access-only mode).
    """
    access = create_access_token({"sub": user_id})

    resp = RedirectResponse(
        url=f"{settings.FRONTEND_BASE_URL}/oauth/session-bridge",
        status_code=302,
    )
    opts = _cookie_options()
    resp.set_cookie(
        "access_token", access,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **opts,
    )

    # Refresh token requires Redis — degrade gracefully if unavailable
    if redis is not None:
        try:
            refresh_jti = new_jti()
            store = RefreshTokenStore(redis)
            await store.allow(
                user_id=user_id,
                jti=refresh_jti,
                ttl=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )
            refresh = create_refresh_token({"sub": user_id, "jti": refresh_jti})
            resp.set_cookie(
                "refresh_token", refresh,
                max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
                **opts,
            )
        except Exception as exc:
            logger.warning(f"Failed to issue refresh token (Redis error): {exc}")

    return resp


def get_redis(request: Request) -> Redis | None:
    return getattr(request.app.state, "redis", None)


# ── Google ─────────────────────────────────────────────────────────────────────

@router.get("/login/google")
async def login_google(
    request: Request,
    _rl=Depends(safe_rate_limiter(times=20, seconds=60)),
):
    if not getattr(oauth, "google", None):
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    redirect_uri = _build_callback_uri(
        request,
        "callback_google",
        "/api/v1/auth/callback/google",
    )
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback/google", name="callback_google")
async def callback_google(
    request: Request,
    db: Session = Depends(get_db),
    redis: Redis | None = Depends(get_redis),
):
    try:
        token = await oauth.google.authorize_access_token(request)
        # parse_id_token is reliable for Google (always returns OIDC id_token)
        id_info = token.get("userinfo") or await oauth.google.userinfo(token=token)
    except OAuthError as exc:
        logger.warning(f"Google OAuth error: {exc}")
        return _error_redirect("google_auth_failed")
    except Exception as exc:
        logger.error(f"Google callback unexpected error: {exc}")
        return _error_redirect("google_internal_error")

    email = id_info.get("email")
    if not email:
        return _error_redirect("google_no_email")

    try:
        user_id = sync_oauth_user(
            db,
            email=email,
            name=id_info.get("name"),
            avatar_url=id_info.get("picture"),
            provider_id=id_info.get("sub", email),
            provider="google",
        )
    except Exception as exc:
        logger.error(f"Google user sync error: {exc}")
        return _error_redirect("user_sync_failed")

    return await _issue_cookies_and_redirect(redis=redis, user_id=user_id)


# ── OAuth status endpoint (for frontend health check) ─────────────────────────

@router.get("/providers")
def list_providers():
    """Returns which OAuth providers are configured (for frontend login UI)."""
    return {
        "google": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
    }
