"""
OAuth User Sync Service
========================
Upserts users from Google OAuth provider data.

Rules:
  1. Look up by (provider, provider_id) — exact match → returning user, update profile
  2. No match → look up by email (account linking)
     - If found: link provider, update fields
     - If not found: create new user with random password
  3. Always refresh full_name and avatar_url on every login
"""
from __future__ import annotations

import re
import secrets
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from loguru import logger

from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user_service import UserService


def _safe_username(email: str, provider: str, provider_id: str) -> str:
    """Generate a unique, collision-safe username from email + provider context."""
    local = email.split("@")[0]
    # Strip non-alphanumeric (keep underscores/hyphens)
    local = re.sub(r"[^a-zA-Z0-9_\-]", "_", local)[:30]
    suffix = f"_{provider_id[:6]}"
    return f"{local}{suffix}"


def sync_oauth_user(
    db: Session,
    *,
    email: str,
    name: Optional[str],
    provider_id: str,
    provider: str,
    avatar_url: Optional[str] = None,
) -> str:
    """
    Upsert a user from OAuth profile data. Returns the user's UUID string.
    Thread-safe: relies on unique DB constraints + application-level check.
    """
    email = (email or "").strip().lower()

    if not email:
        raise ValueError("OAuth profile missing email")

    # Use a transaction to ensure the whole sync is atomic
    try:
        with db.begin():
            # 1) Exact provider match
            user = (
                db.query(User)
                .filter(User.oauth_provider == provider, User.oauth_provider_id == provider_id)
                .with_for_update(nowait=True)
                .first()
            )
            if user:
                # Refresh mutable profile fields on every login
                if name:
                    user.full_name = name
                if avatar_url:
                    user.avatar_url = avatar_url
                # transaction will commit at context exit
                return user.id

            # 2) Email-based account linking
            user = db.query(User).filter(User.email == email).with_for_update(nowait=True).first()
            if user:
                if not user.oauth_provider:
                    user.oauth_provider = provider
                    user.oauth_provider_id = provider_id
                if name:
                    user.full_name = name or user.full_name
                if avatar_url:
                    user.avatar_url = avatar_url
                return user.id

            # 3) Create new user (ensure username uniqueness)
            base_username = _safe_username(email, provider, provider_id)
            username = base_username
            attempt = 0
            while db.query(User).filter(User.username == username).first():
                attempt += 1
                username = f"{base_username}_{attempt}"

            random_pw = secrets.token_urlsafe(32)
            user_in = UserCreate(
                email=email,
                username=username,
                password=random_pw,
                full_name=name or username,
            )
            # create_user with commit=False so the outer transaction controls commit
            user = UserService.create_user(db, user_in, commit=False)
            user.oauth_provider = provider
            user.oauth_provider_id = provider_id
            if avatar_url:
                user.avatar_url = avatar_url
            # db.begin() context will commit
            db.refresh(user)
            return user.id
    except IntegrityError as ie:
        # Handle rare race conditions (unique constraint) by retrying once
        logger.warning(f"IntegrityError during OAuth sync, retrying: {ie}")
        db.rollback()
        # Simple retry: try to find the user again by provider or email
        user = (
            db.query(User)
            .filter(User.oauth_provider == provider, User.oauth_provider_id == provider_id)
            .first()
        )
        if user:
            return user.id
        user = db.query(User).filter(User.email == email).first()
        if user:
            if not user.oauth_provider:
                user.oauth_provider = provider
                user.oauth_provider_id = provider_id
                db.commit()
            return user.id
        # If still failing, bubble up for the caller to handle
        raise
    except Exception:
        db.rollback()
        raise
