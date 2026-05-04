from __future__ import annotations

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate, *, commit: bool = True) -> User:
        """Create a new user record.

        By default this function commits the transaction. When called from callers
        that manage their own transaction (such as the OAuth sync flow), pass
        `commit=False` and commit/refresh in the caller to ensure atomicity.
        """
        hashed = pwd_context.hash(user_in.password)
        user = User(
            email=str(user_in.email).lower(),
            username=user_in.username,
            full_name=user_in.full_name,
            hashed_password=hashed,
            is_active=True,
        )
        db.add(user)
        if commit:
            db.commit()
            db.refresh(user)
        return user

