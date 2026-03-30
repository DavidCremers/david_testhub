"""Terminal output formatting."""

from __future__ import annotations

from ..models.resultaat import (
    BelastingResultaat,
    BiedingResultaat,
    KostenResultaat,
    MaandlastenResultaat,
)
from ..models.woning import Woning

# ANSI kleuren
BOLD = "\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
DIM = "\033[2m"
RESET = "\033[0m"


def _euro(bedrag: float) -> str:
    return f"\u20ac {bedrag:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _euro_int(bedrag: int) -> str:
    return f"\u20ac {bedrag:,}".replace(",", ".")


def _lijn(breedte: int = 60) -> str:
    return "-" * breedte


def toon_woning(woning: Woning) -> str:
    """Formatteer een woning als tekst."""
    lines = [
        f"{BOLD}{woning.display_naam}{RESET}",
        f"  ID: {woning.id}  |  Status: {woning.status.value}",
        _lijn(),
    ]

    # Prijs
    lines.append(f"  Vraagprijs:       {_euro_int(woning.vraagprijs)}")
    if woning.biedprijs:
        lines.append(f"  Biedprijs:        {_euro_int(woning.biedprijs)}")
    if woning.verkoopprijs:
        lines.append(f"  Verkoopprijs:     {_euro_int(woning.verkoopprijs)}")
    if woning.woz_waarde:
        lines.append(f"  WOZ-waarde:       {_euro_int(woning.woz_waarde)}")

    # Locatie
    lines.append("")
    adres = woning.straat or ""
    if woning.huisnummer:
        adres += f" {woning.huisnummer}"
    lines.append(f"  Adres:            {adres.strip()}")
    lines.append(f"  Postcode:         {woning.postcode}")
    lines.append(f"  Stad:             {woning.stad}")
    if woning.wijk:
        lines.append(f"  Wijk:             {woning.wijk}")

    # Kenmerken
    lines.append("")
    lines.append(f"  Woonoppervlakte:  {woning.woonoppervlakte} m\u00b2")
    if woning.perceeloppervlakte:
        lines.append(f"  Perceeloppervlakte: {woning.perceeloppervlakte} m\u00b2")
    lines.append(f"  Kamers:           {woning.aantal_kamers}")
    if woning.aantal_slaapkamers:
        lines.append(f"  Slaapkamers:      {woning.aantal_slaapkamers}")
    lines.append(f"  Bouwjaar:         {woning.bouwjaar}")
    lines.append(f"  Type:             {woning.woningtype.value}")
    if woning.energielabel:
        lines.append(f"  Energielabel:     {woning.energielabel.value}")

    # Prijs per m2
    if woning.prijs_per_m2:
        lines.append(f"  Prijs/m\u00b2:         {_euro(woning.prijs_per_m2)}")

    # Voorzieningen
    voorz = []
    if woning.tuin:
        t = "Tuin"
        if woning.tuin_oppervlakte:
            t += f" ({woning.tuin_oppervlakte}m\u00b2)"
        if woning.tuin_ligging:
            t += f" [{woning.tuin_ligging}]"
        voorz.append(t)
    if woning.balkon:
        voorz.append("Balkon")
    if woning.dakterras:
        voorz.append("Dakterras")
    if woning.parkeren.value != "geen":
        voorz.append(f"Parkeren: {woning.parkeren.value}")
    if woning.berging:
        voorz.append("Berging")
    if voorz:
        lines.append("")
        lines.append(f"  Voorzieningen:    {', '.join(voorz)}")

    if woning.vve_bijdrage:
        lines.append(f"  VvE bijdrage:     {_euro(woning.vve_bijdrage)}/maand")

    if woning.funda_url:
        lines.append(f"\n  Funda: {woning.funda_url}")

    if woning.notities:
        lines.append(f"\n  Notities: {woning.notities}")

    return "\n".join(lines)


def toon_hypotheek(resultaat: MaandlastenResultaat, label: str = "") -> str:
    """Formatteer hypotheekresultaat."""
    titel = f"Hypotheekberekening{f' - {label}' if label else ''}"
    lines = [
        f"\n{BOLD}{titel}{RESET}",
        _lijn(),
        f"  Bruto maandlast:      {BOLD}{_euro(resultaat.maandlast_bruto)}{RESET}",
    ]
    if resultaat.maandlast_netto > 0:
        lines.append(f"  Netto maandlast:      {GREEN}{_euro(resultaat.maandlast_netto)}{RESET}")

    lines.extend([
        "",
        f"  Eerste maand:",
        f"    Rente:              {_euro(resultaat.eerste_maand_rente)}",
        f"    Aflossing:          {_euro(resultaat.eerste_maand_aflossing)}",
        f"  Laatste maand:",
        f"    Rente:              {_euro(resultaat.laatste_maand_rente)}",
        f"    Aflossing:          {_euro(resultaat.laatste_maand_aflossing)}",
        "",
        f"  Totaal rente betaald: {_euro(resultaat.totaal_rente)}",
        f"  Totaal aflossing:     {_euro(resultaat.totaal_aflossing)}",
        f"  Totaal betaald:       {_euro(resultaat.totaal_betaald)}",
    ])

    return "\n".join(lines)


