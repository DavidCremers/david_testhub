"""CLI interface voor MJOB Analyse tool."""

from pathlib import Path
from typing import Optional
from enum import Enum

import typer

from . import __version__
from .config.settings import load_config, Config
from .data.loader import DataLoader
from .data.mapper import ColumnMapper
from .data.normalizer import DataNormalizer
from .matching.classifier import IngreepClassifier
from .matching.matcher import IngreepMatcher
from .analysis.price import PrijsAnalyse
from .analysis.cycle import CyclusAnalyse
from .analysis.completeness import CompleetheidsAnalyse
from .analysis.quantity import HoeveelhedenAnalyse
from .analysis.financial import FinancieleAnalyse
from .output.terminal import TerminalOutput
from .output.excel import ExcelExport
from .output.html import HtmlRapport
from .benchmarks.data import BenchmarkData
from .utils.logging import setup_logging, get_logger

app = typer.Typer(
    name="mjob_analyse",
    help="CLI tool voor het vergelijken van onderhoudsdata tussen MJOB/MJOP systemen.",
    add_completion=False,
)

logger = get_logger("cli")


class AnalyseType(str, Enum):
    """Beschikbare analyse types."""

    alle = "alle"
    prijzen = "prijzen"
    cycli = "cycli"
    compleetheid = "compleetheid"
    hoeveelheden = "hoeveelheden"
    financieel = "financieel"


