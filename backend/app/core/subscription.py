from typing import Dict, Any

SUBSCRIPTION_TIERS = {
    "free": {"scans_month": 5, "projects": 1, "pdf": False},
    "Starter": {"scans_month": 5, "projects": 1, "pdf": False},
    "Pro": {"scans_month": 100, "projects": 10, "pdf": True},
    "Enterprise": {"scans_month": float('inf'), "projects": float('inf'), "pdf": True}
}

def get_user_limits(tier: str) -> Dict[str, Any]:
    """Return the limits associated with a given subscription tier. Defaults to 'free'."""
    if not tier or tier not in SUBSCRIPTION_TIERS:
        return SUBSCRIPTION_TIERS["free"]
    return SUBSCRIPTION_TIERS[tier]
