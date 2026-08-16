from __future__ import annotations

import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from loguru import logger
from prometheus_fastapi_instrumentator import Instrumentator
from redis.asyncio import Redis
from redis.asyncio import from_url as redis_from_url
from starlette.datastructures import MutableHeaders
from starlette.middleware.sessions import SessionMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import ASGIApp, Receive, Scope, Send

from app.api.v1.api import api_router
from app.middleware.security_middleware import SecurityMiddleware
from app.core.config import get_settings
from app.core.rate_limit import mark_limiter_ready
from app.db.database import engine

settings = get_settings()


def _configure_logging() -> None:
    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG" if settings.DEBUG else "INFO",
        serialize=not settings.DEBUG,
    )


class SecurityHeadersMiddleware:
    """
    Pure ASGI middleware — intercepts http.response.start to inject security
    headers WITHOUT buffering the response body.

    IMPORTANT: BaseHTTPMiddleware.call_next() buffers streaming responses which
    breaks SSE/StreamingResponse. This pure ASGI implementation avoids that.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
                headers["Permissions-Policy"] = "geolocation=(), microphone=()"
                headers["Content-Security-Policy"] = (
                    "default-src 'self'; img-src 'self' data:; "
                    "style-src 'self' 'unsafe-inline'; script-src 'self'"
                )
            await send(message)

        await self.app(scope, receive, send_with_headers)


class RequestLoggingMiddleware:
    """
    Pure ASGI request logging middleware — does NOT buffer streaming responses.
    Logs method, path, duration and injects X-Request-Id.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        req_id = dict(scope.get("headers", [])).get(b"x-request-id", b"").decode() or str(uuid.uuid4())
        start = time.time()

        async def send_with_request_id(message: dict) -> None:
            if message["type"] == "http.response.start":
                duration_ms = int((time.time() - start) * 1000)
                logger.bind(
                    request_id=req_id,
                    method=scope.get("method", ""),
                    path=scope.get("path", ""),
                    duration_ms=duration_ms,
                ).info("request")
                headers = MutableHeaders(scope=message)
                headers["X-Request-Id"] = req_id
            await send(message)

        await self.app(scope, receive, send_with_request_id)


def create_app() -> FastAPI:
    _configure_logging()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI Compliance & Risk Intelligence Platform",
        openapi_tags=[
            {"name": "auth", "description": "Authentication & OAuth"},
            {"name": "users", "description": "User profile"},
            {"name": "scans", "description": "Security scanning"},
        ],
    )

    app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

    app.add_middleware(SecurityHeadersMiddleware)

    # ── SecurityMiddleware ────────────────────────────────────────────────────
    # SECURITY_SHADOW_MODE=true in ALL environments until explicitly changed.
    app.add_middleware(SecurityMiddleware)

    app.add_middleware(RequestLoggingMiddleware)

    # CORSMiddleware MUST be the outermost middleware (added last in Starlette)
    # so that it wraps all inner middlewares (including SecurityMiddleware).
    # This guarantees CORS headers are present even on 400/500 error responses.
    # CORSMiddleware will be wrapped at the ASGI app level below to ensure 
    # it sits outside ServerErrorMiddleware.

    app.include_router(api_router)

    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    return app


