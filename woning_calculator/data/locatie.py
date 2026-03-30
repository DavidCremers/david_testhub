"""Locatiegebaseerde marktdata beheer."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from . import defaults

DEFAULT_LOCATIE_BESTAND = Path.home() / ".woning_calculator" / "locatie_data.json"


class LocatieData:
    """Beheer van locatie-specifieke marktgegevens."""

    def __init__(self, bestand: Path | None = None):
        self.bestand = bestand or DEFAULT_LOCATIE_BESTAND
        self.bestand.parent.mkdir(parents=True, exist_ok=True)
        if not self.bestand.exists():
            self.bestand.write_text("{}", encoding="utf-8")

    def _lees(self) -> dict:
        tekst = self.bestand.read_text(encoding="utf-8")
        return json.loads(tekst) if tekst.strip() else {}

    def _schrijf(self, data: dict) -> None:
        self.bestand.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def get_m2_prijs(self, locatie: str) -> float:
        """Haal m2-prijs op. Eerst eigen data, dan defaults."""
        data = self._lees()
        key = locatie.lower().strip()
        if key in data and "m2_prijs" in data[key]:
            return data[key]["m2_prijs"]
        return defaults.GEM_M2_PRIJS.get(key, defaults.GEM_M2_PRIJS["default"])

    def get_overbied_pct(self, locatie: str) -> float:
        """Haal overbiedpercentage op."""
        data = self._lees()
        key = locatie.lower().strip()
        if key in data and "overbied_pct" in data[key]:
            return data[key]["overbied_pct"]
        return defaults.OVERBIEDEN_DEFAULTS.get(
            key, defaults.OVERBIEDEN_DEFAULTS["default"]
        )

    def update_locatie(
        self,
        locatie: str,
        m2_prijs: Optional[float] = None,
        overbied_pct: Optional[float] = None,
        extra: Optional[dict] = None,
    ) -> None:
        """Update of voeg locatiegegevens toe."""
        data = self._lees()
        key = locatie.lower().strip()
        if key not in data:
            data[key] = {}
        if m2_prijs is not None:
            data[key]["m2_prijs"] = m2_prijs
        if overbied_pct is not None:
            data[key]["overbied_pct"] = overbied_pct
        if extra:
            data[key].update(extra)
        self._schrijf(data)

    def alle_locaties(self) -> dict:
        """Toon alle opgeslagen locatiedata."""
        return self._lees()
