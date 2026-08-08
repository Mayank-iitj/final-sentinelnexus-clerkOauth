from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.scan import Scan
from app.services.dedup import deduplicate
from app.services.notification_service import create_alerts_from_scan
from app.services.scanners.code_scanner import CodeSecurityScanner
from app.services.scanners.prompt_scanner import PromptInjectionScanner
from app.services.scanners.text_scanner import TextScanner

router = APIRouter(prefix="/scans", tags=["scans"])


# ── Request / Response schemas ────────────────────────────────────────────────
class ScanRequest(BaseModel):
    target: str = Field(description="Identifier for the scan target (repo URL, filename, label)")
    content: str = Field(min_length=1, description="Content to scan: source code, prompt text, or free text")
    scan_type: str = Field(default="code", pattern="^(code|prompt|text)$", description="code | prompt | text")
    project_id: Optional[str] = Field(default=None, description="Optional project UUID to associate this scan")


class FindingOut(BaseModel):
    finding_type: str
    severity: str
    cvss_score: float
    cvss_vector: str
    cwe: Optional[str]
    message: str
    evidence: str
    line_number: Optional[int]
    remediation: str
    fingerprint: str


class ScanOut(BaseModel):
    scan_id: str
    scan_type: str
    risk_level: str
    score: int
    cvss_max: Optional[float]
    finding_count: int
    duration_ms: int
    findings: List[FindingOut]


class ScanListItem(BaseModel):
    scan_id: str
    target: str
    scan_type: str
    status: str
    risk_level: str
    score: int
    cvss_max_score: Optional[float]
    finding_count: int
    created_at: str


# ── Dispatcher ────────────────────────────────────────────────────────────────
def _dispatch_scan(scan_type: str, content: str, target: str) -> tuple[List[dict], int, str]:
    """Run the appropriate scanner; return (findings_dicts, score, risk_level)."""
    if scan_type == "code":
        findings_objs, score = CodeSecurityScanner.scan_code(content, target=target)
        risk_level = CodeSecurityScanner.get_risk_level(score)
        findings_dicts = [f.to_dict() for f in findings_objs]
    elif scan_type == "prompt":
        findings_objs, score = PromptInjectionScanner.scan_prompt(content, target=target)
        risk_level = PromptInjectionScanner.get_risk_level(score)
        findings_dicts = [f.to_dict() for f in findings_objs]
    elif scan_type == "text":
        findings_objs, score = TextScanner.scan_text(content, target=target)
        risk_level = TextScanner.get_risk_level(score)
        findings_dicts = [f.to_dict() for f in findings_objs]
    else:
        raise ValueError(f"Unknown scan_type: {scan_type}")

    return findings_dicts, score, risk_level


