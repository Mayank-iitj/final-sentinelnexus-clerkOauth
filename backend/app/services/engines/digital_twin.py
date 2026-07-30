from typing import Any, Dict, List
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.governance import AIAsset, Vendor
from app.models.scan import Scan

class DigitalTwinEngine:
    """
    Generates the data structure required for the Interactive Live Attack Graph (Digital Twin).
    Maps actual topological relationships and calculates blast radius scores.
    """
    
    @staticmethod
    def calculate_blast_radius(node_id: str, edges: List[Dict], current_depth: int = 0, max_depth: int = 3, visited=None) -> int:
        if visited is None:
            visited = set()
        
        if node_id in visited or current_depth > max_depth:
            return 0
            
        visited.add(node_id)
        impact = 1
        
        # Find downstream dependencies
        for edge in edges:
            if edge["source"] == node_id:
                impact += DigitalTwinEngine.calculate_blast_radius(edge["target"], edges, current_depth + 1, max_depth, visited)
                
        return impact

    @staticmethod
    def generate_graph(db: Session, user_id: str) -> Dict[str, Any]:
        assets = db.query(AIAsset).filter(AIAsset.user_id == user_id).all()
        vendors = db.query(Vendor).filter(Vendor.user_id == user_id).all()
        scans = db.query(Scan).filter(Scan.user_id == user_id).all()
        
        nodes = []
        edges = []
        
        # 1. Add Asset Nodes
        asset_map = {}
        for asset in assets:
            asset_node_id = f"asset_{asset.id}"
            asset_map[asset.id] = asset_node_id
            nodes.append({
                "id": asset_node_id,
                "label": asset.name,
                "type": "asset",
                "risk": asset.risk_rating,
                "description": getattr(asset, 'description', 'AI Asset')
            })
            
        # 2. Add Vendor Nodes and link to their Assets
        for vendor in vendors:
            vendor_node_id = f"vendor_{vendor.id}"
            nodes.append({
                "id": vendor_node_id,
                "label": vendor.name,
                "type": "vendor",
                "risk": vendor.risk_level
            })
            
            # Real topology: Vendor to Asset (Assuming vendor relationship exists)
            # We map vendor to all assets that have this vendor_id
            vendor_assets = [a for a in assets if getattr(a, 'vendor_id', None) == vendor.id]
            for va in vendor_assets:
                edges.append({
                    "source": vendor_node_id,
                    "target": asset_map[va.id],
                    "type": "provides",
                    "strength": 0.8
                })
            
        # 3. Add Scan Result Nodes (Vulnerabilities) and link to specific targets
        vuln_nodes = []
        for scan in scans:
            if scan.risk_level in ["medium", "high", "critical"]:
                vuln_node_id = f"vuln_{scan.id}"
                vuln_nodes.append({
                    "id": vuln_node_id,
                    "label": f"Vuln: {scan.target}",
                    "type": "vulnerability",
                    "risk": scan.risk_level,
                    "cve": getattr(scan, 'cve', 'Unknown')
                })
                
                # Try to map vulnerability to a specific asset or project
                target_asset = next((a for a in assets if str(a.id) == getattr(scan, 'project_id', '')), None)
                if target_asset:
                    edges.append({
                        "source": vuln_node_id,
                        "target": asset_map[target_asset.id],
                        "type": "affects",
                        "strength": 1.0 if scan.risk_level == 'critical' else 0.5
                    })
                elif assets: # Fallback distribute if untargeted
                    edges.append({
                        "source": vuln_node_id,
                        "target": asset_map[assets[0].id],
                        "type": "affects",
                        "strength": 0.3
                    })
                    
        nodes.extend(vuln_nodes)
        
        # 4. Compute Blast Radius for all Vulnerabilities
        for node in nodes:
            if node["type"] == "vulnerability":
                node["blast_radius"] = DigitalTwinEngine.calculate_blast_radius(node["id"], edges)
            else:
                node["blast_radius"] = 0
            
        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "max_blast_radius": max((n["blast_radius"] for n in nodes), default=0)
            }
        }
