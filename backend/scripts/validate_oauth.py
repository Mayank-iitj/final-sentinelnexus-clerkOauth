#!/usr/bin/env python
"""
OAuth Configuration Validator
==============================
Quickly validate that your Google OAuth credentials are correct before 
running the full application.

Usage:
    python scripts/validate_oauth.py

Environment variables (or .env file):
    GOOGLE_CLIENT_ID: Your Google OAuth Client ID
    GOOGLE_CLIENT_SECRET: Your Google OAuth Client Secret
    FRONTEND_BASE_URL: Frontend base URL (e.g., http://localhost:3000)
    BACKEND_BASE_URL: Backend base URL (e.g., http://localhost:8000)
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import get_settings

def validate_oauth() -> bool:
    """Validate OAuth configuration."""
    print("Validating OAuth configuration...\n")
    
    try:
        settings = get_settings()
    except Exception as e:
        print(f"❌ Failed to load settings: {e}")
        return False
    
    # Check required fields
    checks = {
        "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
        "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
        "FRONTEND_BASE_URL": settings.FRONTEND_BASE_URL,
        "BACKEND_BASE_URL": settings.BACKEND_BASE_URL,
        "DATABASE_URL": settings.DATABASE_URL,
        "REDIS_URL": settings.REDIS_URL,
        "SECRET_KEY": "***" if settings.SECRET_KEY else None,
        "JWT_SECRET_KEY": "***" if settings.JWT_SECRET_KEY else None,
    }
    
    all_ok = True
    for name, value in checks.items():
        if not value or value == "":
            print(f"❌ {name}: NOT SET")
            all_ok = False
        else:
            if name.endswith("_KEY"):
                print(f"✓ {name}: {value}")
            elif name.endswith("_SECRET"):
                print(f"✓ {name}: {value[:10]}...{value[-5:]}")
            else:
                print(f"✓ {name}: {value}")
    
    print()
    
    # Try to register OAuth provider
    try:
        from authlib.integrations.starlette_client import OAuth
        oauth = OAuth()
        
        if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
            oauth.register(
                name="google",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
                client_kwargs={"scope": "openid email profile"},
            )
            print("✓ Successfully registered Google OAuth provider")
        else:
            print("❌ Google OAuth credentials not set")
            all_ok = False
    except Exception as e:
        print(f"❌ Failed to register OAuth provider: {e}")
        all_ok = False
    
    print()
    
    # Try to connect to database
    try:
        from app.db.database import engine
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        print("✓ Successfully connected to database")
    except Exception as e:
        print(f"⚠ Failed to connect to database (this is OK for local dev with SQLite): {e}")
    
    print()
    
    if all_ok:
        print("✅ All OAuth configuration checks passed!")
        return True
    else:
        print("❌ Some configuration checks failed. See above for details.")
        print("\nFor setup instructions, see: OAUTH_SETUP.md")
        return False

if __name__ == "__main__":
    success = validate_oauth()
    sys.exit(0 if success else 1)
