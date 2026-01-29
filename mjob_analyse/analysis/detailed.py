"""Gedetailleerde ingreep-analyse module voor specifieke vergelijking per ingreeptype."""

from typing import Optional
from dataclasses import dataclass

import pandas as pd
import numpy as np

from ..config.settings import Config
from ..benchmarks.data import BenchmarkData
from ..utils.logging import get_logger

logger = get_logger("analysis.detailed")


@dataclass
class IngreepDetail:
    """Details van een specifieke ingreep in één systeem."""

    ingreep_type: str
    bouwdeel: Optional[str]
    activiteit: Optional[str]
    aantal_regels: int
    totaal_hoeveelheid: float
    eenheid: Optional[str]
    gem_eenheidsprijs: Optional[float]
    min_eenheidsprijs: Optional[float]
    max_eenheidsprijs: Optional[float]
    gem_cyclus: Optional[float]
    min_cyclus: Optional[int]
    max_cyclus: Optional[int]
    totaal_kosten: float
    kosten_per_jaar: float


@dataclass
class IngreepVergelijking:
    """Vergelijking van een ingreep tussen twee systemen."""

    ingreep_type: str
    bouwdeel: Optional[str]
    activiteit: Optional[str]
    detail_a: Optional[IngreepDetail]
    detail_b: Optional[IngreepDetail]
    prijs_verschil_pct: Optional[float]
    cyclus_verschil: Optional[float]
    hoeveelheid_verschil_pct: Optional[float]
    kosten_verschil: float
    benchmark_prijs: Optional[float]
    benchmark_cyclus: Optional[int]
    aanwezig_in_beide: bool


