from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, JSON, String, Text

from app.db.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relations
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="SET NULL"), nullable=True, index=True)

    # Content
    alert_type = Column(String(32), nullable=False, default="code_finding")  # code_finding|prompt_injection|pii|system|compliance
    severity = Column(String(16), nullable=False, default="medium")          # low|medium|high|critical
    cvss_score = Column(Float, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)            # Human-readable detail message
    link = Column(String(1024), nullable=True)   # Deep link e.g. /scans/<id>

    # State
    is_read = Column(Boolean, default=False, nullable=False)

    # Extra structured data
    meta = Column("metadata", JSON, default=dict, nullable=False)