@asynccontextmanager
async def _lifespan(app: FastAPI):
    """Modern FastAPI lifespan — replaces the deprecated @app.on_event pattern."""
    # ── Startup ────────────────────────────────────────────────────────────────
    # Run Alembic migrations to HEAD on every startup.
    # Entire block is non-fatal — a DB connection failure must NEVER crash workers.
    from alembic.config import Config
    from alembic import command as alembic_command

    # Resolve alembic.ini relative to the backend package, not the process CWD.
    # "alembic.ini" only worked if the server happened to be started from
    # backend/; under any other CWD Alembic silently loaded nothing, migrations
    # were skipped, and the schema drifted from the models.
    from pathlib import Path

    _backend_root = Path(__file__).resolve().parent.parent
    alembic_cfg = Config(str(_backend_root / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(_backend_root / "alembic"))
    try:
        alembic_command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations applied successfully (alembic upgrade head)")
    except Exception as alembic_err:
        logger.warning(f"Alembic upgrade skipped or failed (non-fatal): {str(alembic_err).splitlines()[0]}")
        # Fallback: attempt create_all — also non-fatal
        try:
            from app.db.database import Base
            from app.models import governance, threat, scan, project, alert, report  # noqa: F401
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables ensured via create_all fallback")
        except Exception as create_err:
            logger.warning(f"create_all fallback also failed (non-fatal): {str(create_err).splitlines()[0]}")

    # ── Schema safety net ──────────────────────────────────────────────────
    # Idempotently add columns that were introduced in migration dcce824fc07a
    # but may not exist if Alembic failed or was bypassed.  PostgreSQL's
    # IF NOT EXISTS makes these no-ops when already present.
    _schema_patches = [
        "ALTER TABLE scans ADD COLUMN IF NOT EXISTS trust_score INTEGER",
        "ALTER TABLE scans ADD COLUMN IF NOT EXISTS compliance_frameworks JSONB",
        "ALTER TABLE scans ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT '{}'",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT '{}'",
        "ALTER TABLE alerts ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT '{}'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(2048)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(32)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider2 VARCHAR(32)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id2 VARCHAR(255)",
    ]
    try:
        with engine.begin() as conn:
            for patch_sql in _schema_patches:
                try:
                    conn.exec_driver_sql(patch_sql)
                except Exception as col_err:
                    # Column may already exist with different constraints — skip
                    logger.debug(f"Schema patch skipped: {str(col_err).splitlines()[0]}")
        logger.info("Schema safety patches applied")
    except Exception as patch_err:
        logger.warning(f"Schema safety patches failed (non-fatal): {str(patch_err).splitlines()[0]}")

    try:
        # Redis (shared)
        # Timeouts matter for a managed/remote Redis: without them a network
        # black-hole hangs startup indefinitely and the deploy never goes live.
        redis: Redis = redis_from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,
        )
        await redis.ping()
        app.state.redis = redis

        # Rate limiter — mark as ready only on success
        await FastAPILimiter.init(redis)
        mark_limiter_ready()
        logger.info("Connected to Redis successfully — rate limiter active")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis. Rate limiting/cache disabled. {str(e).splitlines()[0]}")
        app.state.redis = None

    # DB connectivity sanity check — non-fatal, logs warning on failure
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        logger.info("Database connection verified")
    except Exception as e:
        logger.warning(f"DB sanity check failed (non-fatal, will retry on first request): {str(e).splitlines()[0]}")

    logger.info("startup complete")

    yield  # ── application runs ──────────────────────────────────────────────

    # ── Shutdown ───────────────────────────────────────────────────────────────
    redis_conn: Redis | None = getattr(app.state, "redis", None)
    if redis_conn is not None:
        await redis_conn.aclose()


