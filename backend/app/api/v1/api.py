from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import auth, scans, users, reports, notifications, projects, dashboard, risk

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(scans.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(projects.router)
api_router.include_router(dashboard.router)
api_router.include_router(risk.router)

