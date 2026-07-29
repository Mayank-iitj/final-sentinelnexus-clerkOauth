from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.services.engines.trust_score import TrustScoreEngine
from app.services.engines.digital_twin import DigitalTwinEngine

router = APIRouter(prefix="/trust", tags=["trust"])

@router.get("/score")
def get_trust_score(
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    return TrustScoreEngine.calculate_score(db, user.id)

@router.get("/digital-twin")
def get_digital_twin(
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    return DigitalTwinEngine.generate_graph(db, user.id)

@router.get("/certificate")
def get_trust_certificate(
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    score_data = TrustScoreEngine.calculate_score(db, user.id)
    return {
        "certificate_id": f"cert-{user.id[:8]}",
        "issued_to": user.email,
        "trust_score": score_data["trust_score"],
        "status": score_data["status"],
        "valid_until": "2026-12-31T23:59:59Z"
    }
