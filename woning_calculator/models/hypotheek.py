"""Hypotheek parameters model."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class HypotheekType(str, Enum):
    ANNUITEIT = "annuiteit"
    LINEAIR = "lineair"


@dataclass
class HypotheekParams:
    """Parameters voor hypotheekberekening."""

    hoofdsom: int
    rente_percentage: float  # bijv. 3.85
    looptijd_jaren: int = 30
    rentevast_jaren: int = 10
    type: HypotheekType = HypotheekType.ANNUITEIT
    nhg: bool = False
    extra_aflossing_maand: float = 0.0
    startdatum: Optional[str] = None
