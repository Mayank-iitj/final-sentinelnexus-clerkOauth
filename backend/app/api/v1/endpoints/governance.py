from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, Dict, List
from pydantic import BaseModel

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.governance import AIAsset, RuntimePolicy, AuditTrail

router = APIRouter(prefix="/governance", tags=["governance"])

class AssetCreate(BaseModel):
    name: str
    asset_type: str
    provider: str

@router.post("/assets")
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    asset = AIAsset(
        user_id=user.id,
        name=asset_in.name,
        asset_type=asset_in.asset_type,
        provider=asset_in.provider
    )
    db.add(asset)
    
    audit = AuditTrail(
        user_id=user.id,
        action="CREATE",
        resource_type="AIAsset",
        resource_id=asset.id,
        status="success",
        details=f"Created AI asset: {asset.name}"
    )
    db.add(audit)
    
    db.commit()
    return asset

@router.get("/assets")
def list_assets(
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    return db.query(AIAsset).filter(AIAsset.user_id == user.id).all()

@router.get("/audit-trail")
def list_audit_trail(
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    return db.query(AuditTrail).filter(AuditTrail.user_id == user.id).order_by(AuditTrail.created_at.desc()).all()
