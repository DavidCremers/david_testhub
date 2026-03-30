"""Hypotheekrenteaftrek en belastingberekeningen."""

from __future__ import annotations

from ..data import defaults
from ..models.resultaat import BelastingResultaat, MaandlastenResultaat


def bereken_eigenwoningforfait(woz_waarde: int) -> float:
    """Bereken eigenwoningforfait op basis van WOZ-waarde."""
    if woz_waarde <= 0:
        return 0.0

    if woz_waarde <= defaults.EWF_HOOG_GRENS:
        return woz_waarde * defaults.EWF_PCT

    # Boven de grens: vaste component + percentage over het meerdere
    basis = defaults.EWF_HOOG_GRENS * defaults.EWF_PCT
    extra = (woz_waarde - defaults.EWF_HOOG_GRENS) * defaults.EWF_HOOG_PCT
    return basis + extra


def bereken_belasting_tarief(bruto_inkomen: float) -> float:
    """Bepaal effectief belastingtarief voor renteaftrek.

    Hypotheekrenteaftrek is beperkt tot het basistarief (laag tarief).
    """
    # Sinds 2023 is de aftrek maximaal tegen het lage tarief
    return defaults.BOX1_TARIEF_LAAG


def bereken_renteaftrek(
    hypotheek_resultaat: MaandlastenResultaat,
    woz_waarde: int,
    bruto_inkomen: float,
    bruto_maandlast: float | None = None,
) -> BelastingResultaat:
    """Bereken netto voordeel van hypotheekrenteaftrek.

    Args:
        hypotheek_resultaat: Resultaat van hypotheekberekening
        woz_waarde: WOZ-waarde van de woning
        bruto_inkomen: Bruto jaarinkomen voor tariefbepaling
        bruto_maandlast: Override voor bruto maandlast (optioneel)
    """
    # Jaarlijkse rente (eerste jaar als benadering)
    bruto_rente_jaar = sum(
        m.rente for m in hypotheek_resultaat.maand_schema[:12]
    )

    ewf = bereken_eigenwoningforfait(woz_waarde)
    aftrekbare_rente = max(0, bruto_rente_jaar - ewf)

    tarief = bereken_belasting_tarief(bruto_inkomen)
    voordeel_jaar = aftrekbare_rente * tarief
    voordeel_maand = voordeel_jaar / 12

    maandlast = bruto_maandlast or hypotheek_resultaat.maandlast_bruto
    netto_maandlast = maandlast - voordeel_maand

    return BelastingResultaat(
        bruto_rente_jaar=round(bruto_rente_jaar, 2),
        eigenwoningforfait=round(ewf, 2),
        aftrekbare_rente=round(aftrekbare_rente, 2),
        belasting_voordeel_jaar=round(voordeel_jaar, 2),
        belasting_voordeel_maand=round(voordeel_maand, 2),
        effectief_tarief=round(tarief * 100, 2),
        netto_woonlasten_maand=round(netto_maandlast, 2),
    )
