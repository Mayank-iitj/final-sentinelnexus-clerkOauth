import httpx
import uuid
from datetime import datetime, timezone
from loguru import logger

async def scan_domain_darkweb(db_session_factory, user_id: str, domain: str):
    """
    Background task to scan a domain against AlienVault OTX and simulated dark web feeds.
    """
    logger.info(f"Starting Dark Web OSINT scan for domain: {domain}")
    
    mentions = []
    
    from app.core.config import get_settings
    settings = get_settings()
    
    # 1. AlienVault OTX API (Real OSINT Threat Intel Data)
    otx_url = f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general"
    headers = {}
    if settings.ALIENVAULT_OTX_API_KEY:
        headers["X-OTX-API-KEY"] = settings.ALIENVAULT_OTX_API_KEY

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(otx_url, headers=headers, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                pulses = data.get("pulse_info", {}).get("pulses", [])
                
                # Take top 3 most recent/relevant pulses
                for pulse in pulses[:3]:
                    tags = pulse.get('tags', [])
                    mentions.append({
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "source_forum": "AlienVault OTX (OSINT)",
                        "snippet": f"Domain associated with Threat Pulse: {pulse.get('name')}. Tags: {', '.join(tags) if tags else 'None'}",
                        "threat_actor": pulse.get("author_name", "Unknown"),
                        "severity": "critical" if "ransomware" in tags or "malware" in tags else "high",
                        "discovered_at": pulse.get("created"),
                        "is_resolved": False
                    })
    except Exception as e:
        logger.error(f"Failed to fetch OTX data for {domain}: {e}")
        
    db = db_session_factory()
    try:
        from app.models.threat import DarkWebMention
        
        # Clear old mentions for this user to avoid UI clutter in demo, though in production you'd keep them and deduplicate
        db.query(DarkWebMention).filter(DarkWebMention.user_id == user_id).delete()
        
        for m in mentions:
            # Parse datetime if needed, though SQLAlchemy can handle ISO strings for DateTime cols depending on dialect.
            # Convert ISO string to datetime obj
            try:
                dt = datetime.fromisoformat(m["discovered_at"].replace("Z", "+00:00"))
            except:
                dt = datetime.now(timezone.utc)
                
            db_mention = DarkWebMention(
                id=m["id"],
                user_id=m["user_id"],
                source_forum=m["source_forum"],
                snippet=m["snippet"],
                threat_actor=m["threat_actor"],
                severity=m["severity"],
                is_resolved=m["is_resolved"],
                discovered_at=dt
            )
            db.add(db_mention)
            
        db.commit()
        logger.info(f"Saved {len(mentions)} Dark Web OSINT mentions for {domain}.")
        
    except Exception as e:
        logger.error(f"DB Error saving dark web mentions: {e}")
        db.rollback()
    finally:
        db.close()
