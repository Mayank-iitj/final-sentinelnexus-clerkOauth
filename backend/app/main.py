from __future__ import annotations

import sys
import time
import uuid
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
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.api import api_router
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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        response.headers[
            "Content-Security-Policy"
        ] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        start = time.time()
        try:
            response = await call_next(request)
        finally:
            duration_ms = int((time.time() - start) * 1000)
            logger.bind(
                request_id=req_id,
                method=request.method,
                path=str(request.url.path),
                duration_ms=duration_ms,
            ).info("request")
        response.headers["X-Request-Id"] = req_id
        return response


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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    app.include_router(api_router)

    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    @app.on_event("startup")
    async def _startup() -> None:
        # Initialize database tables if they don't exist (for development)
        try:
            from app.db.database import Base
            from app.models import governance
            from app.models import threat
            from app.models import scan
            from app.models import project
            from app.models import alert
            from app.models import report
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized")
        except Exception as e:
            if "already exists" not in str(e):
                logger.error(f"Failed to initialize database tables: {e}")
        
        try:
            # Redis (shared)
            redis: Redis = redis_from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            await redis.ping()
            app.state.redis = redis

            # Rate limiter — mark as ready only on success
            await FastAPILimiter.init(redis)
            mark_limiter_ready()
            logger.info("Connected to Redis successfully — rate limiter active")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis. Rate limiting/cache disabled. {str(e).splitlines()[0]}")
            app.state.redis = None

        # DB connectivity sanity check early
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")

        logger.info("startup complete")

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        redis: Redis | None = getattr(app.state, "redis", None)
        if redis is not None:
            await redis.aclose()

    @app.get("/", include_in_schema=False)
    async def root() -> Dict[str, str]:
        return {"status": "ok", "app": settings.APP_NAME}

    @app.get("/health", include_in_schema=False)
    async def health() -> Dict[str, Any]:
        status_str = "healthy"

        # DB
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
            db = "ok"
        except Exception:
            db = "error"
            status_str = "degraded"

        # Redis
        try:
            redis: Redis = app.state.redis
            pong = await redis.ping()
            redis_status = "ok" if pong else "error"
        except Exception:
            redis_status = "unavailable"
            status_str = "degraded"

        return {"status": status_str, "db": db, "redis": redis_status}

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
        
        # Don't expose internal error details in production
        if settings.is_production:
            detail = "Internal server error"
        else:
            detail = f"{type(exc).__name__}: {str(exc)}"
        
        return JSONResponse(
            status_code=500,
            content={"detail": detail, "status_code": 500}
        )

    return app


app = create_app()
