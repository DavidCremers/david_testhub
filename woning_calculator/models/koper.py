"""Kopersprofiel model."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class KoperProfiel:
    """Profiel van de koper voor berekeningen."""

    bruto_jaarinkomen: float
    leeftijd: int
    eigen_geld: float = 0.0
    bruto_jaarinkomen_partner: Optional[float] = None
    starter: bool = False  # voor vrijstelling overdrachtsbelasting
    studieschuld: float = 0.0
    alimentatie: float = 0.0  # maandelijks
    overige_leningen: float = 0.0  # totale maandlasten
    pensioen_leeftijd: int = 67

    @property
    def totaal_inkomen(self) -> float:
        return self.bruto_jaarinkomen + (self.bruto_jaarinkomen_partner or 0.0)

    @property
    def heeft_partner(self) -> bool:
        return self.bruto_jaarinkomen_partner is not None and self.bruto_jaarinkomen_partner > 0
