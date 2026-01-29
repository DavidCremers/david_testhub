"""Cyclusanalyse module voor vergelijking van onderhoudsfrequenties."""

from typing import Optional

import pandas as pd
import numpy as np

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("analysis.cycle")


class CyclusAnalyse:
    """
    Analyseert verschillen in onderhoudscycli tussen twee datasets.

    Berekent financieel effect van cyclusverschillen en vergelijkt met gangbare praktijk.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de cyclusanalyse.

        Args:
            config: Configuratie met analyse parameters
        """
        self.config = config
        self.horizon = config.analyse.horizon_jaren
        self.drempel_jaren = config.drempels.cyclus_afwijking_jaren

    def analyze(
        self,
        match_df: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
        benchmark_cycli: Optional[dict] = None,
    ) -> dict:
        """
        Voer cyclusanalyse uit op gematchte ingrepen.

        Args:
            match_df: DataFrame met gematchte ingrepen
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem
            benchmark_cycli: Optionele benchmark cycli per categorie

        Returns:
            Dictionary met analyseresultaten
        """
        logger.info("Start cyclusanalyse")

        cyclus_col_a = f"Cyclus_{name_a}"
        cyclus_col_b = f"Cyclus_{name_b}"

        # Filter rijen met geldige cycli
        valid_mask = match_df[cyclus_col_a].notna() & match_df[cyclus_col_b].notna()
        df_valid = match_df[valid_mask].copy()

        if df_valid.empty:
            logger.warning("Geen geldige cyclusparen gevonden")
            return self._empty_result()

        # Bereken cyclusverschillen
        df_valid["Cyclus_Verschil_Jaren"] = (
            df_valid[cyclus_col_a] - df_valid[cyclus_col_b]
        )
        df_valid["Cyclus_Verschil_Percentage"] = (
            df_valid["Cyclus_Verschil_Jaren"]
            / df_valid[cyclus_col_b].replace(0, np.nan)
            * 100
        )

        # Identificeer sterke afwijkingen
        df_valid["Is_Cyclus_Afwijking"] = (
            df_valid["Cyclus_Verschil_Jaren"].abs() > self.drempel_jaren
        )

        # Bereken financieel effect
        df_valid = self._calculate_financial_impact(
            df_valid, name_a, name_b, cyclus_col_a, cyclus_col_b
        )

        # Statistieken
        stats = self._calculate_statistics(df_valid, cyclus_col_a, cyclus_col_b)

        # Top afwijkingen
        top_afwijkingen = self._get_top_afwijkingen(df_valid, name_a, name_b)

        # Per bouwdeel analyse
        bouwdeel_analyse = self._analyze_per_bouwdeel(
            df_valid, cyclus_col_a, cyclus_col_b
        )

        # Benchmark vergelijking
        benchmark_vergelijking = None
        if benchmark_cycli:
            benchmark_vergelijking = self._compare_with_benchmark(
                df_valid, name_a, name_b, benchmark_cycli
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
            f"Cyclusanalyse voltooid: {len(df_valid)} paren, "
            f"{stats['aantal_afwijkingen']} afwijkingen"
        )

        return result

    def _calculate_financial_impact(
        self,
        df: pd.DataFrame,
        name_a: str,
        name_b: str,
        cyclus_col_a: str,
        cyclus_col_b: str,
    ) -> pd.DataFrame:
        """Bereken het financiële effect van cyclusverschillen."""
        kosten_col_a = f"Totaalkosten_{name_a}"
        kosten_col_b = f"Totaalkosten_{name_b}"

        # Aantal keer uitvoeren over horizon
        df["Uitvoeringen_A"] = np.floor(self.horizon / df[cyclus_col_a])
        df["Uitvoeringen_B"] = np.floor(self.horizon / df[cyclus_col_b])
        df["Verschil_Uitvoeringen"] = df["Uitvoeringen_A"] - df["Uitvoeringen_B"]

        # Financieel effect (met kosten van systeem A als basis)
        if kosten_col_a in df.columns:
            df["Financieel_Effect_Cyclus"] = (
                df["Verschil_Uitvoeringen"] * df[kosten_col_a]
            )
        else:
            df["Financieel_Effect_Cyclus"] = np.nan

        return df

    def _calculate_statistics(
        self, df: pd.DataFrame, cyclus_col_a: str, cyclus_col_b: str
    ) -> dict:
        """Bereken statistische metrics."""
        return {
            "aantal_vergelijkingen": len(df),
            "gemiddelde_cyclus_a": float(df[cyclus_col_a].mean()),
            "gemiddelde_cyclus_b": float(df[cyclus_col_b].mean()),
            "mediaan_verschil_jaren": float(df["Cyclus_Verschil_Jaren"].median()),
            "gemiddeld_verschil_jaren": float(df["Cyclus_Verschil_Jaren"].mean()),
            "aantal_afwijkingen": int(df["Is_Cyclus_Afwijking"].sum()),
            "a_kortere_cyclus": int((df["Cyclus_Verschil_Jaren"] < 0).sum()),
            "b_kortere_cyclus": int((df["Cyclus_Verschil_Jaren"] > 0).sum()),
            "totaal_financieel_effect": float(
                df["Financieel_Effect_Cyclus"].sum()
                if "Financieel_Effect_Cyclus" in df.columns
                else 0
            ),
            "horizon_jaren": self.horizon,
        }

    def _get_top_afwijkingen(
        self, df: pd.DataFrame, name_a: str, name_b: str, n: int = 10
    ) -> list[dict]:
        """Haal de top N cyclusafwijkingen met grootste financieel effect."""
        sort_col = "Financieel_Effect_Cyclus"
        if sort_col not in df.columns or df[sort_col].isna().all():
            sort_col = "Cyclus_Verschil_Jaren"

        df_sorted = df.reindex(
            df[sort_col].abs().sort_values(ascending=False).index
        )

        top_items = []
        for _, row in df_sorted.head(n).iterrows():
            maatregel = (
                row.get(f"Maatregel_{name_a}") or row.get(f"Maatregel_{name_b}")
            )

            top_items.append({
                "maatregel": maatregel,
                "bouwdeel": row.get("Bouwdeel"),
                "cyclus_a": int(row[f"Cyclus_{name_a}"]),
                "cyclus_b": int(row[f"Cyclus_{name_b}"]),
                "verschil_jaren": int(row["Cyclus_Verschil_Jaren"]),
                "uitvoeringen_a": int(row.get("Uitvoeringen_A", 0)),
                "uitvoeringen_b": int(row.get("Uitvoeringen_B", 0)),
                "financieel_effect": float(
                    row.get("Financieel_Effect_Cyclus", 0) or 0
                ),
            })

        return top_items

    def _analyze_per_bouwdeel(
        self, df: pd.DataFrame, cyclus_col_a: str, cyclus_col_b: str
    ) -> dict:
        """Analyseer cyclusverschillen per bouwdeel."""
        if "Bouwdeel" not in df.columns:
            return {}

        result = {}
        for bouwdeel in df["Bouwdeel"].dropna().unique():
            bd_df = df[df["Bouwdeel"] == bouwdeel]

            result[bouwdeel] = {
                "aantal_ingrepen": len(bd_df),
                "gemiddelde_cyclus_a": float(bd_df[cyclus_col_a].mean()),
                "gemiddelde_cyclus_b": float(bd_df[cyclus_col_b].mean()),
                "gemiddeld_verschil_jaren": float(
                    bd_df["Cyclus_Verschil_Jaren"].mean()
                ),
                "aantal_afwijkingen": int(bd_df["Is_Cyclus_Afwijking"].sum()),
                "financieel_effect": float(
                    bd_df["Financieel_Effect_Cyclus"].sum()
                    if "Financieel_Effect_Cyclus" in bd_df.columns
                    else 0
                ),
            }

        return result

    def _compare_with_benchmark(
        self,
        df: pd.DataFrame,
        name_a: str,
        name_b: str,
        benchmark_cycli: dict,
    ) -> list[dict]:
        """Vergelijk cycli met gangbare benchmark waarden."""
        comparisons = []

        for _, row in df.iterrows():
            maatregel = row.get(f"Maatregel_{name_a}") or row.get(f"Maatregel_{name_b}")
            bouwdeel = row.get("Bouwdeel")

            if not maatregel:
                continue

            # Zoek matching benchmark
            benchmark_cyclus = None
            benchmark_key = None

            # Eerst op bouwdeel
            if bouwdeel and bouwdeel in benchmark_cycli:
                benchmark_cyclus = benchmark_cycli[bouwdeel]
                benchmark_key = bouwdeel
            else:
                # Dan op keywords
                maatregel_lower = str(maatregel).lower()
                for key, value in benchmark_cycli.items():
                    if key.lower() in maatregel_lower:
                        benchmark_cyclus = value
                        benchmark_key = key
                        break

            if benchmark_cyclus:
                cyclus_a = row.get(f"Cyclus_{name_a}")
                cyclus_b = row.get(f"Cyclus_{name_b}")

                comparisons.append({
                    "maatregel": maatregel,
                    "bouwdeel": bouwdeel,
                    "benchmark_categorie": benchmark_key,
                    "benchmark_cyclus": benchmark_cyclus,
                    "cyclus_a": cyclus_a,
                    "cyclus_b": cyclus_b,
                    "afwijking_a": (
                        cyclus_a - benchmark_cyclus if pd.notna(cyclus_a) else None
                    ),
                    "afwijking_b": (
                        cyclus_b - benchmark_cyclus if pd.notna(cyclus_b) else None
                    ),
                })

        return comparisons

    def _generate_summary(self, stats: dict, top_afwijkingen: list) -> str:
        """Genereer tekstuele samenvatting."""
        lines = [
            f"Cyclusanalyse Samenvatting",
            f"=" * 40,
            f"Vergeleken: {stats['aantal_vergelijkingen']} ingrepen",
            f"Analysehorizon: {stats['horizon_jaren']} jaar",
            f"",
            f"Sterke afwijkingen (>{self.drempel_jaren} jaar): "
            f"{stats['aantal_afwijkingen']}",
            f"Gemiddeld cyclusverschil: {stats['gemiddeld_verschil_jaren']:.1f} jaar",
            f"",
            f"Totaal financieel effect: €{stats['totaal_financieel_effect']:,.0f}",
            f"",
        ]

        if top_afwijkingen:
            lines.append("Top 3 grootste effecten:")
            for i, item in enumerate(top_afwijkingen[:3], 1):
                lines.append(
                    f"  {i}. {item['maatregel'][:40]}: "
                    f"{item['cyclus_a']}j vs {item['cyclus_b']}j "
                    f"(€{item['financieel_effect']:,.0f})"
                )

        return "\n".join(lines)

    def _empty_result(self) -> dict:
        """Retourneer leeg resultaat."""
        return {
            "statistieken": {
                "aantal_vergelijkingen": 0,
                "aantal_afwijkingen": 0,
                "horizon_jaren": self.horizon,
            },
            "top_afwijkingen": [],
            "per_bouwdeel": {},
            "benchmark_vergelijking": None,
            "detail_data": pd.DataFrame(),
            "samenvatting": "Geen cyclusdata beschikbaar voor analyse.",
        }