def create_app() -> FastAPI:
    _configure_logging()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI Compliance & Risk Intelligence Platform",
        lifespan=_lifespan,
        openapi_tags=[
            {"name": "auth", "description": "Authentication & OAuth"},
            {"name": "users", "description": "User profile"},
            {"name": "scans", "description": "Security scanning"},
        ],
    )

    app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

    app.add_middleware(SecurityHeadersMiddleware)

    # ── SecurityMiddleware ────────────────────────────────────────────────────
    # SECURITY_SHADOW_MODE=true in ALL environments until explicitly changed.
    app.add_middleware(SecurityMiddleware)

    app.add_middleware(RequestLoggingMiddleware)

    # CORSMiddleware MUST be the outermost middleware (added last in Starlette)
    # so that it wraps all inner middlewares (including SecurityMiddleware).
    # This guarantees CORS headers are present even on 400/500 error responses.
    # CORSMiddleware will be wrapped at the ASGI app level below to ensure
    # it sits outside ServerErrorMiddleware.

    app.include_router(api_router)

    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    @app.get("/", include_in_schema=False)
    async def root() -> Dict[str, str]:
        return {"status": "ok", "app": settings.APP_NAME}

    # GET and HEAD: uptime probes (UptimeRobot, Render) often send HEAD, which
    # a GET-only route answers with 405 — a false outage.
    @app.api_route("/health", methods=["GET", "HEAD"], include_in_schema=False)
    async def health() -> JSONResponse:
        # Two tiers, because they mean different things to Render's health check:
        #   "unhealthy" -> 503, the service cannot serve requests (DB is down).
        #   "degraded"  -> 200, reduced capability but still serving. Returning
        #                  503 here would make Render roll back deploys over a
        #                  non-fatal dependency like a cold cache.
        db_ok = True
        redis_ok = True

        # DB — critical.
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
            db = "ok"
        except Exception as exc:
            logger.error(f"Health check: database unreachable: {exc}")
            db = "error"
            db_ok = False

        # Redis — non-critical.
        try:
            redis: Redis = app.state.redis
            pong = await redis.ping()
            redis_status = "ok" if pong else "error"
            redis_ok = bool(pong)
        except Exception as exc:
            logger.warning(f"Health check: redis unavailable: {exc}")
            redis_status = "unavailable"
            redis_ok = False

        # LLM — non-critical, but the most common misconfiguration in prod.
        key = settings.OPENROUTER_API_KEY
        llm = "ok" if key and not key.startswith("{{") else "unconfigured"

        if not db_ok:
            status_str = "unhealthy"
        elif not redis_ok or llm != "ok":
            status_str = "degraded"
        else:
            status_str = "healthy"

        return JSONResponse(
            status_code=503 if status_str == "unhealthy" else 200,
            content={
                "status": status_str,
                "db": db,
                "redis": redis_status,
                "llm": llm,
                "env": settings.ENV,
            },
        )

    # Global exception handlers
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "status_code": exc.status_code}
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": [
                    {"field": str(e["loc"]), "message": e["msg"]}
                    for e in exc.errors()
                ]
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {type(exc).__name__}: {exc}", exc_info=True)
        # Always return full detail — hides nothing, makes debugging possible.
        # Sensitive info is not in exception messages (only in DB rows).
        detail = f"{type(exc).__name__}: {str(exc)}"
        return JSONResponse(
            status_code=500,
            content={"detail": detail, "status_code": 500}
        )

    return app


app = create_app()

# Wrap the FastAPI app instance in CORSMiddleware at the ASGI level.
# This ensures CORSMiddleware is OUTSIDE Starlette's built-in ServerErrorMiddleware.
# Any exception that bubbles up and becomes a 500 will now correctly get CORS headers.
app = CORSMiddleware(
    app=app,
    allow_origins=settings.parsed_allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.mayyanks\.app$|^http://localhost:\d+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "x-clerk-auth-reason",
        "x-clerk-auth-token",
    ],
)


class _AsgiErrorCatcher:
    """
    Outermost ASGI wrapper that guarantees a JSON body on ANY unhandled
    exception — including ones that escape Starlette's ServerErrorMiddleware
    (e.g. errors during middleware startup or in a CORSMiddleware code path).
    Without this, gunicorn's default 500 handler emits plain-text
    'Internal Server Error' with no CORS or Content-Type headers.
    """

    def __init__(self, asgi_app: Any) -> None:
        self.app = asgi_app

    def __getattr__(self, name: str) -> Any:
        return getattr(self.app, name)

    async def __call__(self, scope: Dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except Exception as exc:  # noqa: BLE001
            logger.error(
                f"[AsgiErrorCatcher] unhandled exception: "
                f"{type(exc).__name__}: {exc}",
                exc_info=True,
            )
            body = (
                f'{{"detail":"{type(exc).__name__}: '
                + str(exc).replace('"', "'")[:300]
                + '","status_code":500}}'
            ).encode()
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode()),
                    (b"access-control-allow-origin", b"*"),
                ],
            })
            await send({"type": "http.response.body", "body": body})


app = _AsgiErrorCatcher(app)
