from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.alert import Alert
from app.models.project import Project
from app.models.scan import Scan

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Returns real DB-computed dashboard statistics for the authenticated user.
    No hardcoded numbers — all values are live queries.
    """
    user_id = user.id
    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d  = now - timedelta(days=7)

    # ── Scans in last 24 hours ────────────────────────────────────────────────
    scans_24h = (
        db.query(Scan)
        .filter(
            Scan.user_id == user_id,
            Scan.created_at >= last_24h,
            Scan.is_archived == False,  # noqa: E712
        )
        .count()
    )

    # ── Open high/critical findings (unread alerts) ───────────────────────────
    open_risks = (
        db.query(Alert)
        .filter(
            Alert.user_id == user_id,
            Alert.is_read == False,  # noqa: E712
            Alert.severity.in_(["high", "critical"]),
        )
        .count()
    )

    # ── Unread notifications ───────────────────────────────────────────────────
    unread_notifications = (
        db.query(Alert)
        .filter(Alert.user_id == user_id, Alert.is_read == False)  # noqa: E712
        .count()
    )

    # ── Compliance score ───────────────────────────────────────────────────────
    # Definition: % of scans in last 7 days with zero critical findings.
    scans_7d = (
        db.query(Scan)
        .filter(
            Scan.user_id == user_id,
            Scan.created_at >= last_7d,
            Scan.is_archived == False,  # noqa: E712
            Scan.status == "completed",
        )
        .all()
    )
    if scans_7d:
        clean = sum(1 for s in scans_7d if (s.risk_level or "low") not in ("critical", "high"))
        compliance_score = round((clean / len(scans_7d)) * 100)
    else:
        compliance_score = 100  # No scans = nothing violated

    # ── Severity distribution across all scans ────────────────────────────────
    all_alerts = (
        db.query(Alert)
        .filter(Alert.user_id == user_id)
        .all()
    )
    sev_dist: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for a in all_alerts:
        sev = a.severity or "low"
        sev_dist[sev] = sev_dist.get(sev, 0) + 1

    # ── Recent scans (latest 5) ───────────────────────────────────────────────
    recent_scans_rows = (
        db.query(Scan)
        .filter(Scan.user_id == user_id, Scan.is_archived == False)  # noqa: E712
        .order_by(Scan.created_at.desc())
        .limit(5)
        .all()
    )
    recent_scans = [
        {
            "scan_id":      s.id,
            "target":       s.target,
            "scan_type":    s.scan_type,
            "risk_level":   s.risk_level,
            "score":        s.pii_risk_score,
            "cvss_max":     s.cvss_max_score,
            "finding_count":s.finding_count,
            "created_at":   s.created_at.isoformat() if s.created_at else "",
        }
        for s in recent_scans_rows
    ]

    # ── Recent unread alerts (latest 5) ──────────────────────────────────────
    recent_alerts_rows = (
        db.query(Alert)
        .filter(Alert.user_id == user_id)
        .order_by(Alert.created_at.desc())
        .limit(5)
        .all()
    )
    recent_alerts = [
        {
            "id":         a.id,
            "title":      a.title,
            "severity":   a.severity,
            "cvss_score": a.cvss_score,
            "alert_type": a.alert_type,
            "is_read":    a.is_read,
            "link":       a.link,
            "created_at": a.created_at.isoformat() if a.created_at else "",
        }
        for a in recent_alerts_rows
    ]

    # ── Active projects ───────────────────────────────────────────────────────
    active_projects = (
        db.query(Project)
        .filter(Project.owner_id == user_id, Project.is_archived == False)  # noqa: E712
        .count()
    )

    # ── Total scans ever ─────────────────────────────────────────────────────
    total_scans = (
        db.query(Scan)
        .filter(Scan.user_id == user_id, Scan.is_archived == False)  # noqa: E712
        .count()
    )

    return {
        "scans_last_24h":       scans_24h,
        "total_scans":          total_scans,
        "open_risks":           open_risks,
        "unread_notifications": unread_notifications,
        "compliance_score":     compliance_score,
        "severity_distribution":sev_dist,
        "active_projects":      active_projects,
        "recent_scans":         recent_scans,
        "recent_alerts":        recent_alerts,
    }
