"""JSON-gebaseerde opslag voor woningen."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import Optional

from ..models.woning import (
    EnergyLabel,
    ParkeerType,
    Woning,
    WoningStatus,
    WoningType,
)

DEFAULT_OPSLAG_DIR = Path.home() / ".woning_calculator"
DEFAULT_BESTAND = DEFAULT_OPSLAG_DIR / "woningen.json"


class WoningOpslag:
    """Beheer opslag van woningen in JSON formaat."""

    def __init__(self, bestand: Path | None = None):
        self.bestand = bestand or DEFAULT_BESTAND
        self.bestand.parent.mkdir(parents=True, exist_ok=True)
        if not self.bestand.exists():
            self.bestand.write_text("[]", encoding="utf-8")

    def _lees(self) -> list[dict]:
        tekst = self.bestand.read_text(encoding="utf-8")
        return json.loads(tekst) if tekst.strip() else []

    def _schrijf(self, data: list[dict]) -> None:
        self.bestand.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _dict_naar_woning(self, d: dict) -> Woning:
        """Converteer dictionary naar Woning object."""
        d = d.copy()
        # Enums herstellen
        if d.get("woningtype"):
            d["woningtype"] = WoningType(d["woningtype"])
        if d.get("energielabel"):
            d["energielabel"] = EnergyLabel(d["energielabel"])
        if d.get("parkeren"):
            d["parkeren"] = ParkeerType(d["parkeren"])
        if d.get("status"):
            d["status"] = WoningStatus(d["status"])
        return Woning(**d)

    def opslaan(self, woning: Woning) -> str:
        """Sla een woning op en return het ID."""
        data = self._lees()
        woning_dict = asdict(woning)
        # Enums naar string
        for key, val in woning_dict.items():
            if hasattr(val, "value"):
                woning_dict[key] = val.value
        data.append(woning_dict)
        self._schrijf(data)
        return woning.id

    def laden(self, woning_id: str) -> Optional[Woning]:
        """Laad een woning op ID."""
        for d in self._lees():
            if d.get("id") == woning_id:
                return self._dict_naar_woning(d)
        return None

    def alle_woningen(self) -> list[Woning]:
        """Laad alle woningen."""
        return [self._dict_naar_woning(d) for d in self._lees()]

    def bijwerken(self, woning_id: str, updates: dict) -> bool:
        """Werk een woning bij."""
        data = self._lees()
        for i, d in enumerate(data):
            if d.get("id") == woning_id:
                d.update(updates)
                data[i] = d
                self._schrijf(data)
                return True
        return False

    def verwijderen(self, woning_id: str) -> bool:
        """Verwijder een woning."""
        data = self._lees()
        nieuwe_data = [d for d in data if d.get("id") != woning_id]
        if len(nieuwe_data) < len(data):
            self._schrijf(nieuwe_data)
            return True
        return False

    def zoek(self, stad: str | None = None, status: str | None = None) -> list[Woning]:
        """Zoek woningen op stad en/of status."""
        resultaten = self.alle_woningen()
        if stad:
            resultaten = [w for w in resultaten if w.stad.lower() == stad.lower()]
        if status:
            resultaten = [w for w in resultaten if w.status.value == status]
        return resultaten
