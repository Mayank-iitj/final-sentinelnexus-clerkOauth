from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=12, max_length=256)
    full_name: str | None = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    username: str
    full_name: str | None = None

