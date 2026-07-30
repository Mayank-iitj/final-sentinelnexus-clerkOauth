from typing import Any, Dict, List
import math
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.scan import Scan
from app.models.governance import Vendor
from app.models.threat import ThreatPrediction

class TrustScoreEngine:
    """
    Calculates the Universal AI Trust Score™ (0-1000).
    Uses logarithmic decay and exponential scaling based on CVSS principles.
    """
    
    @staticmethod
    def _calculate_time_decay(timestamp: datetime) -> float:
        """Calculate a decay factor based on time since finding (halving every 30 days)."""
        if not timestamp:
            return 1.0
        # Ensure timestamp is timezone-aware
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        days_old = (datetime.now(timezone.utc) - timestamp).days
        return math.pow(0.5, max(0, days_old) / 30.0)

    @staticmethod
    def calculate_score(db: Session, user_id: str) -> Dict[str, Any]:
        # 1. Base Scores (Max potentials)
        SEC_MAX = 400
        VEN_MAX = 200
        COM_MAX = 200
        THR_MAX = 200
        
        # 2. Advanced Code Security Penalty
        scans = db.query(Scan).filter(Scan.user_id == user_id).all()
        security_penalty = 0.0
        
        for scan in scans:
            # Assume scan has a created_at timestamp
            decay = TrustScoreEngine._calculate_time_decay(getattr(scan, 'created_at', datetime.now(timezone.utc)))
            
            # Non-linear severity scaling (Criticals hurt exponentially more)
            if scan.risk_level == "critical":
                security_penalty += 100 * decay
            elif scan.risk_level == "high":
                security_penalty += 35 * decay
            elif scan.risk_level == "medium":
                security_penalty += 10 * decay
            elif scan.risk_level == "low":
                security_penalty += 2 * decay
                
        # Cap penalty at max possible for this category
        security_penalty = min(SEC_MAX, security_penalty)
        
        # 3. Vendor Risk Penalty (Supply Chain)
        vendors = db.query(Vendor).filter(Vendor.user_id == user_id).all()
        vendor_penalty = 0.0
        if vendors:
            # Weighted average based on vendor criticality
            total_weight = sum(getattr(v, 'criticality', 1.0) for v in vendors)
            if total_weight > 0:
                weighted_score = sum(v.trust_score * getattr(v, 'criticality', 1.0) for v in vendors) / total_weight
                # If average trust is below 800, apply penalty exponentially
                vendor_deficit = max(0, 800 - weighted_score)
                vendor_penalty = min(VEN_MAX, math.pow(vendor_deficit / 100.0, 1.5) * 20)
            
        # 4. Threat Intel (Query real threat intel if exists, else apply baseline)
        try:
            threats = db.query(ThreatPrediction).filter(ThreatPrediction.user_id == user_id, ThreatPrediction.is_active == True).all()
            threat_penalty = min(THR_MAX, sum(t.confidence_score for t in threats) * 10)
        except Exception:
            # Fallback if model isn't fully scaffolded
            threat_penalty = 0
            
        # 5. Compliance (Placeholder for policy violations)
        compliance_penalty = 0 # Future expansion: db.query(PolicyViolation)
        
        # Calculate Final Score
        final_score = int(
            (SEC_MAX - security_penalty) + 
            (VEN_MAX - vendor_penalty) + 
            (COM_MAX - compliance_penalty) + 
            (THR_MAX - threat_penalty)
        )
        final_score = max(0, min(1000, final_score))
        
        # Determine Status
        status = "Excellent" if final_score >= 850 else "Good" if final_score >= 700 else "Fair" if final_score >= 500 else "Poor"
        
        return {
            "trust_score": final_score,
            "status": status,
            "breakdown": {
                "security_posture": int(SEC_MAX - security_penalty),
                "vendor_risk": int(VEN_MAX - vendor_penalty),
                "compliance": int(COM_MAX - compliance_penalty),
                "threat_intel": int(THR_MAX - threat_penalty)
            },
            "recent_changes": [
                {"factor": "Code Security", "impact": f"-{int(security_penalty)}" if security_penalty > 0 else "0"},
                {"factor": "Vendor Risk", "impact": f"-{int(vendor_penalty)}" if vendor_penalty > 0 else "0"}
            ]
        }
