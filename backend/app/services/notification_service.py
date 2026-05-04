"""
Notification Service
======================
Automatically creates Alert records in the database when scan findings
include high or critical severity vulnerabilities.

Real DB persistence. No mock data.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.alert import Alert


_SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1, "none": 0}


def create_alerts_from_scan(
    db: Session,
    *,
    scan_id: str,
    user_id: str,
    target: str,
    findings: List[Dict[str, Any]],
    threshold_severity: str = "high",  # Only notify for >= this severity
) -> int:
    """
    Persist Alert rows for every finding at or above threshold_severity.
    Returns the number of alerts created.
    """
    threshold = _SEVERITY_ORDER.get(threshold_severity.lower(), 3)
    created = 0

    for f in findings:
        sev = f.get("severity", "low").lower()
        if _SEVERITY_ORDER.get(sev, 0) < threshold:
            continue

        cvss_score: Optional[float] = f.get("cvss_score")
        finding_type = f.get("finding_type", "unknown")
        cwe = f.get("cwe", "")
        message = f.get("message", "")

        title = f"[{sev.upper()}] {finding_type.replace('_', ' ').title()} detected"
        if cwe:
            title += f" ({cwe})"

        description = (
            f"A <b>{sev}</b> severity finding was detected in scan target "
            f"<i>{target[:120]}</i>.\n\n"
            f"Finding: {message}\n"
            f"CVSS v3.1 Score: {cvss_score:.1f}" if cvss_score else f"Finding: {message}"
        )

        alert_type_map = {
            "prompt_injection":         "prompt_injection",
            "jailbreak_attempt":        "prompt_injection",
            "pii_exfiltration_attempt": "prompt_injection",
            "system_prompt_leakage":    "prompt_injection",
            "credit_card_number":       "pii",
            "social_security_number":   "pii",
            "email_address":            "pii",
            "iban_number":              "pii",
            "passport_number":          "pii",
            "phone_number":             "pii",
        }
        alert_type = alert_type_map.get(finding_type, "code_finding")

        alert = Alert(
            user_id=user_id,
            scan_id=scan_id,
            alert_type=alert_type,
            severity=sev,
            cvss_score=cvss_score,
            title=title,
            description=description if isinstance(description, str) else str(description),
            link=f"/scans/{scan_id}",
            is_read=False,
            meta={
                "finding_type": finding_type,
                "cvss_vector":  f.get("cvss_vector", ""),
                "target":       target,
            },
        )
        db.add(alert)
        created += 1

    if created > 0:
        db.commit()

    return created


def get_unread_count(db: Session, *, user_id: str) -> int:
    return db.query(Alert).filter(
        Alert.user_id == user_id,
        Alert.is_read == False,  # noqa: E712
    ).count()


def mark_all_read(db: Session, *, user_id: str) -> int:
    """Mark all unread alerts for user as read. Returns rows updated."""
    updated = (
        db.query(Alert)
        .filter(Alert.user_id == user_id, Alert.is_read == False)  # noqa: E712
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return updated