def toon_kosten(resultaat: KostenResultaat) -> str:
    """Formatteer kosten koper overzicht."""
    lines = [
        f"\n{BOLD}Kosten Koper{RESET}",
        _lijn(),
        f"  Koopsom:                    {_euro_int(resultaat.koopsom)}",
        "",
    ]

    for post in resultaat.alle_posten:
        lines.append(f"  {post.naam:<30s} {_euro(post.bedrag)}")

    lines.extend([
        _lijn(),
        f"  {BOLD}Totaal kosten koper:          {_euro(resultaat.totaal_kosten_koper)}{RESET}",
        f"  {YELLOW}Benodigd eigen geld:          {_euro(resultaat.totaal_benodigde_eigen_geld)}{RESET}",
    ])

    return "\n".join(lines)


def toon_bieding(resultaat: BiedingResultaat) -> str:
    """Formatteer biedingsadvies."""
    lines = [
        f"\n{BOLD}Biedingsadvies{RESET}",
        _lijn(),
        f"  Vraagprijs:                {_euro_int(resultaat.vraagprijs)}",
        f"  Geschatte marktwaarde:     {_euro_int(resultaat.geschatte_marktwaarde)}",
        "",
        f"  {GREEN}Advies bieding (laag):       {_euro_int(resultaat.advies_bieding_laag)}{RESET}",
        f"  {BOLD}Advies bieding (midden):     {_euro_int(resultaat.advies_bieding_midden)}{RESET}",
        f"  {RED}Advies bieding (hoog):       {_euro_int(resultaat.advies_bieding_hoog)}{RESET}",
    ]

    if resultaat.prijs_per_m2_woning:
        lines.append(f"\n  Prijs/m\u00b2 woning:            {_euro(resultaat.prijs_per_m2_woning)}")
    if resultaat.prijs_per_m2_markt:
        lines.append(f"  Prijs/m\u00b2 markt:             {_euro(resultaat.prijs_per_m2_markt)}")

    if resultaat.factoren:
        lines.append(f"\n  {DIM}Factoren:{RESET}")
        for f in resultaat.factoren:
            lines.append(f"    - {f}")

    return "\n".join(lines)


def toon_belasting(resultaat: BelastingResultaat) -> str:
    """Formatteer belastingresultaat."""
    lines = [
        f"\n{BOLD}Hypotheekrenteaftrek{RESET}",
        _lijn(),
        f"  Bruto rente per jaar:       {_euro(resultaat.bruto_rente_jaar)}",
        f"  Eigenwoningforfait:         {_euro(resultaat.eigenwoningforfait)}",
        f"  Aftrekbare rente:           {_euro(resultaat.aftrekbare_rente)}",
        f"  Aftrek tarief:              {resultaat.effectief_tarief:.2f}%",
        "",
        f"  {GREEN}Belastingvoordeel/jaar:       {_euro(resultaat.belasting_voordeel_jaar)}{RESET}",
        f"  {GREEN}Belastingvoordeel/maand:      {_euro(resultaat.belasting_voordeel_maand)}{RESET}",
        "",
        f"  {BOLD}Netto woonlasten/maand:       {_euro(resultaat.netto_woonlasten_maand)}{RESET}",
    ]

    return "\n".join(lines)


def toon_vergelijking(woningen: list[Woning]) -> str:
    """Toon vergelijkingstabel van woningen."""
    if not woningen:
        return "Geen woningen om te vergelijken."

    # Header
    col_w = 22
    header = f"{'':18s}"
    for w in woningen:
        naam = w.display_naam[:col_w - 2]
        header += f" {naam:<{col_w}s}"

    lines = [
        f"\n{BOLD}Vergelijking Woningen{RESET}",
        _lijn(18 + col_w * len(woningen)),
        header,
        _lijn(18 + col_w * len(woningen)),
    ]

    def rij(label: str, values: list[str]) -> str:
        r = f"  {label:<16s}"
        for v in values:
            r += f" {v:<{col_w}s}"
        return r

    lines.append(rij("Vraagprijs", [_euro_int(w.vraagprijs) for w in woningen]))
    lines.append(rij("Oppervlakte", [f"{w.woonoppervlakte} m\u00b2" for w in woningen]))
    lines.append(rij("Prijs/m\u00b2", [
        _euro(w.prijs_per_m2) if w.prijs_per_m2 else "-" for w in woningen
    ]))
    lines.append(rij("Kamers", [str(w.aantal_kamers) for w in woningen]))
    lines.append(rij("Bouwjaar", [str(w.bouwjaar) if w.bouwjaar else "-" for w in woningen]))
    lines.append(rij("Type", [w.woningtype.value for w in woningen]))
    lines.append(rij("Energielabel", [
        w.energielabel.value if w.energielabel else "-" for w in woningen
    ]))
    lines.append(rij("Stad", [w.stad for w in woningen]))
    lines.append(rij("Status", [w.status.value for w in woningen]))

    if any(w.verkoopprijs for w in woningen):
        lines.append(rij("Verkoopprijs", [
            _euro_int(w.verkoopprijs) if w.verkoopprijs else "-" for w in woningen
        ]))
        lines.append(rij("Verschil", [
            _euro_int(w.verkoopprijs - w.vraagprijs) if w.verkoopprijs else "-"
            for w in woningen
        ]))

    return "\n".join(lines)


def toon_samenvatting(
    woning: Woning,
    hypotheek: MaandlastenResultaat,
    kosten: KostenResultaat,
    belasting: BelastingResultaat,
    bieding: BiedingResultaat,
) -> str:
    """Toon complete samenvatting voor een woning."""
    delen = [
        toon_woning(woning),
        toon_bieding(bieding),
        toon_kosten(kosten),
        toon_hypotheek(hypotheek),
        toon_belasting(belasting),
    ]
    return "\n\n".join(delen)
