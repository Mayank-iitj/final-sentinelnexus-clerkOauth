from typing import Any, Dict, List
from sqlalchemy.orm import Session
from app.models.governance import AIAsset, Vendor
from app.models.scan import Scan

class DigitalTwinEngine:
    """
    Generates the data structure required for the Interactive Live Attack Graph (Digital Twin).
    Maps relationships between Assets, Vendors, and Scans.
    """
    
    @staticmethod
    def generate_graph(db: Session, user_id: str) -> Dict[str, Any]:
        assets = db.query(AIAsset).filter(AIAsset.user_id == user_id).all()
        vendors = db.query(Vendor).filter(Vendor.user_id == user_id).all()
        scans = db.query(Scan).filter(Scan.user_id == user_id).all()
        
        nodes = []
        edges = []
        
        # 1. Add Asset Nodes
        for asset in assets:
            nodes.append({
                "id": f"asset_{asset.id}",
                "label": asset.name,
                "type": "asset",
                "risk": asset.risk_rating
            })
            
        # 2. Add Vendor Nodes
        for vendor in vendors:
            nodes.append({
                "id": f"vendor_{vendor.id}",
                "label": vendor.name,
                "type": "vendor",
                "risk": vendor.risk_level
            })
            
        # 3. Add Scan Result Nodes (Vulnerabilities)
        for scan in scans:
            if scan.risk_level in ["high", "critical"]:
                nodes.append({
                    "id": f"vuln_{scan.id}",
                    "label": f"Vuln: {scan.target}",
                    "type": "vulnerability",
                    "risk": scan.risk_level
                })
                
                # Mock edge: Vuln affects a random asset (in reality, tie to scan.project_id or asset_id)
                if assets:
                    affected_asset = assets[0]
                    edges.append({
                        "source": f"vuln_{scan.id}",
                        "target": f"asset_{affected_asset.id}",
                        "type": "affects"
                    })

        # Mock edge: Vendor provides Asset
        if vendors and assets:
            edges.append({
                "source": f"vendor_{vendors[0].id}",
                "target": f"asset_{assets[0].id}",
                "type": "provides"
            })
            
        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
        }
