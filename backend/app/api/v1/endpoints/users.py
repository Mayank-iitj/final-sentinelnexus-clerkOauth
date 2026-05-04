from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.v1.deps import get_current_active_user
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_active_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
    )

