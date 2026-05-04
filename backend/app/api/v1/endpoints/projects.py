from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.project import Project
from app.models.scan import Scan

router = APIRouter(prefix="/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)


class ProjectOut(BaseModel):
    project_id: str
    name: str
    description: Optional[str]
    risk_level: str
    scan_count: int
    open_finding_count: int
    is_archived: bool
    created_at: str


class ProjectDetailOut(ProjectOut):
    recent_scans: List[dict]


def _to_out(p: Project) -> ProjectOut:
    return ProjectOut(
        project_id=p.id,
        name=p.name,
        description=p.description,
        risk_level=p.risk_level,
        scan_count=p.scan_count or 0,
        open_finding_count=p.open_finding_count or 0,
        is_archived=p.is_archived,
        created_at=p.created_at.isoformat() if p.created_at else "",
    )


# ── POST /projects ────────────────────────────────────────────────────────────
@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: CreateProjectRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = Project(
        name=body.name,
        description=body.description,
        owner_id=user.id,
        risk_level="low",
        scan_count=0,
        open_finding_count=0,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return _to_out(proj)


# ── GET /projects ─────────────────────────────────────────────────────────────
@router.get("")
def list_projects(
    include_archived: bool = Query(default=False),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    q = db.query(Project).filter(Project.owner_id == user.id)
    if not include_archived:
        q = q.filter(Project.is_archived == False)  # noqa: E712
    total = q.count()
    projects = q.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [_to_out(p) for p in projects]}


# ── GET /projects/{id} ────────────────────────────────────────────────────────
@router.get("/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    recent_scans = (
        db.query(Scan)
        .filter(Scan.project_id == project_id, Scan.is_archived == False)  # noqa: E712
        .order_by(Scan.created_at.desc())
        .limit(10)
        .all()
    )
    scans_data = [
        {
            "scan_id": s.id,
            "target": s.target,
            "scan_type": s.scan_type,
            "risk_level": s.risk_level,
            "score": s.pii_risk_score,
            "cvss_max_score": s.cvss_max_score,
            "finding_count": s.finding_count,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        }
        for s in recent_scans
    ]

    base = _to_out(proj)
    return {
        **base.model_dump(),
        "recent_scans": scans_data,
    }


# ── PATCH /projects/{id} ──────────────────────────────────────────────────────
@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    body: UpdateProjectRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id, Project.is_archived == False  # noqa: E712
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if body.name is not None:
        proj.name = body.name
    if body.description is not None:
        proj.description = body.description
    db.commit()
    db.refresh(proj)
    return _to_out(proj)


# ── DELETE /projects/{id} ─────────────────────────────────────────────────────
@router.delete("/{project_id}", status_code=204)
def archive_project(
    project_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    proj.is_archived = True
    db.commit()
    return None


# ── GET /projects/{id}/scans ──────────────────────────────────────────────────
@router.get("/{project_id}/scans")
def list_project_scans(
    project_id: str,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    q = db.query(Scan).filter(
        Scan.project_id == project_id,
        Scan.is_archived == False,  # noqa: E712
    )
    total = q.count()
    scans = q.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "scan_id": s.id,
                "target": s.target,
                "scan_type": s.scan_type,
                "risk_level": s.risk_level,
                "score": s.pii_risk_score,
                "cvss_max_score": s.cvss_max_score,
                "finding_count": s.finding_count,
                "duration_ms": s.duration_ms,
                "created_at": s.created_at.isoformat() if s.created_at else "",
            }
            for s in scans
        ],
    }
