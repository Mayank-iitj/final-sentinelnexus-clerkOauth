from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    format = Column(String(8), nullable=False, default="pdf")   # pdf | json
    status = Column(String(16), nullable=False, default="generating")  # generating | ready | error
    file_path = Column(String(1024), nullable=True)  # Relative to reports root dir
    file_size_bytes = Column(Integer, nullable=True)
    finding_count = Column(Integer, default=0, nullable=False)
    max_cvss = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    meta = Column("metadata", JSON, default=dict, nullable=False)
