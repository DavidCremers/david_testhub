"""Hoeveelhedenanalyse module voor vergelijking van volumes."""

from typing import Optional

import pandas as pd
import numpy as np

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("analysis.quantity")


class HoeveelhedenAnalyse:
    """
    Analyseert verschillen in hoeveelheden tussen twee datasets.

    Vergelijkt volumes per bouwdeel/element en relateert aan VHE-aantallen.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de hoeveelhedenanalyse.

        Args:
            config: Configuratie met drempelwaarden
        """
        self.config = config
        self.drempel_percentage = config.drempels.hoeveelheid_afwijking_percentage

    def analyze(
        self,
        match_df: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
        vhe_aantallen: Optional[dict] = None,
    ) -> dict:
        """
        Voer hoeveelhedenanalyse uit op gematchte ingrepen.

        Args:
            match_df: DataFrame met gematchte ingrepen
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem
            vhe_aantallen: Optioneel dict met VHE aantallen per complex

        Returns:
            Dictionary met analyseresultaten
        """
        logger.info("Start hoeveelhedenanalyse")

        hv_col_a = f"Hoeveelheid_{name_a}"
        hv_col_b = f"Hoeveelheid_{name_b}"

        # Filter rijen met geldige hoeveelheden
        valid_mask = match_df[hv_col_a].notna() & match_df[hv_col_b].notna()
        df_valid = match_df[valid_mask].copy()

        if df_valid.empty:
            logger.warning("Geen geldige hoeveelheidsparen gevonden")
            return self._empty_result()

        # Bereken hoeveelheidsverschillen
        df_valid["HV_Verschil_Absoluut"] = df_valid[hv_col_a] - df_valid[hv_col_b]
        df_valid["HV_Verschil_Percentage"] = (
            df_valid["HV_Verschil_Absoluut"]
            / df_valid[hv_col_b].replace(0, np.nan)
            * 100
        )

        # Identificeer grote afwijkingen
        df_valid["Is_HV_Afwijking"] = (
            df_valid["HV_Verschil_Percentage"].abs() > self.drempel_percentage
        )

        # Statistieken
        stats = self._calculate_statistics(df_valid, hv_col_a, hv_col_b)

        # Top afwijkingen
        top_afwijkingen = self._get_top_afwijkingen(df_valid, name_a, name_b)

        # Per bouwdeel/eenheid analyse
        bouwdeel_analyse = self._analyze_per_bouwdeel(df_valid, hv_col_a, hv_col_b)
        eenheid_analyse = self._analyze_per_eenheid(df_valid, name_a, name_b)

        # VHE-gerelateerde analyse
        vhe_analyse = None
        if vhe_aantallen:
            vhe_analyse = self._analyze_vhe_relatief(df_valid, name_a, name_b, vhe_aantallen)

        result = {
            "statistieken": stats,
            "top_afwijkingen": top_afwijkingen,
            "per_bouwdeel": bouwdeel_analyse,
            "per_eenheid": eenheid_analyse,
            "vhe_analyse": vhe_analyse,
            "detail_data": df_valid,
            "samenvatting": self._generate_summary(stats, top_afwijkingen),
        }

        logger.info(
            f"Hoeveelhedenanalyse voltooid: {len(df_valid)} paren, "
            f"{stats['aantal_afwijkingen']} afwijkingen"
        )

        return result

    def _calculate_statistics(
        self, df: pd.DataFrame, hv_col_a: str, hv_col_b: str
    ) -> dict:
        """Bereken statistische metrics."""
        return {
            "aantal_vergelijkingen": len(df),
            "totaal_hoeveelheid_a": float(df[hv_col_a].sum()),
            "totaal_hoeveelheid_b": float(df[hv_col_b].sum()),
            "mediaan_verschil_percentage": float(
                df["HV_Verschil_Percentage"].median()
            ),
            "gemiddeld_verschil_percentage": float(
                df["HV_Verschil_Percentage"].mean()
            ),
            "aantal_afwijkingen": int(df["Is_HV_Afwijking"].sum()),
            "percentage_afwijkingen": float(df["Is_HV_Afwijking"].mean() * 100),
            "a_meer": int((df["HV_Verschil_Absoluut"] > 0).sum()),
            "b_meer": int((df["HV_Verschil_Absoluut"] < 0).sum()),
        }

    def _get_top_afwijkingen(
        self, df: pd.DataFrame, name_a: str, name_b: str, n: int = 10
    ) -> list[dict]:
        """Haal de top N grootste hoeveelheidsverschillen."""
        df_sorted = df.reindex(
            df["HV_Verschil_Percentage"].abs().sort_values(ascending=False).index
        )

        top_items = []
        for _, row in df_sorted.head(n).iterrows():
            maatregel = (
                row.get(f"Maatregel_{name_a}") or row.get(f"Maatregel_{name_b}")
            )

            top_items.append({
                "maatregel": maatregel,
                "bouwdeel": row.get("Bouwdeel"),
                "eenheid_a": row.get(f"Eenheid_{name_a}"),
                "eenheid_b": row.get(f"Eenheid_{name_b}"),
                "hoeveelheid_a": float(row[f"Hoeveelheid_{name_a}"]),
                "hoeveelheid_b": float(row[f"Hoeveelheid_{name_b}"]),
                "verschil_absoluut": float(row["HV_Verschil_Absoluut"]),
                "verschil_percentage": float(row["HV_Verschil_Percentage"]),
            })

        return top_items

    def _analyze_per_bouwdeel(
        self, df: pd.DataFrame, hv_col_a: str, hv_col_b: str
    ) -> dict:
        """Analyseer hoeveelheidsverschillen per bouwdeel."""
        if "Bouwdeel" not in df.columns:
            return {}

        result = {}
        for bouwdeel in df["Bouwdeel"].dropna().unique():
            bd_df = df[df["Bouwdeel"] == bouwdeel]

            result[bouwdeel] = {
                "aantal_ingrepen": len(bd_df),
                "totaal_a": float(bd_df[hv_col_a].sum()),
                "totaal_b": float(bd_df[hv_col_b].sum()),
                "gemiddeld_verschil_pct": float(
                    bd_df["HV_Verschil_Percentage"].mean()
                ),
                "aantal_afwijkingen": int(bd_df["Is_HV_Afwijking"].sum()),
            }

        return result

    def _analyze_per_eenheid(
        self, df: pd.DataFrame, name_a: str, name_b: str
    ) -> dict:
        """Analyseer hoeveelheden per eenheid type."""
        eenheid_col = f"Eenheid_{name_a}"
        if eenheid_col not in df.columns:
            return {}

        result = {}
        for eenheid in df[eenheid_col].dropna().unique():
            eh_df = df[df[eenheid_col] == eenheid]

            result[eenheid] = {
                "aantal_ingrepen": len(eh_df),
                "totaal_a": float(eh_df[f"Hoeveelheid_{name_a}"].sum()),
                "totaal_b": float(eh_df[f"Hoeveelheid_{name_b}"].sum()),
                "gemiddeld_verschil_pct": float(
                    eh_df["HV_Verschil_Percentage"].mean()
                ),
            }

        return result

    def _analyze_vhe_relatief(
        self,
        df: pd.DataFrame,
        name_a: str,
        name_b: str,
        vhe_aantallen: dict,
    ) -> dict:
        """Analyseer hoeveelheden relatief aan VHE aantallen."""
        result = {
            "per_vhe_gemiddeld": {},
            "afwijkingen_per_vhe": [],
        }

        total_vhe = sum(vhe_aantallen.values())
        if total_vhe == 0:
            return result

        # Bereken gemiddelden per VHE
        hv_col_a = f"Hoeveelheid_{name_a}"
        hv_col_b = f"Hoeveelheid_{name_b}"

        if "Bouwdeel" in df.columns:
            for bouwdeel in df["Bouwdeel"].dropna().unique():
                bd_df = df[df["Bouwdeel"] == bouwdeel]

                totaal_a = bd_df[hv_col_a].sum()
                totaal_b = bd_df[hv_col_b].sum()

                result["per_vhe_gemiddeld"][bouwdeel] = {
                    "per_vhe_a": totaal_a / total_vhe,
                    "per_vhe_b": totaal_b / total_vhe,
                }

        return result

    def _generate_summary(self, stats: dict, top_afwijkingen: list) -> str:
        """Genereer tekstuele samenvatting."""
        lines = [
            "Hoeveelhedenanalyse Samenvatting",
            "=" * 40,
            f"Vergeleken: {stats['aantal_vergelijkingen']} ingrepen",
            f"",
            f"Afwijkingen (>{self.drempel_percentage}%): {stats['aantal_afwijkingen']} "
            f"({stats['percentage_afwijkingen']:.1f}%)",
            f"Gemiddeld verschil: {stats['gemiddeld_verschil_percentage']:.1f}%",
            f"",
        ]

        if top_afwijkingen:
            lines.append("Top 3 grootste volumeverschillen:")
            for i, item in enumerate(top_afwijkingen[:3], 1):
                lines.append(
                    f"  {i}. {item['maatregel'][:40]}: "
                    f"{item['hoeveelheid_a']:.0f} vs {item['hoeveelheid_b']:.0f} "
                    f"({item['verschil_percentage']:+.1f}%)"
                )

        return "\n".join(lines)

    def _empty_result(self) -> dict:
        """Retourneer leeg resultaat."""
        return {
            "statistieken": {
                "aantal_vergelijkingen": 0,
                "aantal_afwijkingen": 0,
            },
            "top_afwijkingen": [],
            "per_bouwdeel": {},
            "per_eenheid": {},
            "vhe_analyse": None,
            "detail_data": pd.DataFrame(),
            "samenvatting": "Geen hoeveelheidsdata beschikbaar voor analyse.",
        }

    def compare_totals_per_element(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
    ) -> pd.DataFrame:
        """
        Vergelijk totale hoeveelheden per element/bouwdeel.

        Args:
            df_a: Dataset A
            df_b: Dataset B
            name_a: Naam systeem A
            name_b: Naam systeem B

        Returns:
            DataFrame met totalen per element
        """
        results = []

        # Groepeer per bouwdeel
        if "Bouwdeel" in df_a.columns and "Bouwdeel" in df_b.columns:
            for bouwdeel in set(
                list(df_a["Bouwdeel"].dropna().unique())
                + list(df_b["Bouwdeel"].dropna().unique())
            ):
                totaal_a = (
                    df_a[df_a["Bouwdeel"] == bouwdeel]["Hoeveelheid"].sum()
                    if "Hoeveelheid" in df_a.columns
                    else 0
                )
                totaal_b = (
                    df_b[df_b["Bouwdeel"] == bouwdeel]["Hoeveelheid"].sum()
                    if "Hoeveelheid" in df_b.columns
                    else 0
                )

                results.append({
                    "Bouwdeel": bouwdeel,
                    f"Totaal_{name_a}": totaal_a,
                    f"Totaal_{name_b}": totaal_b,
                    "Verschil": totaal_a - totaal_b,
                    "Verschil_%": (
                        (totaal_a - totaal_b) / totaal_b * 100
                        if totaal_b > 0
                        else None
                    ),
                })

        return pd.DataFrame(results)
