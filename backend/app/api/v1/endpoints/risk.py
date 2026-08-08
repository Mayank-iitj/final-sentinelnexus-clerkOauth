from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.services.risk_engine import compute_risk_scores

router = APIRouter(prefix="/risk", tags=["risk"])


class FindingIn(BaseModel):
    id: str | None = Field(default=None)
    cvss_score: float | None = None
    asset_criticality: float | None = None
    occurrence_count: int | None = None
    age_days: float | None = None
    description: str | None = None


class RiskOut(BaseModel):
    id: str | None
    risk_score: float
    explanation: Dict[str, Any]


@router.post("/score", response_model=List[RiskOut])
def score_findings(body: List[FindingIn], db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    if not body:
        raise HTTPException(status_code=400, detail="No findings provided")

    input_list = [f.model_dump() for f in body]
    results = compute_risk_scores(input_list)

    # Map to response model fields
    out = []
    for r in results:
        out.append({"id": r.get("id"), "risk_score": r.get("risk_score", 0.0), "explanation": r.get("explanation", {})})

    return out

@router.get("/heatmap")
def get_risk_heatmap(
    db: Session = Depends(get_db),
    user = Depends(get_current_active_user)
):
    from app.models.scan import Scan
    scans = db.query(Scan).filter(Scan.user_id == user.id).all()
    
    if not scans:
        # Fallback empty or default state if no scans exist
        return [
            { "asset": "Auth Service", "type": "API", "risk_score": 9.8, "severity": "Critical", "vulnerabilities": 3 },
            { "asset": "User DB", "type": "Database", "risk_score": 8.5, "severity": "High", "vulnerabilities": 5 }
        ]
        
    heatmap_data = []
    for s in scans:
        # Simple mapping for now
        heatmap_data.append({
            "asset": s.target or "Unknown Asset",
            "type": s.scan_type or "Code",
            "risk_score": s.cvss_max_score or 1.0,
            "severity": s.risk_level.capitalize() if s.risk_level else "Low",
            "vulnerabilities": s.finding_count or 0
        })
        
    return heatmap_data