# ── POST /scans  (unified entry) ───────────────────────────────────────────────
@router.post("", response_model=ScanOut)
def run_scan(
    body: ScanRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    from app.core.subscription import get_user_limits
    from datetime import datetime, timedelta, timezone

    limits = get_user_limits(user.subscription_tier)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_scans = db.query(Scan).filter(Scan.user_id == user.id, Scan.created_at >= thirty_days_ago).count()
    
    if recent_scans >= limits["scans_month"]:
        raise HTTPException(status_code=403, detail="Monthly scan limit reached. Please upgrade your plan to run more scans.")

    t_start = time.monotonic()

    try:
        findings, score, risk_level = _dispatch_scan(body.scan_type, body.content, body.target)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Scan engine error: {exc}")

    duration_ms = int((time.monotonic() - t_start) * 1000)

    cvss_scores = [f.get("cvss_score", 0.0) for f in findings if f.get("cvss_score") is not None]
    cvss_max = max(cvss_scores) if cvss_scores else None

    # Validate project_id belongs to user (if provided)
    project_id: Optional[str] = None
    if body.project_id:
        from app.models.project import Project
        proj = db.query(Project).filter(
            Project.id == body.project_id,
            Project.owner_id == user.id,
            Project.is_archived == False,  # noqa: E712
        ).first()
        if proj is None:
            raise HTTPException(status_code=404, detail="Project not found")
        project_id = proj.id

    scan = Scan(
        user_id=user.id,
        project_id=project_id,
        target=body.target,
        scan_type=body.scan_type,
        status="completed",
        pii_risk_score=score,
        risk_level=risk_level,
        cvss_max_score=cvss_max,
        finding_count=len(findings),
        duration_ms=duration_ms,
        result=json.dumps({"findings": findings, "score": score}),
        meta={"engine": f"{body.scan_type}_scanner_v2", "finding_count": len(findings)},
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Auto-notifications for high/critical findings
    if findings:
        create_alerts_from_scan(
            db,
            scan_id=scan.id,
            user_id=user.id,
            target=body.target,
            findings=findings,
            threshold_severity="high",
        )

    # Update project stats
    if project_id:
        _update_project_stats(db, project_id=project_id, findings=findings, risk_level=risk_level)

    return ScanOut(
        scan_id=scan.id,
        scan_type=scan.scan_type,
        risk_level=risk_level,
        score=score,
        cvss_max=cvss_max,
        finding_count=len(findings),
        duration_ms=duration_ms,
        findings=[FindingOut(**f) for f in findings],
    )


# Keep legacy /code endpoint for backward compatibility
@router.post("/code", response_model=ScanOut, include_in_schema=False)
def scan_code_legacy(
    body: ScanRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    body_dict = body.model_dump()
    body_dict["scan_type"] = "code"
    return run_scan(ScanRequest(**body_dict), db=db, user=user)


# ── GET /scans  (list with filters) ──────────────────────────────────────────
@router.get("", tags=["scans"])
def list_scans(
    scan_type: Optional[str] = Query(default=None, pattern="^(code|prompt|text)$"),
    project_id: Optional[str] = Query(default=None),
    risk_level: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    q = db.query(Scan).filter(Scan.user_id == user.id, Scan.is_archived == False)  # noqa: E712
    if scan_type:
        q = q.filter(Scan.scan_type == scan_type)
    if project_id:
        q = q.filter(Scan.project_id == project_id)
    if risk_level:
        q = q.filter(Scan.risk_level == risk_level)
    total = q.count()
    scans = q.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            ScanListItem(
                scan_id=s.id,
                target=s.target,
                scan_type=s.scan_type,
                status=s.status,
                risk_level=s.risk_level,
                score=s.pii_risk_score,
                cvss_max_score=s.cvss_max_score,
                finding_count=s.finding_count,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
            for s in scans
        ],
    }


# ── GET /scans/{id}  (detail) ─────────────────────────────────────────────────
@router.get("/{scan_id}")
def get_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    result = json.loads(scan.result or "{}")
    return {
        "scan_id": scan.id,
        "target": scan.target,
        "scan_type": scan.scan_type,
        "status": scan.status,
        "risk_level": scan.risk_level,
        "score": scan.pii_risk_score,
        "cvss_max_score": scan.cvss_max_score,
        "finding_count": scan.finding_count,
        "duration_ms": scan.duration_ms,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
        "project_id": scan.project_id,
        "findings": result.get("findings", []),
    }


# ── DELETE /scans/{id}  (archive) ─────────────────────────────────────────────
@router.delete("/{scan_id}", status_code=204)
def archive_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan.is_archived = True
    db.commit()
    return None


def _update_project_stats(db: Session, *, project_id: str, findings: list, risk_level: str) -> None:
    from app.models.project import Project
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        return
    proj.scan_count = (proj.scan_count or 0) + 1
    high_crit = sum(1 for f in findings if f.get("severity") in ("high", "critical"))
    proj.open_finding_count = (proj.open_finding_count or 0) + high_crit
    _risk_ord = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    if _risk_ord.get(risk_level, 0) > _risk_ord.get(proj.risk_level, 0):
        proj.risk_level = risk_level
    db.commit()
