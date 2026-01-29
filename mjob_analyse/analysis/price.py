"""Prijsanalyse module voor vergelijking van eenheidsprijzen."""

from dataclasses import dataclass
from typing import Optional

import pandas as pd
import numpy as np

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("analysis.price")


@dataclass
class PrijsAfwijking:
    """Representeert een prijsafwijking."""

    maatregel: str
    bouwdeel: Optional[str]
    prijs_a: float
    prijs_b: float
    verschil_absoluut: float
    verschil_percentage: float
    benchmark_prijs: Optional[float]
    is_uitschieter: bool


class PrijsAnalyse:
    """
    Analyseert prijsverschillen tussen twee datasets.

    Vergelijkt eenheidsprijzen, identificeert uitschieters en vergelijkt met benchmarks.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de prijsanalyse.

        Args:
            config: Configuratie met drempelwaarden
        """
        self.config = config
        self.drempel_percentage = config.drempels.prijs_afwijking_percentage

    def analyze(
        self,
        match_df: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
        benchmark_data: Optional[dict] = None,
    ) -> dict:
        """
        Voer prijsanalyse uit op gematchte ingrepen.

        Args:
            match_df: DataFrame met gematchte ingrepen
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem
            benchmark_data: Optionele benchmark prijzen

        Returns:
            Dictionary met analyseresultaten
        """
        logger.info("Start prijsanalyse")

        prijs_col_a = f"Eenheidsprijs_{name_a}"
        prijs_col_b = f"Eenheidsprijs_{name_b}"

        # Filter rijen met geldige prijzen
        valid_mask = match_df[prijs_col_a].notna() & match_df[prijs_col_b].notna()
        df_valid = match_df[valid_mask].copy()

        if df_valid.empty:
            logger.warning("Geen geldige prijsparen gevonden voor analyse")
            return self._empty_result()

        # Bereken prijsverschillen
        df_valid["Prijs_Verschil_Absoluut"] = (
            df_valid[prijs_col_a] - df_valid[prijs_col_b]
        )
        df_valid["Prijs_Verschil_Percentage"] = (
            df_valid["Prijs_Verschil_Absoluut"]
            / df_valid[prijs_col_b].replace(0, np.nan)
            * 100
        )

        # Identificeer uitschieters
        df_valid["Is_Prijs_Uitschieter"] = (
            df_valid["Prijs_Verschil_Percentage"].abs() > self.drempel_percentage
        )

        # Statistieken
        stats = self._calculate_statistics(df_valid, prijs_col_a, prijs_col_b)

        # Top afwijkingen
        top_afwijkingen = self._get_top_afwijkingen(
            df_valid, name_a, name_b, n=10
        )

        # Per bouwdeel analyse
        bouwdeel_analyse = self._analyze_per_bouwdeel(
            df_valid, prijs_col_a, prijs_col_b
        )

        # Benchmark vergelijking
        benchmark_vergelijking = None
        if benchmark_data:
            benchmark_vergelijking = self._compare_with_benchmark(
                df_valid, name_a, name_b, benchmark_data
            )

        result = {
            "statistieken": stats,
            "top_afwijkingen": top_afwijkingen,
            "per_bouwdeel": bouwdeel_analyse,
            "benchmark_vergelijking": benchmark_vergelijking,
            "detail_data": df_valid,
            "samenvatting": self._generate_summary(stats, top_afwijkingen),
        }

        logger.info(
            f"Prijsanalyse voltooid: {len(df_valid)} paren, "
            f"{stats['aantal_uitschieters']} uitschieters"
        )

        return result

    def _calculate_statistics(
        self, df: pd.DataFrame, prijs_col_a: str, prijs_col_b: str
    ) -> dict:
        """Bereken statistische metrics."""
        return {
            "aantal_vergelijkingen": len(df),
            "gemiddelde_prijs_a": float(df[prijs_col_a].mean()),
            "gemiddelde_prijs_b": float(df[prijs_col_b].mean()),
            "mediaan_verschil_percentage": float(
                df["Prijs_Verschil_Percentage"].median()
            ),
            "gemiddeld_verschil_percentage": float(
                df["Prijs_Verschil_Percentage"].mean()
            ),
            "std_verschil_percentage": float(df["Prijs_Verschil_Percentage"].std()),
            "min_verschil_percentage": float(df["Prijs_Verschil_Percentage"].min()),
            "max_verschil_percentage": float(df["Prijs_Verschil_Percentage"].max()),
            "aantal_uitschieters": int(df["Is_Prijs_Uitschieter"].sum()),
            "percentage_uitschieters": float(
                df["Is_Prijs_Uitschieter"].mean() * 100
            ),
            "totaal_a_duurder": int((df["Prijs_Verschil_Absoluut"] > 0).sum()),
            "totaal_b_duurder": int((df["Prijs_Verschil_Absoluut"] < 0).sum()),
        }

    def _get_top_afwijkingen(
        self, df: pd.DataFrame, name_a: str, name_b: str, n: int = 10
    ) -> list[dict]:
        """Haal de top N grootste afwijkingen."""
        df_sorted = df.reindex(
            df["Prijs_Verschil_Percentage"].abs().sort_values(ascending=False).index
        )

        top_items = []
        for _, row in df_sorted.head(n).iterrows():
            maatregel_a = row.get(f"Maatregel_{name_a}", "")
            maatregel_b = row.get(f"Maatregel_{name_b}", "")

            top_items.append({
                "maatregel": maatregel_a or maatregel_b,
                "bouwdeel": row.get("Bouwdeel"),
                "prijs_a": float(row[f"Eenheidsprijs_{name_a}"]),
                "prijs_b": float(row[f"Eenheidsprijs_{name_b}"]),
                "verschil_absoluut": float(row["Prijs_Verschil_Absoluut"]),
                "verschil_percentage": float(row["Prijs_Verschil_Percentage"]),
                "match_confidence": float(row.get("Match_Confidence", 0)),
            })

        return top_items

    def _analyze_per_bouwdeel(
        self, df: pd.DataFrame, prijs_col_a: str, prijs_col_b: str
    ) -> dict:
        """Analyseer prijsverschillen per bouwdeel."""
        if "Bouwdeel" not in df.columns:
            return {}

        result = {}
        for bouwdeel in df["Bouwdeel"].dropna().unique():
            bd_df = df[df["Bouwdeel"] == bouwdeel]

            result[bouwdeel] = {
                "aantal_ingrepen": len(bd_df),
                "gemiddelde_prijs_a": float(bd_df[prijs_col_a].mean()),
                "gemiddelde_prijs_b": float(bd_df[prijs_col_b].mean()),
                "gemiddeld_verschil_pct": float(
                    bd_df["Prijs_Verschil_Percentage"].mean()
                ),
                "aantal_uitschieters": int(bd_df["Is_Prijs_Uitschieter"].sum()),
            }

        return result

    def _compare_with_benchmark(
        self,
        df: pd.DataFrame,
        name_a: str,
        name_b: str,
        benchmark_data: dict,
    ) -> list[dict]:
        """Vergelijk prijzen met benchmark waarden."""
        comparisons = []

        for _, row in df.iterrows():
            maatregel = row.get(f"Maatregel_{name_a}") or row.get(f"Maatregel_{name_b}")
            if not maatregel:
                continue

            maatregel_lower = str(maatregel).lower()

            # Zoek matching benchmark
            for bm_key, bm_value in benchmark_data.items():
                if bm_key.lower() in maatregel_lower:
                    prijs_a = row.get(f"Eenheidsprijs_{name_a}")
                    prijs_b = row.get(f"Eenheidsprijs_{name_b}")

                    comparisons.append({
                        "maatregel": maatregel,
                        "benchmark_categorie": bm_key,
                        "benchmark_prijs": bm_value,
                        "prijs_a": prijs_a,
                        "prijs_b": prijs_b,
                        "afwijking_a_pct": (
                            ((prijs_a - bm_value) / bm_value * 100)
                            if pd.notna(prijs_a) and bm_value > 0
                            else None
                        ),
                        "afwijking_b_pct": (
                            ((prijs_b - bm_value) / bm_value * 100)
                            if pd.notna(prijs_b) and bm_value > 0
                            else None
                        ),
                    })
                    break

        return comparisons

    def _generate_summary(self, stats: dict, top_afwijkingen: list) -> str:
        """Genereer tekstuele samenvatting."""
        lines = [
            f"Prijsanalyse Samenvatting",
            f"=" * 40,
            f"Vergeleken: {stats['aantal_vergelijkingen']} ingrepen",
            f"Uitschieters (>{self.drempel_percentage}%): {stats['aantal_uitschieters']} "
            f"({stats['percentage_uitschieters']:.1f}%)",
            f"",
            f"Gemiddeld prijsverschil: {stats['gemiddeld_verschil_percentage']:.1f}%",
            f"Mediaan prijsverschil: {stats['mediaan_verschil_percentage']:.1f}%",
            f"",
        ]

        if top_afwijkingen:
            lines.append("Top 3 grootste afwijkingen:")
            for i, item in enumerate(top_afwijkingen[:3], 1):
                lines.append(
                    f"  {i}. {item['maatregel'][:50]}: "
                    f"{item['verschil_percentage']:+.1f}%"
                )

        return "\n".join(lines)

    def _empty_result(self) -> dict:
        """Retourneer leeg resultaat."""
        return {
            "statistieken": {
                "aantal_vergelijkingen": 0,
                "aantal_uitschieters": 0,
            },
            "top_afwijkingen": [],
            "per_bouwdeel": {},
            "benchmark_vergelijking": None,
            "detail_data": pd.DataFrame(),
            "samenvatting": "Geen prijsdata beschikbaar voor analyse.",
        }

    def get_outliers(
        self, match_df: pd.DataFrame, name_a: str, name_b: str
    ) -> pd.DataFrame:
        """
        Haal alleen de uitschieters op.

        Args:
            match_df: DataFrame met matches en prijsverschillen
            name_a: Naam systeem A
            name_b: Naam systeem B

        Returns:
            DataFrame met alleen uitschieters
        """
        if "Is_Prijs_Uitschieter" in match_df.columns:
            return match_df[match_df["Is_Prijs_Uitschieter"]].copy()

        # Bereken on-the-fly
        prijs_col_a = f"Eenheidsprijs_{name_a}"
        prijs_col_b = f"Eenheidsprijs_{name_b}"

        valid_mask = match_df[prijs_col_a].notna() & match_df[prijs_col_b].notna()
        df_valid = match_df[valid_mask].copy()

        verschil_pct = (
            (df_valid[prijs_col_a] - df_valid[prijs_col_b])
            / df_valid[prijs_col_b].replace(0, np.nan)
            * 100
        )

        return df_valid[verschil_pct.abs() > self.drempel_percentage]
