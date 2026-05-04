from __future__ import annotations

from typing import Any, Dict

from pydantic import BaseModel
from pydantic import Field


class AlertOut(BaseModel):
    id: str
    severity: str
    title: str
    description: str | None = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

