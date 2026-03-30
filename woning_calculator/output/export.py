"""Export functies voor woningdata."""

from __future__ import annotations

import csv
import json
from dataclasses import asdict
from pathlib import Path

from ..models.woning import Woning


def exporteer_csv(woningen: list[Woning], pad: Path) -> None:
    """Exporteer woningen naar CSV."""
    if not woningen:
        return

    velden = [
        "id", "naam", "vraagprijs", "biedprijs", "verkoopprijs",
        "stad", "postcode", "straat", "huisnummer", "wijk",
        "woonoppervlakte", "perceeloppervlakte", "aantal_kamers",
        "aantal_slaapkamers", "bouwjaar", "woningtype", "energielabel",
        "tuin", "balkon", "parkeren", "vve_bijdrage",
        "status", "datum_toegevoegd", "notities", "funda_url",
    ]

    with open(pad, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=velden, extrasaction="ignore")
        writer.writeheader()
        for w in woningen:
            row = asdict(w)
            for key, val in row.items():
                if hasattr(val, "value"):
                    row[key] = val.value
            writer.writerow(row)


def exporteer_json(woningen: list[Woning], pad: Path) -> None:
    """Exporteer woningen naar JSON."""
    data = []
    for w in woningen:
        d = asdict(w)
        for key, val in d.items():
            if hasattr(val, "value"):
                d[key] = val.value
        data.append(d)

    with open(pad, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
