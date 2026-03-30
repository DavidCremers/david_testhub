"""Berekening van alle kosten koper."""

from __future__ import annotations

from ..data import defaults
from ..models.koper import KoperProfiel
from ..models.resultaat import KostenResultaat


def bereken_overdrachtsbelasting(
    koopsom: int,
    starter: bool = False,
    leeftijd: int = 30,
) -> float:
    """Bereken overdrachtsbelasting.

    Starters (<=35 jaar) zijn vrijgesteld tot de startersgrens.
    """
    if starter and leeftijd <= defaults.STARTER_MAX_LEEFTIJD:
        if koopsom <= defaults.STARTER_VRIJSTELLING_GRENS:
            return 0.0
    return koopsom * defaults.OVERDRACHTSBELASTING_PCT


def bereken_notariskosten(koopsom: int) -> tuple[float, float]:
    """Schat notariskosten voor leveringsakte en hypotheekakte.

    Returns (leveringsakte, hypotheekakte).
    """
    # Schaling op basis van koopsom
    factor = min(koopsom / 500_000, 1.5)

    leveringsakte = defaults.NOTARIS_LEVERINGSAKTE_MIN + (
        (defaults.NOTARIS_LEVERINGSAKTE_MAX - defaults.NOTARIS_LEVERINGSAKTE_MIN)
        * factor
    )
    hypotheekakte = defaults.NOTARIS_HYPOTHEEKAKTE_MIN + (
        (defaults.NOTARIS_HYPOTHEEKAKTE_MAX - defaults.NOTARIS_HYPOTHEEKAKTE_MIN)
        * factor
    )

    return round(leveringsakte, 2), round(hypotheekakte, 2)


def bereken_taxatiekosten(koopsom: int) -> float:
    """Schat taxatiekosten."""
    factor = min(koopsom / 500_000, 1.5)
    kosten = defaults.TAXATIEKOSTEN_MIN + (
        (defaults.TAXATIEKOSTEN_MAX - defaults.TAXATIEKOSTEN_MIN) * factor
    )
    return round(kosten, 2)


def bereken_nhg_kosten(hypotheeksom: int, nhg: bool = False) -> float:
    """Bereken NHG borgtochtprovisie."""
    if not nhg:
        return 0.0
    if hypotheeksom > defaults.NHG_GRENS:
        return 0.0  # boven NHG-grens, niet mogelijk
    return round(hypotheeksom * defaults.NHG_PROVISIE_PCT, 2)


def bereken_makelaarskosten(koopsom: int, percentage: float | None = None) -> float:
    """Bereken aankoopmakelaar kosten."""
    pct = percentage if percentage is not None else defaults.MAKELAARSKOSTEN_PCT
    return round(koopsom * pct, 2)


def bereken_kosten_koper(
    koopsom: int,
    koper: KoperProfiel,
    nhg: bool = False,
    aankoopmakelaar: bool = True,
    makelaar_pct: float | None = None,
    bouwkundig_rapport: bool = False,
    advieskosten: bool = True,
) -> KostenResultaat:
    """Bereken alle kosten koper in een overzicht."""
    overdracht = bereken_overdrachtsbelasting(koopsom, koper.starter, koper.leeftijd)
    notaris_lever, notaris_hyp = bereken_notariskosten(koopsom)
    taxatie = bereken_taxatiekosten(koopsom)
    nhg_kosten = bereken_nhg_kosten(koopsom, nhg)
    makelaar = bereken_makelaarskosten(koopsom, makelaar_pct) if aankoopmakelaar else 0.0
    bouwk = defaults.BOUWKUNDIG_RAPPORT_KOSTEN if bouwkundig_rapport else None
    advies = defaults.ADVIESKOSTEN_HYPOTHEEK if advieskosten else 0.0

    return KostenResultaat(
        koopsom=koopsom,
        overdrachtsbelasting=overdracht,
        notaris_leveringsakte=notaris_lever,
        notaris_hypotheekakte=notaris_hyp,
        taxatiekosten=taxatie,
        nhg_kosten=nhg_kosten,
        makelaarskosten=makelaar,
        bankgarantie=defaults.BANKGARANTIE_KOSTEN,
        bouwkundig_rapport=bouwk,
        advieskosten=advies,
    )