@app.command()
def vergelijk(
    bestand_a: Path = typer.Argument(
        ...,
        help="Pad naar eerste export bestand (Excel/CSV)",
        exists=True,
        readable=True,
    ),
    bestand_b: Path = typer.Argument(
        ...,
        help="Pad naar tweede export bestand (Excel/CSV)",
        exists=True,
        readable=True,
    ),
    config: Optional[Path] = typer.Option(
        None,
        "--config",
        "-c",
        help="Pad naar configuratie bestand (YAML)",
        exists=True,
        readable=True,
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Pad voor Excel output bestand",
    ),
    html_output: Optional[Path] = typer.Option(
        None,
        "--html",
        help="Pad voor HTML rapport",
    ),
    analyse: AnalyseType = typer.Option(
        AnalyseType.alle,
        "--analyse",
        "-a",
        help="Type analyse om uit te voeren",
    ),
    naam_a: str = typer.Option(
        "Systeem A",
        "--naam-a",
        help="Naam voor eerste systeem",
    ),
    naam_b: str = typer.Option(
        "Systeem B",
        "--naam-b",
        help="Naam voor tweede systeem",
    ),
    systeem_a: Optional[str] = typer.Option(
        None,
        "--systeem-a",
        help="Type van systeem A (vastware/plato/oprognose/ibis)",
    ),
    systeem_b: Optional[str] = typer.Option(
        None,
        "--systeem-b",
        help="Type van systeem B (vastware/plato/oprognose/ibis)",
    ),
    sheet_a: Optional[str] = typer.Option(
        None,
        "--sheet-a",
        help="Sheet naam in Excel bestand A",
    ),
    sheet_b: Optional[str] = typer.Option(
        None,
        "--sheet-b",
        help="Sheet naam in Excel bestand B",
    ),
    horizon: int = typer.Option(
        60,
        "--horizon",
        help="Analyse horizon in jaren",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Uitgebreide output",
    ),
    log_file: Optional[Path] = typer.Option(
        None,
        "--log",
        help="Pad naar logbestand",
    ),
) -> None:
    """
    Vergelijk onderhoudsdata tussen twee MJOB/MJOP systemen.

    Voert een uitgebreide vergelijking uit op prijs, cyclus, compleetheid,
    hoeveelheden en financiële aspecten.
    """
    # Setup logging
    setup_logging(
        level="DEBUG" if verbose else "INFO",
        log_file=log_file,
        verbose=verbose,
    )

    terminal = TerminalOutput(use_colors=True)
    terminal.print_header("MJOB Analyse Tool")
    terminal.print_info(f"Versie: {__version__}")

    try:
        # Laad configuratie
        cfg = load_config(config)
        if horizon != 60:
            cfg.analyse.horizon_jaren = horizon

        terminal.print_info(f"Horizon: {cfg.analyse.horizon_jaren} jaar")
        terminal.print_info(f"Bestand A: {bestand_a}")
        terminal.print_info(f"Bestand B: {bestand_b}")

        # Laad data
        loader = DataLoader()

        terminal.print_subheader("Data laden")
        df_a = loader.load(bestand_a, sheet_name=sheet_a)
        terminal.print_success(f"{naam_a}: {len(df_a)} rijen geladen")

        df_b = loader.load(bestand_b, sheet_name=sheet_b)
        terminal.print_success(f"{naam_b}: {len(df_b)} rijen geladen")

        # Detecteer systeem types
        if not systeem_a:
            systeem_a = loader.detect_system_type(df_a)
            if systeem_a:
                terminal.print_info(f"Gedetecteerd systeem A: {systeem_a}")

        if not systeem_b:
            systeem_b = loader.detect_system_type(df_b)
            if systeem_b:
                terminal.print_info(f"Gedetecteerd systeem B: {systeem_b}")

        # Map kolommen
        mapper = ColumnMapper(cfg)
        df_a = mapper.map_columns(df_a, systeem_a)
        df_b = mapper.map_columns(df_b, systeem_b)

        # Normaliseer data
        normalizer = DataNormalizer()
        df_a = normalizer.normalize(df_a)
        df_b = normalizer.normalize(df_b)

        terminal.print_subheader("Classificatie")

        # Classificeer ingrepen
        classifier = IngreepClassifier(cfg)
        df_a = classifier.classify(df_a)
        df_b = classifier.classify(df_b)

        stats_a = classifier.get_classification_stats(df_a)
        stats_b = classifier.get_classification_stats(df_b)
        terminal.print_success(
            f"{naam_a}: {len(stats_a.get('bouwdeel_verdeling', {}))} bouwdelen"
        )
        terminal.print_success(
            f"{naam_b}: {len(stats_b.get('bouwdeel_verdeling', {}))} bouwdelen"
        )

        # Match ingrepen
        terminal.print_subheader("Matching")
        matcher = IngreepMatcher(cfg)
        matches_df, unmatched_a, unmatched_b = matcher.match_datasets(
            df_a, df_b, naam_a, naam_b
        )

        match_quality = matcher.calculate_match_quality(matches_df)
        terminal.print_success(
            f"Matches: {match_quality['totaal_matches']} "
            f"(confidence: {match_quality['gemiddelde_confidence']:.0%})"
        )
        terminal.print_key_value("Exacte matches", match_quality["exact_matches"])
        terminal.print_key_value("Fuzzy matches", match_quality["fuzzy_matches"])
        terminal.print_key_value(
            "Classificatie matches", match_quality["classification_matches"]
        )

        # Voer analyses uit
        results = {
            "matches": matches_df,
            "match_quality": match_quality,
        }

        benchmark = BenchmarkData()

        if analyse in [AnalyseType.alle, AnalyseType.prijzen]:
            terminal.print_subheader("Prijsanalyse")
            prijs_analyse = PrijsAnalyse(cfg)
            results["prijs"] = prijs_analyse.analyze(
                matches_df, naam_a, naam_b, benchmark.get_all_prijzen()
            )
            terminal.print_info(results["prijs"]["samenvatting"])

        if analyse in [AnalyseType.alle, AnalyseType.cycli]:
            terminal.print_subheader("Cyclusanalyse")
            cyclus_analyse = CyclusAnalyse(cfg)
            results["cyclus"] = cyclus_analyse.analyze(
                matches_df, naam_a, naam_b, benchmark.get_all_cycli()
            )
            terminal.print_info(results["cyclus"]["samenvatting"])

        if analyse in [AnalyseType.alle, AnalyseType.compleetheid]:
            terminal.print_subheader("Completheidsanalyse")
            compl_analyse = CompleetheidsAnalyse(cfg)
            results["compleetheid"] = compl_analyse.analyze(
                df_a, df_b, unmatched_a, unmatched_b, naam_a, naam_b
            )
            terminal.print_info(results["compleetheid"]["samenvatting"])

        if analyse in [AnalyseType.alle, AnalyseType.hoeveelheden]:
            terminal.print_subheader("Hoeveelhedenanalyse")
            hv_analyse = HoeveelhedenAnalyse(cfg)
            results["hoeveelheden"] = hv_analyse.analyze(
                matches_df, naam_a, naam_b
            )
            terminal.print_info(results["hoeveelheden"]["samenvatting"])

        if analyse in [AnalyseType.alle, AnalyseType.financieel]:
            terminal.print_subheader("Financiële analyse")
            fin_analyse = FinancieleAnalyse(cfg)
            results["financieel"] = fin_analyse.analyze(
                df_a, df_b, matches_df, naam_a, naam_b
            )
            terminal.print_info(results["financieel"]["samenvatting"])

        # Toon samenvatting
        terminal.print_summary(results)

        # Excel export
        if output:
            terminal.print_subheader("Export")
            excel_export = ExcelExport(cfg)
            output_path = excel_export.export(results, output, naam_a, naam_b)
            terminal.print_success(f"Excel rapport: {output_path}")

        # HTML export
        if html_output:
            html_rapport = HtmlRapport(cfg)
            html_path = html_rapport.generate(
                results, html_output, naam_a, naam_b
            )
            terminal.print_success(f"HTML rapport: {html_path}")

        # Default output als geen pad opgegeven
        if not output and not html_output:
            default_output = Path(f"analyse_{bestand_a.stem}_vs_{bestand_b.stem}.xlsx")
            excel_export = ExcelExport(cfg)
            excel_export.export(results, default_output, naam_a, naam_b)
            terminal.print_success(f"Excel rapport: {default_output}")

    except FileNotFoundError as e:
        terminal.print_error(f"Bestand niet gevonden: {e}")
        raise typer.Exit(1)
    except ValueError as e:
        terminal.print_error(f"Data fout: {e}")
        raise typer.Exit(1)
    except Exception as e:
        terminal.print_error(f"Onverwachte fout: {e}")
        if verbose:
            import traceback
            traceback.print_exc()
        raise typer.Exit(1)


