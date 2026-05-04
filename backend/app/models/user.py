from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Column, Index, String

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Profile
    avatar_url = Column(String(2048), nullable=True)

    # Primary OAuth provider
    oauth_provider = Column(String(32), nullable=True, index=True)
    oauth_provider_id = Column(String(255), nullable=True, index=True)

    # Secondary OAuth (allows linking a second provider to the same account)
    oauth_provider2 = Column(String(32), nullable=True)
    oauth_provider_id2 = Column(String(255), nullable=True)

    __table_args__ = (
        Index("uq_user_oauth", "oauth_provider", "oauth_provider_id", unique=True),
    )
