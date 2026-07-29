from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Who & where
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)

    target = Column(String(2048), nullable=False)       # repo URL / file name / snippet label
    scan_type = Column(String(16), nullable=False, default="code")  # code | prompt | text
    status = Column(String(32), nullable=False, default="queued")   # queued | running | completed | failed

    # Scoring
    pii_risk_score = Column(Integer, nullable=False, default=0)     # 0-100 weighted score
    risk_level = Column(String(16), nullable=False, default="low")  # low|medium|high|critical
    cvss_max_score = Column(Float, nullable=True)                   # Highest CVSS v3.1 score in this scan
    finding_count = Column(Integer, default=0, nullable=False)
    duration_ms = Column(Integer, nullable=True)

    trust_score = Column(Integer, nullable=True) # 0-1000 AI Trust Score
    compliance_frameworks = Column(JSONB, nullable=True) # E.g. {"SOC2": "pass"}

    is_archived = Column(Boolean, default=False, nullable=False)

    # Avoid naming the ORM attribute "metadata" (it collides with SQLAlchemy's metadata).
    meta = Column("metadata", JSON, default=dict, nullable=False)
    result = Column(Text, nullable=True)  # JSON string – full findings list

