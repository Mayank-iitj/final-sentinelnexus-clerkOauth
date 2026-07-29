from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class AIAsset(Base):
    __tablename__ = "ai_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(50), nullable=False)  # 'model', 'dataset', 'endpoint'
    provider = Column(String(100), nullable=True)    # 'openai', 'anthropic', 'huggingface', 'internal'
    status = Column(String(50), default="active")    # 'active', 'deprecated', 'in_review'
    risk_rating = Column(String(20), default="medium")
    compliance_status = Column(String(20), default="compliant")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class RuntimePolicy(Base):
    __tablename__ = "runtime_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    framework = Column(String(100), nullable=False)  # 'SOC2', 'ISO27001', 'EU_AI_ACT'
    enforcement_mode = Column(String(50), default="audit") # 'audit', 'block'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditTrail(Base):
    __tablename__ = "audit_trails"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    action = Column(String(255), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True)
    name = Column(String(255), nullable=False)
    trust_score = Column(Integer, default=500) # Universal Trust Score 0-1000
    risk_level = Column(String(20), default="medium")
    service_provided = Column(String(255), nullable=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
