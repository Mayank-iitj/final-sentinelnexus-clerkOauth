from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class ThreatPrediction(Base):
    __tablename__ = "threat_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    threat_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    impact_level = Column(String(20), default="high") # critical, high, medium, low
    mitigation_strategy = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DarkWebMention(Base):
    __tablename__ = "dark_web_mentions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    asset_id = Column(String(36), ForeignKey("ai_assets.id"), nullable=True)
    source_forum = Column(String(255), nullable=True)
    snippet = Column(Text, nullable=False)
    threat_actor = Column(String(255), nullable=True)
    severity = Column(String(20), default="high")
    is_resolved = Column(Boolean, default=False)
    discovered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DeepfakeEvent(Base):
    __tablename__ = "deepfake_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    media_url = Column(String(1024), nullable=True)
    content_hash = Column(String(64), nullable=True)
    confidence_score = Column(Float, nullable=False)
    analysis_details = Column(Text, nullable=True)
    status = Column(String(50), default="flagged")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
