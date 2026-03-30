"""Woningmodel met alle Funda-velden."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class WoningType(str, Enum):
    APPARTEMENT = "appartement"
    TUSSENWONING = "tussenwoning"
    HOEKWONING = "hoekwoning"
    TWEE_ONDER_EEN_KAP = "twee_onder_een_kap"
    VRIJSTAAND = "vrijstaand"
    GESCHAKELD = "geschakeld"
    BOVENWONING = "bovenwoning"
    BENEDENWONING = "benedenwoning"
    MAISONNETTE = "maisonnette"
    PENTHOUSE = "penthouse"
    GRACHTENPAND = "grachtenpand"
    HERENHUIS = "herenhuis"
    WOONBOERDERIJ = "woonboerderij"
    BUNGALOW = "bungalow"
    VILLA = "villa"
    OVERIG = "overig"


class EnergyLabel(str, Enum):
    A_PLUS_PLUS_PLUS_PLUS = "A++++"
    A_PLUS_PLUS_PLUS = "A+++"
    A_PLUS_PLUS = "A++"
    A_PLUS = "A+"
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class ParkeerType(str, Enum):
    GEEN = "geen"
    STRAAT = "straat"
    OPRIT = "oprit"
    GARAGE = "garage"
    PARKEERPLAATS = "parkeerplaats"
    CARPORT = "carport"


class WoningStatus(str, Enum):
    TE_KOOP = "te_koop"
    BOD_GEDAAN = "bod_gedaan"
    GEKOCHT = "gekocht"
    AFGEVALLEN = "afgevallen"
    VERKOCHT = "verkocht"


@dataclass
class Woning:
    """Representatie van een woning met alle relevante kenmerken."""

    # Prijs
    vraagprijs: int
    stad: str
    postcode: str

    # Identificatie
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    naam: str = ""
    funda_url: Optional[str] = None

    # Prijzen
    biedprijs: Optional[int] = None
    verkoopprijs: Optional[int] = None
    woz_waarde: Optional[int] = None

    # Locatie
    wijk: Optional[str] = None
    straat: Optional[str] = None
    huisnummer: Optional[str] = None

    # Kenmerken
    woonoppervlakte: int = 0
    perceeloppervlakte: Optional[int] = None
    inhoud: Optional[int] = None  # m3
    aantal_kamers: int = 0
    aantal_slaapkamers: Optional[int] = None
    aantal_badkamers: Optional[int] = None
    aantal_woonlagen: Optional[int] = None
    bouwjaar: int = 0
    woningtype: WoningType = WoningType.OVERIG
    energielabel: Optional[EnergyLabel] = None

    # Voorzieningen
    tuin: bool = False
    tuin_oppervlakte: Optional[int] = None
    tuin_ligging: Optional[str] = None  # noord, zuid, oost, west
    balkon: bool = False
    dakterras: bool = False
    parkeren: ParkeerType = ParkeerType.GEEN
    berging: bool = False
    zolder: bool = False
    kelder: bool = False

    # VvE (voor appartementen)
    vve_bijdrage: Optional[float] = None  # maandelijks
    servicekosten: Optional[float] = None

    # Staat
    staat_onderhoud_binnen: Optional[str] = None  # goed, redelijk, matig, slecht
    staat_onderhoud_buiten: Optional[str] = None
    isolatie: list[str] = field(default_factory=list)  # dubbelglas, dakisolatie, etc.
    verwarming: Optional[str] = None  # cv, stadsverwarming, warmtepomp
    warm_water: Optional[str] = None

    # Status & meta
    status: WoningStatus = WoningStatus.TE_KOOP
    datum_toegevoegd: str = field(
        default_factory=lambda: datetime.now().isoformat()
    )
    datum_bezichtiging: Optional[str] = None
    notities: Optional[str] = None

    @property
    def prijs_per_m2(self) -> Optional[float]:
        if self.woonoppervlakte > 0:
            return self.vraagprijs / self.woonoppervlakte
        return None

    @property
    def display_naam(self) -> str:
        if self.naam:
            return self.naam
        parts = []
        if self.straat:
            s = self.straat
            if self.huisnummer:
                s += f" {self.huisnummer}"
            parts.append(s)
        parts.append(self.stad)
        return ", ".join(parts) if parts else f"Woning {self.id}"