class GedetailleerdeAnalyse:
    """
    Voert gedetailleerde analyse uit per ingreeptype.

    Vergelijkt specifieke ingrepen (bijv. "dakpannen vervangen") tussen systemen
    met volledige breakdown van prijzen, cycli, hoeveelheden en kosten.
    """

    def __init__(self, config: Config, benchmark: Optional[BenchmarkData] = None):
        """
        Initialiseer de gedetailleerde analyse.

        Args:
            config: Configuratie
            benchmark: Optionele benchmark data
        """
        self.config = config
        self.benchmark = benchmark or BenchmarkData()
        self.horizon = config.analyse.horizon_jaren

    def analyze(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
    ) -> dict:
        """
        Voer gedetailleerde analyse uit per ingreeptype.

        Args:
            df_a: Dataset A (volledig)
            df_b: Dataset B (volledig)
            name_a: Naam systeem A
            name_b: Naam systeem B

        Returns:
            Dictionary met analyseresultaten
        """
        logger.info("Start gedetailleerde ingreep-analyse")

        # Normaliseer ingreep types
        df_a = self._add_ingreep_type(df_a)
        df_b = self._add_ingreep_type(df_b)

        # Aggregeer per ingreep type
        summary_a = self._aggregate_per_ingreep(df_a, name_a)
        summary_b = self._aggregate_per_ingreep(df_b, name_b)

        # Maak vergelijkingen
        vergelijkingen = self._create_comparisons(summary_a, summary_b, name_a, name_b)

        # Sorteer op grootste kostenverschil
        vergelijkingen.sort(key=lambda x: abs(x.kosten_verschil), reverse=True)

        # Maak resultaat DataFrames
        detail_df = self._create_detail_dataframe(vergelijkingen, name_a, name_b)
        per_bouwdeel_df = self._create_bouwdeel_summary(vergelijkingen, name_a, name_b)

        # Bereken totalen
        totaal_a = sum(v.detail_a.totaal_kosten for v in vergelijkingen if v.detail_a)
        totaal_b = sum(v.detail_b.totaal_kosten for v in vergelijkingen if v.detail_b)

        result = {
            "vergelijkingen": vergelijkingen,
            "detail_dataframe": detail_df,
            "per_bouwdeel": per_bouwdeel_df,
            "statistieken": {
                "aantal_unieke_ingrepen_a": len(summary_a),
                "aantal_unieke_ingrepen_b": len(summary_b),
                "aantal_in_beide": sum(1 for v in vergelijkingen if v.aanwezig_in_beide),
                "aantal_alleen_in_a": sum(1 for v in vergelijkingen if v.detail_a and not v.detail_b),
                "aantal_alleen_in_b": sum(1 for v in vergelijkingen if v.detail_b and not v.detail_a),
                "totaal_kosten_a": totaal_a,
                "totaal_kosten_b": totaal_b,
                "verschil_totaal": totaal_a - totaal_b,
            },
            "top_kostenverschillen": self._get_top_differences(vergelijkingen, "kosten", 10),
            "top_prijsverschillen": self._get_top_differences(vergelijkingen, "prijs", 10),
            "top_cyclusverschillen": self._get_top_differences(vergelijkingen, "cyclus", 10),
            "samenvatting": self._generate_summary(vergelijkingen, name_a, name_b),
        }

        logger.info(f"Gedetailleerde analyse: {len(vergelijkingen)} unieke ingreeptypes")

        return result

    def _add_ingreep_type(self, df: pd.DataFrame) -> pd.DataFrame:
        """Voeg genormaliseerd ingreep type toe aan DataFrame."""
        df = df.copy()

        def get_ingreep_type(row):
            parts = []

            # Bouwdeel
            bouwdeel = row.get("Bouwdeel")
            if pd.notna(bouwdeel):
                parts.append(str(bouwdeel))

            # Element
            element = row.get("Element Omschrijving")
            if pd.notna(element):
                parts.append(str(element).strip())

            # Activiteit
            activiteit = row.get("Activiteitstype")
            if pd.notna(activiteit):
                parts.append(str(activiteit))

            # Maatregel als fallback
            if not parts:
                maatregel = row.get("Maatregel")
                if pd.notna(maatregel):
                    return str(maatregel).strip().lower()

            return " - ".join(parts).lower() if parts else "onbekend"

        df["Ingreep_Type"] = df.apply(get_ingreep_type, axis=1)

        return df

    def _aggregate_per_ingreep(
        self, df: pd.DataFrame, name: str
    ) -> dict[str, IngreepDetail]:
        """Aggregeer data per ingreep type."""
        result = {}

        if df.empty:
            return result

        for ingreep_type in df["Ingreep_Type"].unique():
            subset = df[df["Ingreep_Type"] == ingreep_type]

            # Hoeveelheid
            hoeveelheid = subset["Hoeveelheid"].sum() if "Hoeveelheid" in subset else 0

            # Eenheid (neem meest voorkomende)
            eenheid = None
            if "Eenheid" in subset:
                eenheid_counts = subset["Eenheid"].value_counts()
                if not eenheid_counts.empty:
                    eenheid = eenheid_counts.index[0]

            # Prijzen
            gem_prijs = min_prijs = max_prijs = None
            if "Eenheidsprijs" in subset:
                prijzen = subset["Eenheidsprijs"].dropna()
                if not prijzen.empty:
                    gem_prijs = prijzen.mean()
                    min_prijs = prijzen.min()
                    max_prijs = prijzen.max()

            # Cycli
            gem_cyclus = min_cyclus = max_cyclus = None
            if "Cyclus" in subset:
                cycli = subset["Cyclus"].dropna()
                if not cycli.empty:
                    gem_cyclus = cycli.mean()
                    min_cyclus = int(cycli.min())
                    max_cyclus = int(cycli.max())

            # Totaal kosten
            totaal_kosten = 0
            if "Totaalkosten" in subset:
                totaal_kosten = subset["Totaalkosten"].sum()
            elif "Hoeveelheid" in subset and "Eenheidsprijs" in subset:
                totaal_kosten = (subset["Hoeveelheid"] * subset["Eenheidsprijs"]).sum()

            # Kosten over horizon
            kosten_horizon = totaal_kosten
            if gem_cyclus and gem_cyclus > 0:
                uitvoeringen = max(1, int(self.horizon / gem_cyclus))
                kosten_horizon = totaal_kosten * uitvoeringen

            # Bouwdeel en activiteit
            bouwdeel = subset["Bouwdeel"].mode().iloc[0] if "Bouwdeel" in subset and not subset["Bouwdeel"].mode().empty else None
            activiteit = subset["Activiteitstype"].mode().iloc[0] if "Activiteitstype" in subset and not subset["Activiteitstype"].mode().empty else None

            result[ingreep_type] = IngreepDetail(
                ingreep_type=ingreep_type,
                bouwdeel=bouwdeel,
                activiteit=activiteit,
                aantal_regels=len(subset),
                totaal_hoeveelheid=float(hoeveelheid),
                eenheid=eenheid,
                gem_eenheidsprijs=gem_prijs,
                min_eenheidsprijs=min_prijs,
                max_eenheidsprijs=max_prijs,
                gem_cyclus=gem_cyclus,
                min_cyclus=min_cyclus,
                max_cyclus=max_cyclus,
                totaal_kosten=float(kosten_horizon),
                kosten_per_jaar=float(kosten_horizon / self.horizon) if self.horizon > 0 else 0,
            )

        return result

    def _create_comparisons(
        self,
        summary_a: dict[str, IngreepDetail],
        summary_b: dict[str, IngreepDetail],
        name_a: str,
        name_b: str,
    ) -> list[IngreepVergelijking]:
        """Maak vergelijkingen tussen beide systemen."""
        all_types = set(summary_a.keys()) | set(summary_b.keys())
        comparisons = []

        for ingreep_type in all_types:
            detail_a = summary_a.get(ingreep_type)
            detail_b = summary_b.get(ingreep_type)

            # Bereken verschillen
            prijs_verschil = None
            if detail_a and detail_b and detail_a.gem_eenheidsprijs and detail_b.gem_eenheidsprijs:
                if detail_b.gem_eenheidsprijs > 0:
                    prijs_verschil = ((detail_a.gem_eenheidsprijs - detail_b.gem_eenheidsprijs)
                                      / detail_b.gem_eenheidsprijs * 100)

            cyclus_verschil = None
            if detail_a and detail_b and detail_a.gem_cyclus and detail_b.gem_cyclus:
                cyclus_verschil = detail_a.gem_cyclus - detail_b.gem_cyclus

            hoeveelheid_verschil = None
            if detail_a and detail_b and detail_a.totaal_hoeveelheid and detail_b.totaal_hoeveelheid:
                if detail_b.totaal_hoeveelheid > 0:
                    hoeveelheid_verschil = ((detail_a.totaal_hoeveelheid - detail_b.totaal_hoeveelheid)
                                            / detail_b.totaal_hoeveelheid * 100)

            kosten_a = detail_a.totaal_kosten if detail_a else 0
            kosten_b = detail_b.totaal_kosten if detail_b else 0

            # Benchmark lookup
            benchmark_prijs = None
            benchmark_cyclus = None
            search_text = ingreep_type
            if detail_a:
                bm = self.benchmark.find_matching_benchmark(
                    detail_a.ingreep_type,
                    detail_a.bouwdeel
                )
                benchmark_prijs = bm.get("prijs")
                benchmark_cyclus = bm.get("cyclus")

            comparisons.append(IngreepVergelijking(
                ingreep_type=ingreep_type,
                bouwdeel=detail_a.bouwdeel if detail_a else (detail_b.bouwdeel if detail_b else None),
                activiteit=detail_a.activiteit if detail_a else (detail_b.activiteit if detail_b else None),
                detail_a=detail_a,
                detail_b=detail_b,
                prijs_verschil_pct=prijs_verschil,
                cyclus_verschil=cyclus_verschil,
                hoeveelheid_verschil_pct=hoeveelheid_verschil,
                kosten_verschil=kosten_a - kosten_b,
                benchmark_prijs=benchmark_prijs,
                benchmark_cyclus=benchmark_cyclus,
                aanwezig_in_beide=detail_a is not None and detail_b is not None,
            ))

        return comparisons

    def _create_detail_dataframe(
        self,
        vergelijkingen: list[IngreepVergelijking],
        name_a: str,
        name_b: str,
    ) -> pd.DataFrame:
        """Maak een gedetailleerd DataFrame met alle vergelijkingen."""
        records = []

        for v in vergelijkingen:
            record = {
                "Ingreep Type": v.ingreep_type,
                "Bouwdeel": v.bouwdeel,
                "Activiteit": v.activiteit,
                "Aanwezig in beide": "Ja" if v.aanwezig_in_beide else "Nee",
            }

            # Systeem A details
            if v.detail_a:
                record[f"Hoeveelheid {name_a}"] = v.detail_a.totaal_hoeveelheid
                record[f"Eenheid {name_a}"] = v.detail_a.eenheid
                record[f"Gem. Prijs {name_a}"] = v.detail_a.gem_eenheidsprijs
                record[f"Gem. Cyclus {name_a}"] = v.detail_a.gem_cyclus
                record[f"Totaal Kosten {name_a}"] = v.detail_a.totaal_kosten
                record[f"Kosten/jaar {name_a}"] = v.detail_a.kosten_per_jaar
            else:
                record[f"Hoeveelheid {name_a}"] = None
                record[f"Eenheid {name_a}"] = None
                record[f"Gem. Prijs {name_a}"] = None
                record[f"Gem. Cyclus {name_a}"] = None
                record[f"Totaal Kosten {name_a}"] = 0
                record[f"Kosten/jaar {name_a}"] = 0

            # Systeem B details
            if v.detail_b:
                record[f"Hoeveelheid {name_b}"] = v.detail_b.totaal_hoeveelheid
                record[f"Eenheid {name_b}"] = v.detail_b.eenheid
                record[f"Gem. Prijs {name_b}"] = v.detail_b.gem_eenheidsprijs
                record[f"Gem. Cyclus {name_b}"] = v.detail_b.gem_cyclus
                record[f"Totaal Kosten {name_b}"] = v.detail_b.totaal_kosten
                record[f"Kosten/jaar {name_b}"] = v.detail_b.kosten_per_jaar
            else:
                record[f"Hoeveelheid {name_b}"] = None
                record[f"Eenheid {name_b}"] = None
                record[f"Gem. Prijs {name_b}"] = None
                record[f"Gem. Cyclus {name_b}"] = None
                record[f"Totaal Kosten {name_b}"] = 0
                record[f"Kosten/jaar {name_b}"] = 0

            # Verschillen
            record["Prijs Verschil %"] = v.prijs_verschil_pct
            record["Cyclus Verschil (jaar)"] = v.cyclus_verschil
            record["Hoeveelheid Verschil %"] = v.hoeveelheid_verschil_pct
            record["Kosten Verschil"] = v.kosten_verschil

            # Benchmark
            record["Benchmark Prijs"] = v.benchmark_prijs
            record["Benchmark Cyclus"] = v.benchmark_cyclus

            records.append(record)

        return pd.DataFrame(records)

    def _create_bouwdeel_summary(
        self,
        vergelijkingen: list[IngreepVergelijking],
        name_a: str,
        name_b: str,
    ) -> pd.DataFrame:
        """Maak samenvatting per bouwdeel."""
        bouwdeel_data: dict[str, dict] = {}

        for v in vergelijkingen:
            bd = v.bouwdeel or "Niet geclassificeerd"

            if bd not in bouwdeel_data:
                bouwdeel_data[bd] = {
                    "Bouwdeel": bd,
                    "Aantal Ingrepen": 0,
                    f"Kosten {name_a}": 0,
                    f"Kosten {name_b}": 0,
                    "Kosten Verschil": 0,
                }

            bouwdeel_data[bd]["Aantal Ingrepen"] += 1
            if v.detail_a:
                bouwdeel_data[bd][f"Kosten {name_a}"] += v.detail_a.totaal_kosten
            if v.detail_b:
                bouwdeel_data[bd][f"Kosten {name_b}"] += v.detail_b.totaal_kosten

        # Bereken verschil
        for bd_data in bouwdeel_data.values():
            bd_data["Kosten Verschil"] = bd_data[f"Kosten {name_a}"] - bd_data[f"Kosten {name_b}"]
            bd_data["Verschil %"] = (
                bd_data["Kosten Verschil"] / bd_data[f"Kosten {name_b}"] * 100
                if bd_data[f"Kosten {name_b}"] > 0 else 0
            )

        df = pd.DataFrame(list(bouwdeel_data.values()))
        return df.sort_values(f"Kosten {name_a}", ascending=False)

    def _get_top_differences(
        self,
        vergelijkingen: list[IngreepVergelijking],
        diff_type: str,
        n: int = 10,
    ) -> list[dict]:
        """Haal top N verschillen op."""
        filtered = [v for v in vergelijkingen if v.aanwezig_in_beide]

        if diff_type == "kosten":
            filtered.sort(key=lambda x: abs(x.kosten_verschil), reverse=True)
            return [
                {
                    "ingreep": v.ingreep_type,
                    "bouwdeel": v.bouwdeel,
                    "kosten_a": v.detail_a.totaal_kosten if v.detail_a else 0,
                    "kosten_b": v.detail_b.totaal_kosten if v.detail_b else 0,
                    "verschil": v.kosten_verschil,
                }
                for v in filtered[:n]
            ]

        elif diff_type == "prijs":
            filtered = [v for v in filtered if v.prijs_verschil_pct is not None]
            filtered.sort(key=lambda x: abs(x.prijs_verschil_pct or 0), reverse=True)
            return [
                {
                    "ingreep": v.ingreep_type,
                    "bouwdeel": v.bouwdeel,
                    "prijs_a": v.detail_a.gem_eenheidsprijs if v.detail_a else None,
                    "prijs_b": v.detail_b.gem_eenheidsprijs if v.detail_b else None,
                    "verschil_pct": v.prijs_verschil_pct,
                    "benchmark": v.benchmark_prijs,
                }
                for v in filtered[:n]
            ]

        elif diff_type == "cyclus":
            filtered = [v for v in filtered if v.cyclus_verschil is not None]
            filtered.sort(key=lambda x: abs(x.cyclus_verschil or 0), reverse=True)
            return [
                {
                    "ingreep": v.ingreep_type,
                    "bouwdeel": v.bouwdeel,
                    "cyclus_a": v.detail_a.gem_cyclus if v.detail_a else None,
                    "cyclus_b": v.detail_b.gem_cyclus if v.detail_b else None,
                    "verschil": v.cyclus_verschil,
                    "benchmark": v.benchmark_cyclus,
                }
                for v in filtered[:n]
            ]

        return []

    def _generate_summary(
        self,
        vergelijkingen: list[IngreepVergelijking],
        name_a: str,
        name_b: str,
    ) -> str:
        """Genereer tekstuele samenvatting."""
        in_beide = [v for v in vergelijkingen if v.aanwezig_in_beide]
        alleen_a = [v for v in vergelijkingen if v.detail_a and not v.detail_b]
        alleen_b = [v for v in vergelijkingen if v.detail_b and not v.detail_a]

        totaal_a = sum(v.detail_a.totaal_kosten for v in vergelijkingen if v.detail_a)
        totaal_b = sum(v.detail_b.totaal_kosten for v in vergelijkingen if v.detail_b)

        lines = [
            "Gedetailleerde Ingreep-Analyse",
            "=" * 50,
            f"",
            f"Unieke ingrepen in {name_a}: {len([v for v in vergelijkingen if v.detail_a])}",
            f"Unieke ingrepen in {name_b}: {len([v for v in vergelijkingen if v.detail_b])}",
            f"Ingrepen in beide systemen: {len(in_beide)}",
            f"Alleen in {name_a}: {len(alleen_a)}",
            f"Alleen in {name_b}: {len(alleen_b)}",
            f"",
            f"Totale kosten {name_a} (over {self.horizon} jaar): €{totaal_a:,.0f}",
            f"Totale kosten {name_b} (over {self.horizon} jaar): €{totaal_b:,.0f}",
            f"Verschil: €{totaal_a - totaal_b:,.0f}",
            f"",
        ]

        # Top 5 grootste kostenverschillen
        if in_beide:
            top_kosten = sorted(in_beide, key=lambda x: abs(x.kosten_verschil), reverse=True)[:5]
            lines.append("Top 5 grootste kostenverschillen:")
            for v in top_kosten:
                lines.append(
                    f"  • {v.ingreep_type}: €{v.kosten_verschil:+,.0f}"
                )

        return "\n".join(lines)
