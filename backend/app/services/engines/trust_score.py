from typing import Any, Dict, List
import random
from sqlalchemy.orm import Session
from app.models.scan import Scan
from app.models.governance import Vendor

class TrustScoreEngine:
    """
    Calculates the Universal AI Trust Score™ (0-1000).
    Factors in:
    - Code Security & Scans (40%)
    - Vendor Risk (20%)
    - Runtime Compliance & Drift (20%)
    - Dark Web & Threat Intel (20%)
    """
    
    @staticmethod
    def calculate_score(db: Session, user_id: str) -> Dict[str, Any]:
        # 1. Base Score
        base_score = 1000
        
        # 2. Code Security Penalty
        scans = db.query(Scan).filter(Scan.user_id == user_id).all()
        critical_findings = sum(1 for s in scans if s.risk_level == "critical")
        high_findings = sum(1 for s in scans if s.risk_level == "high")
        
        security_penalty = (critical_findings * 50) + (high_findings * 20)
        
        # 3. Vendor Risk Penalty
        vendors = db.query(Vendor).filter(Vendor.user_id == user_id).all()
        vendor_penalty = 0
        if vendors:
            avg_vendor_trust = sum(v.trust_score for v in vendors) / len(vendors)
            vendor_penalty = (1000 - avg_vendor_trust) * 0.2
            
        # 4. Threat Intel Penalty (Mock for now, would query DarkWebMention)
        threat_penalty = random.randint(0, 50) 
        
        # Calculate Final Score
        final_score = max(0, min(1000, int(base_score - security_penalty - vendor_penalty - threat_penalty)))
        
        # Determine Status
        status = "Excellent" if final_score >= 850 else "Good" if final_score >= 700 else "Fair" if final_score >= 500 else "Poor"
        
        return {
            "trust_score": final_score,
            "status": status,
            "breakdown": {
                "security_posture": max(0, 400 - security_penalty),
                "vendor_risk": max(0, 200 - vendor_penalty),
                "compliance": 200, # Mock compliance 
                "threat_intel": max(0, 200 - threat_penalty)
            },
            "recent_changes": [
                {"factor": "Code Security", "impact": f"-{security_penalty}" if security_penalty > 0 else "0"},
                {"factor": "Threat Intel", "impact": f"-{threat_penalty}" if threat_penalty > 0 else "0"}
            ]
        }
