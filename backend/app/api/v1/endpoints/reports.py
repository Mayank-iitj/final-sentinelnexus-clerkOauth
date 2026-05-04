from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.report import Report
from app.models.scan import Scan
from app.services.report_service import generate_report_for_scan, REPORTS_DIR

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportOut(BaseModel):
    report_id: str
    scan_id: str
    status: str
    format: str
    finding_count: int
    max_cvss: Optional[float]
    file_size_bytes: Optional[int]
    created_at: str
    download_url: str


def _bg_generate(
    *,
    report_id: str,
    scan_id: str,
    scan_target: str,
    scan_type: str,
    result_json: str,
    risk_score: int,
    risk_level: str,
    user_name: str,
    project_name: Optional[str],
    db_url: str,
) -> None:
    """Background task: generate PDF and update DB record."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url, pool_pre_ping=True)
    Session_ = sessionmaker(bind=engine)
    db = Session_()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return

        file_path, size = generate_report_for_scan(
            scan_id=scan_id,
            scan_target=scan_target,
            scan_type=scan_type,
            result_json=result_json,
            risk_score=risk_score,
            risk_level=risk_level,
            user_name=user_name,
            project_name=project_name,
        )
        report.status = "ready"
        report.file_path = file_path
        report.file_size_bytes = size
        db.commit()
    except Exception as exc:
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = "error"
            report.error_message = str(exc)[:500]
            db.commit()
    finally:
        db.close()


# ── POST /reports/generate/{scan_id} ─────────────────────────────────────────
@router.post("/generate/{scan_id}", response_model=ReportOut, status_code=202)
def generate_report(
    scan_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan has not completed yet")

    # Idempotency: return existing ready report for the same scan
    existing = (
        db.query(Report)
        .filter(Report.scan_id == scan_id, Report.user_id == user.id, Report.status == "ready")
        .order_by(Report.created_at.desc())
        .first()
    )
    if existing:
        return _report_to_out(existing)

    import json
    import re as re_std
    findings_count = scan.finding_count or 0
    cvss_max = scan.cvss_max_score

    report = Report(
        scan_id=scan_id,
        user_id=user.id,
        format="pdf",
        status="generating",
        finding_count=findings_count,
        max_cvss=cvss_max,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    from app.core.config import get_settings
    settings = get_settings()

    project_name: Optional[str] = None
    if scan.project_id:
        from app.models.project import Project
        proj = db.query(Project).filter(Project.id == scan.project_id).first()
        if proj:
            project_name = proj.name

    user_name = user.full_name or user.username or user.email

    background_tasks.add_task(
        _bg_generate,
        report_id=report.id,
        scan_id=scan_id,
        scan_target=scan.target,
        scan_type=scan.scan_type or "code",
        result_json=scan.result or "{}",
        risk_score=scan.pii_risk_score,
        risk_level=scan.risk_level,
        user_name=user_name,
        project_name=project_name,
        db_url=settings.DATABASE_URL,
    )

    return _report_to_out(report)


# ── GET /reports ──────────────────────────────────────────────────────────────
@router.get("", tags=["reports"])
def list_reports(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
    limit: int = 20,
    offset: int = 0,
):
    total = db.query(Report).filter(Report.user_id == user.id).count()
    reports = (
        db.query(Report)
        .filter(Report.user_id == user.id)
        .order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "items": [_report_to_out(r) for r in reports],
    }


# ── GET /reports/{id} ─────────────────────────────────────────────────────────
@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _report_to_out(report)


# ── GET /reports/{id}/download ────────────────────────────────────────────────
@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")
    if not report.file_path:
        raise HTTPException(status_code=500, detail="Report file path missing")

    full_path = REPORTS_DIR / report.file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    return FileResponse(
        path=str(full_path),
        media_type="application/pdf",
        filename=f"sentinelnexus_report_{report.scan_id[:8]}.pdf",
    )


def _report_to_out(r: Report) -> ReportOut:
    return ReportOut(
        report_id=r.id,
        scan_id=r.scan_id,
        status=r.status,
        format=r.format,
        finding_count=r.finding_count or 0,
        max_cvss=r.max_cvss,
        file_size_bytes=r.file_size_bytes,
        created_at=r.created_at.isoformat() if r.created_at else "",
        download_url=f"/api/v1/reports/{r.id}/download",
    )
