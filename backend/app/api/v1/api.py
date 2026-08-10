from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    dashboard,
    projects,
    scans,
    users,
    reports,
    notifications,
    risk,
    governance,
    threat_intel,
    trust,
    security,
    payments,
    ai_agents,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(scans.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(projects.router)
api_router.include_router(dashboard.router)
api_router.include_router(risk.router)
api_router.include_router(governance.router)
api_router.include_router(threat_intel.router)
api_router.include_router(trust.router)
api_router.include_router(security.router)
api_router.include_router(payments.router)
api_router.include_router(ai_agents.router)
