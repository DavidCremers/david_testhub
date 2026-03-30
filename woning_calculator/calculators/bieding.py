"""Biedingsadvies calculator."""

from __future__ import annotations

from typing import Optional

from ..data import defaults
from ..models.resultaat import BiedingResultaat
from ..models.woning import EnergyLabel, Woning


def _get_overbied_pct(stad: str) -> float:
    """Haal overbiedpercentage op voor een stad."""
    return defaults.OVERBIEDEN_DEFAULTS.get(
        stad.lower().strip(),
        defaults.OVERBIEDEN_DEFAULTS["default"],
    )


def _get_gem_m2_prijs(stad: str) -> float:
    """Haal gemiddelde m2-prijs op voor een stad."""
    return defaults.GEM_M2_PRIJS.get(
        stad.lower().strip(),
        defaults.GEM_M2_PRIJS["default"],
    )


def _energielabel_factor(label: Optional[EnergyLabel]) -> float:
    """Bepaal waardefactor op basis van energielabel."""
    if label is None:
        return 1.0
    return defaults.ENERGIELABEL_FACTOREN.get(label.value, 1.0)


def _bouwjaar_factor(bouwjaar: int) -> float:
    """Correctiefactor op basis van bouwjaar."""
    if bouwjaar == 0:
        return 1.0
    if bouwjaar >= 2020:
        return 1.05
    if bouwjaar >= 2010:
        return 1.03
    if bouwjaar >= 2000:
        return 1.01
    if bouwjaar >= 1990:
        return 1.00
    if bouwjaar >= 1970:
        return 0.98
    if bouwjaar >= 1950:
        return 0.96
    if bouwjaar >= 1930:
        return 0.97  # vooroorlogse woningen vaak weer gewild
    return 0.95


def _voorzieningen_factor(woning: Woning) -> float:
    """Correctiefactor op basis van voorzieningen."""
    factor = 1.0
    if woning.tuin:
        factor += 0.02
        if woning.tuin_ligging and "zuid" in woning.tuin_ligging.lower():
            factor += 0.01
    if woning.parkeren in ("garage", "oprit"):
        factor += 0.02
    if woning.balkon:
        factor += 0.005
    if woning.dakterras:
        factor += 0.01
    return factor


def schat_marktwaarde(woning: Woning) -> int:
    """Schat de marktwaarde op basis van m2-prijs, locatie en kenmerken."""
    gem_m2 = _get_gem_m2_prijs(woning.stad)

    if woning.woonoppervlakte > 0:
        basis = gem_m2 * woning.woonoppervlakte
    else:
        basis = float(woning.vraagprijs)

    # Correctiefactoren
    basis *= _energielabel_factor(woning.energielabel)
    basis *= _bouwjaar_factor(woning.bouwjaar)
    basis *= _voorzieningen_factor(woning)

    return int(round(basis, -3))  # afronden op duizendtallen


def bereken_bieding(
    woning: Woning,
    overbied_pct_override: float | None = None,
    markt_m2_override: float | None = None,
) -> BiedingResultaat:
    """Bereken biedingsadvies voor een woning.

    Geeft een laag, midden en hoog advies.
    """
    factoren = []

    # Marktgegevens
    overbied_pct = overbied_pct_override or _get_overbied_pct(woning.stad)
    gem_m2 = markt_m2_override or _get_gem_m2_prijs(woning.stad)
    woning_m2 = woning.prijs_per_m2

    # Geschatte marktwaarde
    marktwaarde = schat_marktwaarde(woning)

    # Basis: gewogen gemiddelde van vraagprijs en marktwaarde
    basis = int(0.6 * woning.vraagprijs + 0.4 * marktwaarde)

    # Overbiedcorrectie
    overbied_factor = 1 + overbied_pct / 100
    factoren.append(f"Gem. overbieden {woning.stad}: {overbied_pct:.1f}%")

    # Energielabel impact
    el_factor = _energielabel_factor(woning.energielabel)
    if woning.energielabel:
        if el_factor > 1.0:
            factoren.append(f"Energielabel {woning.energielabel.value}: +{(el_factor-1)*100:.0f}% waarde")
        elif el_factor < 1.0:
            factoren.append(f"Energielabel {woning.energielabel.value}: {(el_factor-1)*100:.0f}% waarde")

    # Bouwjaar impact
    bj_factor = _bouwjaar_factor(woning.bouwjaar)
    if woning.bouwjaar > 0:
        factoren.append(f"Bouwjaar {woning.bouwjaar}: factor {bj_factor:.2f}")

    # M2-prijs vergelijking
    if woning_m2 and gem_m2:
        verschil_pct = ((woning_m2 - gem_m2) / gem_m2) * 100
        if verschil_pct > 5:
            factoren.append(f"Vraagprijs/m2 ({woning_m2:,.0f}) is {verschil_pct:.0f}% boven marktgemiddelde ({gem_m2:,.0f})")
        elif verschil_pct < -5:
            factoren.append(f"Vraagprijs/m2 ({woning_m2:,.0f}) is {abs(verschil_pct):.0f}% onder marktgemiddelde ({gem_m2:,.0f})")
        else:
            factoren.append(f"Vraagprijs/m2 ({woning_m2:,.0f}) dicht bij marktgemiddelde ({gem_m2:,.0f})")

    # Bereken drie biedingsniveaus
    midden = int(round(basis * overbied_factor, -3))
    laag = int(round(basis * (1 + overbied_pct / 100 * 0.5), -3))
    hoog = int(round(basis * (1 + overbied_pct / 100 * 1.5), -3))

    return BiedingResultaat(
        vraagprijs=woning.vraagprijs,
        geschatte_marktwaarde=marktwaarde,
        advies_bieding_laag=laag,
        advies_bieding_midden=midden,
        advies_bieding_hoog=hoog,
        prijs_per_m2_woning=round(woning_m2, 2) if woning_m2 else None,
        prijs_per_m2_markt=gem_m2,
        overbied_percentage_markt=overbied_pct,
        factoren=factoren,
    )
