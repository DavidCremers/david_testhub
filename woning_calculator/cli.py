"""CLI interface voor de Woning Calculator."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

import typer

from .calculators.belasting import bereken_renteaftrek
from .calculators.bieding import bereken_bieding
from .calculators.hypotheek import bereken_hypotheek, bereken_maximale_hypotheek
from .calculators.kosten import bereken_kosten_koper
from .data.locatie import LocatieData
from .data.opslag import WoningOpslag
from .models.hypotheek import HypotheekParams, HypotheekType
from .models.koper import KoperProfiel
from .models.woning import (
    EnergyLabel,
    ParkeerType,
    Woning,
    WoningStatus,
    WoningType,
)
from .output.export import exporteer_csv, exporteer_json
from .output.terminal import (
    toon_belasting,
    toon_bieding,
    toon_hypotheek,
    toon_kosten,
    toon_samenvatting,
    toon_vergelijking,
    toon_woning,
)

app = typer.Typer(
    name="woning-calc",
    help="Nederlandse woningmarkt calculator - hypotheek, kosten, bieding.",
    no_args_is_help=True,
)

opslag = WoningOpslag()


def _get_woning(woning_id: str) -> Woning:
    """Haal woning op of geef foutmelding."""
    woning = opslag.laden(woning_id)
    if woning is None:
        typer.echo(f"Woning met ID '{woning_id}' niet gevonden.")
        raise typer.Exit(1)
    return woning


# --- Woningen beheren ---


@app.command()
def toevoegen(
    vraagprijs: int = typer.Option(..., prompt="Vraagprijs (EUR)"),
    stad: str = typer.Option(..., prompt="Stad"),
    postcode: str = typer.Option(..., prompt="Postcode"),
    naam: str = typer.Option("", prompt="Naam/omschrijving (optioneel)"),
    straat: str = typer.Option("", prompt="Straat (optioneel)"),
    huisnummer: str = typer.Option("", prompt="Huisnummer (optioneel)"),
    wijk: str = typer.Option("", prompt="Wijk (optioneel)"),
    woonoppervlakte: int = typer.Option(0, prompt="Woonoppervlakte (m2)"),
    perceeloppervlakte: int = typer.Option(0, prompt="Perceeloppervlakte (m2, 0=onbekend)"),
    aantal_kamers: int = typer.Option(0, prompt="Aantal kamers"),
    aantal_slaapkamers: int = typer.Option(0, prompt="Aantal slaapkamers (0=onbekend)"),
    bouwjaar: int = typer.Option(0, prompt="Bouwjaar"),
    woningtype: WoningType = typer.Option(WoningType.OVERIG, prompt="Woningtype"),
    energielabel: str = typer.Option("", prompt="Energielabel (A++++..G, leeg=onbekend)"),
    tuin: bool = typer.Option(False, prompt="Tuin?"),
    balkon: bool = typer.Option(False, prompt="Balkon?"),
    parkeren: ParkeerType = typer.Option(ParkeerType.GEEN, prompt="Parkeren"),
    vve_bijdrage: float = typer.Option(0.0, prompt="VvE bijdrage/maand (0=nvt)"),
    funda_url: str = typer.Option("", prompt="Funda URL (optioneel)"),
    woz_waarde: int = typer.Option(0, prompt="WOZ-waarde (0=onbekend)"),
    notities: str = typer.Option("", prompt="Notities (optioneel)"),
):
    """Voeg een nieuwe woning toe."""
    el = None
    if energielabel.strip():
        try:
            el = EnergyLabel(energielabel.strip())
        except ValueError:
            typer.echo(f"Ongeldig energielabel: {energielabel}")
            raise typer.Exit(1)

    woning = Woning(
        vraagprijs=vraagprijs,
        stad=stad,
        postcode=postcode,
        naam=naam or "",
        straat=straat or None,
        huisnummer=huisnummer or None,
        wijk=wijk or None,
        woonoppervlakte=woonoppervlakte,
        perceeloppervlakte=perceeloppervlakte or None,
        aantal_kamers=aantal_kamers,
        aantal_slaapkamers=aantal_slaapkamers or None,
        bouwjaar=bouwjaar,
        woningtype=woningtype,
        energielabel=el,
        tuin=tuin,
        balkon=balkon,
        parkeren=parkeren,
        vve_bijdrage=vve_bijdrage if vve_bijdrage > 0 else None,
        funda_url=funda_url or None,
        woz_waarde=woz_waarde or None,
        notities=notities or None,
    )

    woning_id = opslag.opslaan(woning)
    typer.echo(f"\nWoning opgeslagen met ID: {woning_id}")
    typer.echo(toon_woning(woning))


@app.command()
def lijst(
    stad: Optional[str] = typer.Option(None, help="Filter op stad"),
    status: Optional[str] = typer.Option(None, help="Filter op status"),
):
    """Toon alle opgeslagen woningen."""
    woningen = opslag.zoek(stad=stad, status=status) if (stad or status) else opslag.alle_woningen()
    if not woningen:
        typer.echo("Geen woningen gevonden.")
        return

    typer.echo(f"\n{len(woningen)} woning(en) gevonden:\n")
    for w in woningen:
        m2 = f" | {w.prijs_per_m2:,.0f}/m\u00b2" if w.prijs_per_m2 else ""
        el = f" | {w.energielabel.value}" if w.energielabel else ""
        typer.echo(
            f"  [{w.id}] {w.display_naam:<35s} "
            f"\u20ac {w.vraagprijs:>10,}{m2}{el} | {w.status.value}"
        )


@app.command()
def bekijk(woning_id: str = typer.Argument(..., help="Woning ID")):
    """Bekijk details van een woning."""
    woning = _get_woning(woning_id)
    typer.echo(toon_woning(woning))


@app.command()
def verwijder(woning_id: str = typer.Argument(..., help="Woning ID")):
    """Verwijder een woning."""
    if opslag.verwijderen(woning_id):
        typer.echo(f"Woning {woning_id} verwijderd.")
    else:
        typer.echo(f"Woning {woning_id} niet gevonden.")


@app.command()
def verkoopprijs(
    woning_id: str = typer.Argument(..., help="Woning ID"),
    prijs: int = typer.Argument(..., help="Verkoopprijs in EUR"),
):
    """Registreer de verkoopprijs van een woning."""
    woning = _get_woning(woning_id)
    opslag.bijwerken(woning_id, {
        "verkoopprijs": prijs,
        "status": WoningStatus.VERKOCHT.value,
    })
    verschil = prijs - woning.vraagprijs
    pct = (verschil / woning.vraagprijs) * 100
    richting = "boven" if verschil >= 0 else "onder"
    typer.echo(
        f"Verkoopprijs \u20ac {prijs:,} geregistreerd voor {woning.display_naam}.\n"
        f"  Verschil: \u20ac {abs(verschil):,} ({abs(pct):.1f}% {richting} vraagprijs)"
    )


@app.command()
def biedprijs(
    woning_id: str = typer.Argument(..., help="Woning ID"),
    prijs: int = typer.Argument(..., help="Biedprijs in EUR"),
):
    """Registreer je bod op een woning."""
    _get_woning(woning_id)
    opslag.bijwerken(woning_id, {
        "biedprijs": prijs,
        "status": WoningStatus.BOD_GEDAAN.value,
    })
    typer.echo(f"Biedprijs \u20ac {prijs:,} geregistreerd.")


# --- Berekeningen ---


@app.command()
def hypotheek(
    woning_id: str = typer.Argument(..., help="Woning ID"),
    rente: float = typer.Option(3.85, help="Rente percentage"),
    looptijd: int = typer.Option(30, help="Looptijd in jaren"),
    type: HypotheekType = typer.Option(HypotheekType.ANNUITEIT, help="Type hypotheek"),
    nhg: bool = typer.Option(False, help="Nationale Hypotheek Garantie"),
    eigen_geld: float = typer.Option(0, help="Eigen geld inleg"),
    inkomen: float = typer.Option(0, help="Bruto jaarinkomen (voor renteaftrek)"),
):
    """Bereken hypotheek voor een woning."""
    woning = _get_woning(woning_id)

    hoofdsom = int(woning.vraagprijs - eigen_geld)
    if hoofdsom <= 0:
        typer.echo("Hoofdsom moet positief zijn.")
        raise typer.Exit(1)

    params = HypotheekParams(
        hoofdsom=hoofdsom,
        rente_percentage=rente,
        looptijd_jaren=looptijd,
        type=type,
        nhg=nhg,
    )

    resultaat = bereken_hypotheek(params)
    typer.echo(f"\nWoning: {woning.display_naam} | Vraagprijs: \u20ac {woning.vraagprijs:,}")
    typer.echo(f"Hoofdsom: \u20ac {hoofdsom:,} | Rente: {rente}% | Looptijd: {looptijd} jaar | Type: {type.value}")
    if nhg:
        typer.echo("NHG: Ja")
    typer.echo(toon_hypotheek(resultaat, label=type.value))

    # Belastingvoordeel als inkomen en WOZ bekend
    woz = woning.woz_waarde or woning.vraagprijs
    if inkomen > 0:
        bel = bereken_renteaftrek(resultaat, woz, inkomen)
        resultaat.maandlast_netto = bel.netto_woonlasten_maand
        typer.echo(toon_belasting(bel))

    # VvE bijdrage meenemen
    if woning.vve_bijdrage:
        typer.echo(f"\n  Let op: VvE bijdrage van \u20ac {woning.vve_bijdrage:.2f}/maand komt hier nog bij.")
        netto = resultaat.maandlast_netto or resultaat.maandlast_bruto
        typer.echo(f"  Totale woonlasten incl. VvE: \u20ac {netto + woning.vve_bijdrage:,.2f}/maand")


@app.command()
def kosten(
    woning_id: str = typer.Argument(..., help="Woning ID"),
    starter: bool = typer.Option(False, help="Starter (vrijstelling overdrachtsbelasting)"),
    leeftijd: int = typer.Option(30, help="Leeftijd koper"),
    nhg: bool = typer.Option(False, help="NHG"),
    aankoopmakelaar: bool = typer.Option(True, help="Aankoopmakelaar inschakelen"),
    bouwkundig: bool = typer.Option(False, help="Bouwkundig rapport"),
):
    """Bereken kosten koper voor een woning."""
    woning = _get_woning(woning_id)

    koper = KoperProfiel(
        bruto_jaarinkomen=0,
        leeftijd=leeftijd,
        starter=starter,
    )

    resultaat = bereken_kosten_koper(
        koopsom=woning.vraagprijs,
        koper=koper,
        nhg=nhg,
        aankoopmakelaar=aankoopmakelaar,
        bouwkundig_rapport=bouwkundig,
    )

    typer.echo(f"\nWoning: {woning.display_naam}")
    typer.echo(toon_kosten(resultaat))


@app.command()
def bieding(
    woning_id: str = typer.Argument(..., help="Woning ID"),
    overbied_pct: Optional[float] = typer.Option(None, help="Override overbied percentage"),
):
    """Bereken biedingsadvies voor een woning."""
    woning = _get_woning(woning_id)
    resultaat = bereken_bieding(woning, overbied_pct_override=overbied_pct)
    typer.echo(f"\nWoning: {woning.display_naam}")
    typer.echo(toon_bieding(resultaat))


@app.command()
def vergelijk(
    ids: Optional[str] = typer.Option(None, help="Kommagescheiden woning IDs"),
):
    """Vergelijk woningen naast elkaar."""
    if ids:
        woning_ids = [i.strip() for i in ids.split(",")]
        woningen = []
        for wid in woning_ids:
            w = opslag.laden(wid)
            if w:
                woningen.append(w)
            else:
                typer.echo(f"Woning {wid} niet gevonden, overgeslagen.")
    else:
        woningen = opslag.alle_woningen()

    typer.echo(toon_vergelijking(woningen))


@app.command()
def analyse(
    woning_id: str = typer.Argument(..., help="Woning ID"),
    rente: float = typer.Option(3.85, help="Rente percentage"),
    looptijd: int = typer.Option(30, help="Looptijd in jaren"),
    inkomen: float = typer.Option(50000, help="Bruto jaarinkomen"),
    starter: bool = typer.Option(False, help="Starter"),
    leeftijd: int = typer.Option(30, help="Leeftijd"),
    nhg: bool = typer.Option(False, help="NHG"),
    eigen_geld: float = typer.Option(0, help="Eigen geld"),
):
    """Volledige analyse: hypotheek + kosten + bieding + belasting."""
    woning = _get_woning(woning_id)

    # Hypotheek
    hoofdsom = int(woning.vraagprijs - eigen_geld)
    hyp_params = HypotheekParams(
        hoofdsom=hoofdsom,
        rente_percentage=rente,
        looptijd_jaren=looptijd,
        type=HypotheekType.ANNUITEIT,
        nhg=nhg,
    )
    hyp_result = bereken_hypotheek(hyp_params)

    # Kosten
    koper = KoperProfiel(
        bruto_jaarinkomen=inkomen,
        leeftijd=leeftijd,
        starter=starter,
        eigen_geld=eigen_geld,
    )
    kosten_result = bereken_kosten_koper(woning.vraagprijs, koper, nhg=nhg)

    # Belasting
    woz = woning.woz_waarde or woning.vraagprijs
    bel_result = bereken_renteaftrek(hyp_result, woz, inkomen)
    hyp_result.maandlast_netto = bel_result.netto_woonlasten_maand

    # Bieding
    bied_result = bereken_bieding(woning)

    typer.echo(toon_samenvatting(woning, hyp_result, kosten_result, bel_result, bied_result))

    # Extra info
    typer.echo(f"\n\n{'='*60}")
    typer.echo(f"  Eigen geld beschikbaar:     \u20ac {eigen_geld:,.0f}")
    typer.echo(f"  Kosten koper:               \u20ac {kosten_result.totaal_kosten_koper:,.0f}")
    resterend = eigen_geld - kosten_result.totaal_kosten_koper
    if resterend >= 0:
        typer.echo(f"  Resterend eigen geld:       \u20ac {resterend:,.0f}")
    else:
        typer.echo(f"  Tekort eigen geld:          \u20ac {abs(resterend):,.0f}")

    # Maximale hypotheek
    max_hyp = bereken_maximale_hypotheek(koper, rente, nhg)
    typer.echo(f"\n  Geschatte max. hypotheek:   \u20ac {max_hyp:,}")
    typer.echo(f"  Benodigde hypotheek:        \u20ac {hoofdsom:,}")
    if hoofdsom > max_hyp:
        typer.echo(f"  \u26a0\ufe0f  Hypotheek overschrijdt geschat maximum met \u20ac {hoofdsom - max_hyp:,}")


@app.command()
def max_hypotheek(
    inkomen: float = typer.Option(..., prompt="Bruto jaarinkomen"),
    inkomen_partner: float = typer.Option(0, prompt="Bruto jaarinkomen partner (0=geen)"),
    rente: float = typer.Option(3.85, help="Rente percentage"),
    studieschuld: float = typer.Option(0, help="Studieschuld"),
    nhg: bool = typer.Option(False, help="NHG"),
):
    """Bereken maximale hypotheek op basis van inkomen."""
    koper = KoperProfiel(
        bruto_jaarinkomen=inkomen,
        bruto_jaarinkomen_partner=inkomen_partner if inkomen_partner > 0 else None,
        leeftijd=30,
        studieschuld=studieschuld,
    )

    max_hyp = bereken_maximale_hypotheek(koper, rente, nhg)
    typer.echo(f"\nInkomen: \u20ac {koper.totaal_inkomen:,.0f}")
    if studieschuld > 0:
        typer.echo(f"Studieschuld: \u20ac {studieschuld:,.0f}")
    typer.echo(f"Rente: {rente}%")
    if nhg:
        typer.echo(f"NHG: Ja (max \u20ac 450.000)")
    typer.echo(f"\nGeschatte maximale hypotheek: \u20ac {max_hyp:,}")


# --- Locatie data ---


@app.command()
def locatie(
    stad: str = typer.Option("", help="Stad naam"),
    m2_prijs: float = typer.Option(0, help="Gemiddelde m2-prijs"),
    overbied: float = typer.Option(0, help="Overbied percentage"),
    toon: bool = typer.Option(False, help="Toon alle locatiedata"),
):
    """Beheer locatiedata (m2-prijzen, overbiedpercentages)."""
    loc = LocatieData()

    if toon:
        data = loc.alle_locaties()
        if data:
            for k, v in sorted(data.items()):
                typer.echo(f"  {k:<20s} m2: \u20ac {v.get('m2_prijs', '-'):>8}  overbied: {v.get('overbied_pct', '-')}%")
        else:
            typer.echo("Geen aangepaste locatiedata. Standaardwaarden worden gebruikt.")
        return

    if not stad:
        typer.echo("Geef --stad op of gebruik --toon.")
        return

    updates = {}
    if m2_prijs > 0:
        updates["m2_prijs"] = m2_prijs
    if overbied > 0:
        updates["overbied_pct"] = overbied

    if updates:
        loc.update_locatie(stad, **{
            k: v for k, v in [("m2_prijs", m2_prijs if m2_prijs > 0 else None),
                               ("overbied_pct", overbied if overbied > 0 else None)]
        })
        typer.echo(f"Locatiedata voor '{stad}' bijgewerkt.")
    else:
        typer.echo(f"  {stad}: m2-prijs = \u20ac {loc.get_m2_prijs(stad):,.0f}  |  overbied = {loc.get_overbied_pct(stad):.1f}%")


# --- Export ---


@app.command()
def exporteer(
    format: str = typer.Option("csv", help="Format: csv of json"),
    output: str = typer.Option("woningen_export", help="Output bestandsnaam (zonder extensie)"),
):
    """Exporteer alle woningen naar CSV of JSON."""
    woningen = opslag.alle_woningen()
    if not woningen:
        typer.echo("Geen woningen om te exporteren.")
        return

    pad = Path(output)
    if format == "csv":
        pad = pad.with_suffix(".csv")
        exporteer_csv(woningen, pad)
    elif format == "json":
        pad = pad.with_suffix(".json")
        exporteer_json(woningen, pad)
    else:
        typer.echo(f"Onbekend format: {format}")
        raise typer.Exit(1)

    typer.echo(f"{len(woningen)} woningen ge\u00ebxporteerd naar {pad}")


def main():
    app()


if __name__ == "__main__":
    main()