@app.command()
def preview(
    bestand: Path = typer.Argument(
        ...,
        help="Pad naar export bestand om te previeuwen",
        exists=True,
        readable=True,
    ),
    sheet: Optional[str] = typer.Option(
        None,
        "--sheet",
        "-s",
        help="Specifieke sheet om te tonen",
    ),
    rijen: int = typer.Option(
        10,
        "--rijen",
        "-n",
        help="Aantal rijen om te tonen",
    ),
) -> None:
    """
    Bekijk een preview van een export bestand.

    Handig om de structuur en kolomnamen te inspecteren.
    """
    setup_logging(level="WARNING")
    terminal = TerminalOutput()

    try:
        loader = DataLoader()

        # Toon beschikbare sheets
        if bestand.suffix.lower() in [".xlsx", ".xls"]:
            sheets = loader.get_sheet_names(bestand)
            terminal.print_info(f"Beschikbare sheets: {', '.join(sheets)}")

        # Laad data
        df = loader.load(bestand, sheet_name=sheet)

        # Detecteer systeem type
        systeem = loader.detect_system_type(df)
        if systeem:
            terminal.print_info(f"Gedetecteerd systeem: {systeem}")

        # Toon preview
        print(f"\nKolommen ({len(df.columns)}):")
        for i, col in enumerate(df.columns):
            dtype = df[col].dtype
            non_null = df[col].notna().sum()
            print(f"  {i+1:3}. {col} ({dtype}, {non_null} waarden)")

        print(f"\nEerste {rijen} rijen:")
        print(df.head(rijen).to_string())

        print(f"\nTotaal: {len(df)} rijen")

    except Exception as e:
        terminal.print_error(str(e))
        raise typer.Exit(1)


@app.command()
def benchmark(
    categorie: Optional[str] = typer.Option(
        None,
        "--categorie",
        "-c",
        help="Toon alleen specifieke categorie",
    ),
    prijzen: bool = typer.Option(
        False,
        "--prijzen",
        "-p",
        help="Toon benchmark prijzen",
    ),
    cycli: bool = typer.Option(
        False,
        "--cycli",
        "-y",
        help="Toon benchmark cycli",
    ),
) -> None:
    """
    Toon beschikbare benchmark data.

    Toont gangbare prijzen en cycli voor woningonderhoud.
    """
    terminal = TerminalOutput()
    bm = BenchmarkData()

    # Standaard: toon beide
    if not prijzen and not cycli:
        prijzen = True
        cycli = True

    if prijzen:
        terminal.print_subheader("Benchmark Prijzen")
        all_prijzen = bm.get_all_prijzen()

        for key, data in sorted(all_prijzen.items()):
            print(f"  {key}: €{data['prijs']:,.2f} per {data['eenheid']}")

    if cycli:
        terminal.print_subheader("Benchmark Cycli")
        all_cycli = bm.get_all_cycli()

        for key, cyclus in sorted(all_cycli.items()):
            print(f"  {key}: {cyclus} jaar")

    # Gemiddelden per categorie
    terminal.print_subheader("Gemiddelden per Categorie")
    averages = bm.get_category_averages()
    for cat, data in averages.items():
        if data["gem_prijs"]:
            print(
                f"  {cat}: gem. prijs €{data['gem_prijs']:,.0f}, "
                f"gem. cyclus {data['gem_cyclus']:.0f} jaar"
            )


@app.command()
def versie() -> None:
    """Toon versie informatie."""
    print(f"MJOB Analyse Tool versie {__version__}")


def main() -> None:
    """Entry point voor de CLI."""
    app()


if __name__ == "__main__":
    main()
