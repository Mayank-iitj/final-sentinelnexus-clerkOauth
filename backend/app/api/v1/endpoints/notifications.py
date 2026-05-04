from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.alert import Alert

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    id: str
    alert_type: str
    severity: str
    cvss_score: Optional[float]
    title: str
    description: Optional[str]
    link: Optional[str]
    is_read: bool
    scan_id: Optional[str]
    created_at: str


def _to_out(a: Alert) -> NotificationOut:
    return NotificationOut(
        id=a.id,
        alert_type=a.alert_type,
        severity=a.severity,
        cvss_score=a.cvss_score,
        title=a.title,
        description=a.description,
        link=a.link,
        is_read=a.is_read,
        scan_id=a.scan_id,
        created_at=a.created_at.isoformat() if a.created_at else "",
    )


# ── GET /notifications/count (unread) ────────────────────────────────────────
@router.get("/count")
def get_unread_count(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    count = db.query(Alert).filter(
        Alert.user_id == user.id,
        Alert.is_read == False,  # noqa: E712
    ).count()
    return {"unread": count}


# ── GET /notifications ────────────────────────────────────────────────────────
@router.get("")
def list_notifications(
    unread_only: bool = Query(default=False),
    severity: Optional[str] = Query(default=None),
    limit: int = Query(default=30, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    q = db.query(Alert).filter(Alert.user_id == user.id)
    if unread_only:
        q = q.filter(Alert.is_read == False)  # noqa: E712
    if severity:
        q = q.filter(Alert.severity == severity.lower())
    total = q.count()
    items = q.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [_to_out(a) for a in items]}


# ── GET /notifications/{id} ───────────────────────────────────────────────────
@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    alert = db.query(Alert).filter(Alert.id == notification_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Notification not found")
    return _to_out(alert)


# ── PATCH /notifications/{id}/read ───────────────────────────────────────────
@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    alert = db.query(Alert).filter(Alert.id == notification_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Notification not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return _to_out(alert)


# ── POST /notifications/read-all ─────────────────────────────────────────────
@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    from app.services.notification_service import mark_all_read as _mark_all
    updated = _mark_all(db, user_id=user.id)
    return {"marked_read": updated}


# ── DELETE /notifications/{id} ────────────────────────────────────────────────
@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    alert = db.query(Alert).filter(Alert.id == notification_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(alert)
    db.commit()
    return None
