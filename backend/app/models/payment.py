from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base
import uuid

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="PENDING")
    product_info = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
