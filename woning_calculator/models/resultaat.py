"""Resultaat modellen voor berekeningen."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MaandDetail:
    """Detail van een maand in het aflossingsschema."""

    maand: int
    aflossing: float
    rente: float
    totaal_betaling: float
    restschuld: float
    extra_aflossing: float = 0.0


@dataclass
class MaandlastenResultaat:
    """Resultaat van hypotheekberekening."""

    maandlast_bruto: float  # voor aftrek
    maandlast_netto: float  # na aftrek (geschat)
    totaal_rente: float
    totaal_aflossing: float
    totaal_betaald: float
    maand_schema: list[MaandDetail] = field(default_factory=list)

    # Eerste en laatste maand details
    eerste_maand_rente: float = 0.0
    eerste_maand_aflossing: float = 0.0
    laatste_maand_rente: float = 0.0
    laatste_maand_aflossing: float = 0.0


@dataclass
class KostenPost:
    """Enkele kostenpost."""

    naam: str
    bedrag: float
    toelichting: str = ""


@dataclass
class KostenResultaat:
    """Overzicht van alle kosten koper."""

    koopsom: int
    overdrachtsbelasting: float
    notaris_leveringsakte: float
    notaris_hypotheekakte: float
    taxatiekosten: float
    nhg_kosten: float
    makelaarskosten: float
    bankgarantie: float
    bouwkundig_rapport: Optional[float] = None
    advieskosten: float = 0.0

    @property
    def totaal_kosten_koper(self) -> float:
        return (
            self.overdrachtsbelasting
            + self.notaris_leveringsakte
            + self.notaris_hypotheekakte
            + self.taxatiekosten
            + self.nhg_kosten
            + self.makelaarskosten
            + self.bankgarantie
            + (self.bouwkundig_rapport or 0)
            + self.advieskosten
        )

    @property
    def totaal_benodigde_eigen_geld(self) -> float:
        """Eigen geld nodig: kosten koper moeten uit eigen zak."""
        return self.totaal_kosten_koper

    @property
    def alle_posten(self) -> list[KostenPost]:
        posten = [
            KostenPost("Overdrachtsbelasting", self.overdrachtsbelasting),
            KostenPost("Notaris leveringsakte", self.notaris_leveringsakte),
            KostenPost("Notaris hypotheekakte", self.notaris_hypotheekakte),
            KostenPost("Taxatiekosten", self.taxatiekosten),
            KostenPost("Makelaarskosten (aankoop)", self.makelaarskosten),
            KostenPost("Bankgarantie", self.bankgarantie),
        ]
        if self.nhg_kosten > 0:
            posten.append(KostenPost("NHG borgtochtprovisie", self.nhg_kosten))
        if self.bouwkundig_rapport:
            posten.append(KostenPost("Bouwkundig rapport", self.bouwkundig_rapport))
        if self.advieskosten > 0:
            posten.append(KostenPost("Advieskosten hypotheek", self.advieskosten))
        return posten


@dataclass
class BiedingResultaat:
    """Resultaat van biedingsanalyse."""

    vraagprijs: int
    geschatte_marktwaarde: int
    advies_bieding_laag: int
    advies_bieding_midden: int
    advies_bieding_hoog: int
    prijs_per_m2_woning: Optional[float]
    prijs_per_m2_markt: Optional[float]
    overbied_percentage_markt: Optional[float]
    factoren: list[str] = field(default_factory=list)  # toelichtingen


@dataclass
class BelastingResultaat:
    """Resultaat van belastingberekening (hypotheekrenteaftrek)."""

    bruto_rente_jaar: float
    eigenwoningforfait: float
    aftrekbare_rente: float  # bruto_rente - eigenwoningforfait
    belasting_voordeel_jaar: float
    belasting_voordeel_maand: float
    effectief_tarief: float  # % belastingvoordeel
    netto_woonlasten_maand: float  # bruto maandlast - voordeel
