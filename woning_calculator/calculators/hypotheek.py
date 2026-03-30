"""Hypotheek calculator - annuiteit en lineair."""

from __future__ import annotations

from ..models.hypotheek import HypotheekParams, HypotheekType
from ..models.koper import KoperProfiel
from ..models.resultaat import MaandDetail, MaandlastenResultaat
from ..data import defaults


def bereken_hypotheek(params: HypotheekParams) -> MaandlastenResultaat:
    """Bereken hypotheek op basis van type (annuiteit of lineair)."""
    if params.type == HypotheekType.ANNUITEIT:
        return _bereken_annuiteit(params)
    return _bereken_lineair(params)


def _bereken_annuiteit(params: HypotheekParams) -> MaandlastenResultaat:
    """Bereken annuiteitenhypotheek."""
    maand_rente = params.rente_percentage / 100 / 12
    n_maanden = params.looptijd_jaren * 12
    hoofdsom = params.hoofdsom

    if maand_rente == 0:
        maandlast = hoofdsom / n_maanden
    else:
        maandlast = hoofdsom * (
            maand_rente * (1 + maand_rente) ** n_maanden
        ) / ((1 + maand_rente) ** n_maanden - 1)

    schema = []
    restschuld = float(hoofdsom)
    totaal_rente = 0.0
    totaal_aflossing = 0.0

    for maand in range(1, n_maanden + 1):
        rente = restschuld * maand_rente
        aflossing = maandlast - rente
        extra = params.extra_aflossing_maand

        if restschuld - aflossing - extra < 0:
            extra = max(0, restschuld - aflossing)

        restschuld -= aflossing + extra
        if restschuld < 0:
            restschuld = 0

        totaal_rente += rente
        totaal_aflossing += aflossing + extra

        schema.append(MaandDetail(
            maand=maand,
            aflossing=round(aflossing, 2),
            rente=round(rente, 2),
            totaal_betaling=round(maandlast + extra, 2),
            restschuld=round(restschuld, 2),
            extra_aflossing=round(extra, 2),
        ))

        if restschuld <= 0:
            break

    return MaandlastenResultaat(
        maandlast_bruto=round(maandlast, 2),
        maandlast_netto=0.0,  # wordt later ingevuld door belasting calculator
        totaal_rente=round(totaal_rente, 2),
        totaal_aflossing=round(totaal_aflossing, 2),
        totaal_betaald=round(totaal_rente + totaal_aflossing, 2),
        maand_schema=schema,
        eerste_maand_rente=schema[0].rente if schema else 0,
        eerste_maand_aflossing=schema[0].aflossing if schema else 0,
        laatste_maand_rente=schema[-1].rente if schema else 0,
        laatste_maand_aflossing=schema[-1].aflossing if schema else 0,
    )


def _bereken_lineair(params: HypotheekParams) -> MaandlastenResultaat:
    """Bereken lineaire hypotheek."""
    maand_rente = params.rente_percentage / 100 / 12
    n_maanden = params.looptijd_jaren * 12
    hoofdsom = params.hoofdsom

    maandelijkse_aflossing = hoofdsom / n_maanden

    schema = []
    restschuld = float(hoofdsom)
    totaal_rente = 0.0
    totaal_aflossing = 0.0
    eerste_maandlast = 0.0

    for maand in range(1, n_maanden + 1):
        rente = restschuld * maand_rente
        aflossing = maandelijkse_aflossing
        extra = params.extra_aflossing_maand

        if restschuld - aflossing - extra < 0:
            extra = max(0, restschuld - aflossing)
            aflossing = min(aflossing, restschuld)

        maandlast = aflossing + rente + extra
        restschuld -= aflossing + extra
        if restschuld < 0:
            restschuld = 0

        totaal_rente += rente
        totaal_aflossing += aflossing + extra

        if maand == 1:
            eerste_maandlast = maandlast

        schema.append(MaandDetail(
            maand=maand,
            aflossing=round(aflossing, 2),
            rente=round(rente, 2),
            totaal_betaling=round(maandlast, 2),
            restschuld=round(restschuld, 2),
            extra_aflossing=round(extra, 2),
        ))

        if restschuld <= 0:
            break

    return MaandlastenResultaat(
        maandlast_bruto=round(eerste_maandlast, 2),
        maandlast_netto=0.0,
        totaal_rente=round(totaal_rente, 2),
        totaal_aflossing=round(totaal_aflossing, 2),
        totaal_betaald=round(totaal_rente + totaal_aflossing, 2),
        maand_schema=schema,
        eerste_maand_rente=schema[0].rente if schema else 0,
        eerste_maand_aflossing=schema[0].aflossing if schema else 0,
        laatste_maand_rente=schema[-1].rente if schema else 0,
        laatste_maand_aflossing=schema[-1].aflossing if schema else 0,
    )


def bereken_maximale_hypotheek(
    koper: KoperProfiel,
    rente_percentage: float,
    nhg: bool = False,
) -> int:
    """Schat maximale hypotheek op basis van inkomen (vereenvoudigd).

    Dit is een benadering. De exacte berekening hangt af van NIBUD-woonlastennormen
    die jaarlijks veranderen en afhankelijk zijn van rente, inkomen en huishoudtype.
    """
    inkomen = koper.totaal_inkomen

    # Basiswoonquote (vereenvoudigd)
    woonquote = defaults.WOONQUOTE_BASIS
    # Correctie voor hoger inkomen
    extra_10k = max(0, (inkomen - 30_000)) / 10_000
    woonquote += extra_10k * defaults.WOONQUOTE_CORRECTIE_PER_10K
    woonquote = min(woonquote, 0.38)  # plafond

    max_maandlast = inkomen * woonquote / 12

    # Aftrek voor bestaande verplichtingen
    studieschuld_last = koper.studieschuld * defaults.STUDIESCHULD_WEEGFACTOR
    max_maandlast -= studieschuld_last
    max_maandlast -= koper.alimentatie
    max_maandlast -= koper.overige_leningen

    max_maandlast = max(0, max_maandlast)

    # Bereken maximale hoofdsom op basis van annuiteit
    maand_rente = rente_percentage / 100 / 12
    n_maanden = 30 * 12  # standaard 30 jaar

    if maand_rente == 0:
        max_hoofdsom = max_maandlast * n_maanden
    else:
        max_hoofdsom = max_maandlast * (
            ((1 + maand_rente) ** n_maanden - 1)
            / (maand_rente * (1 + maand_rente) ** n_maanden)
        )

    # NHG-grens
    if nhg:
        max_hoofdsom = min(max_hoofdsom, defaults.NHG_GRENS)

    return int(max_hoofdsom)
