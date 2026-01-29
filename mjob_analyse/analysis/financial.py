"""Financiële analyse module voor totaalkosten en cashflow vergelijking."""

from typing import Optional

import pandas as pd
import numpy as np

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("analysis.financial")


class FinancieleAnalyse:
    """
    Voert financiële totaalanalyse uit.

    Berekent totale kosten, cashflow-profielen en breakdown per bouwdeel.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de financiële analyse.

        Args:
            config: Configuratie met analyse parameters
        """
        self.config = config
        self.horizon = config.analyse.horizon_jaren
        self.inflatie = config.analyse.inflatie_percentage / 100
        self.start_jaar = config.analyse.start_jaar

    def analyze(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        match_df: Optional[pd.DataFrame] = None,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
    ) -> dict:
        """
        Voer financiële analyse uit.

        Args:
            df_a: Dataset A (volledige dataset)
            df_b: Dataset B (volledige dataset)
            match_df: Optioneel DataFrame met matches
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem

        Returns:
            Dictionary met analyseresultaten
        """
        logger.info(f"Start financiële analyse (horizon: {self.horizon} jaar)")

        # Totaalkosten per systeem
        totaal_a = self._calculate_total_costs(df_a, name_a)
        totaal_b = self._calculate_total_costs(df_b, name_b)

        # Breakdown per bouwdeel
        breakdown_a = self._breakdown_per_bouwdeel(df_a, name_a)
        breakdown_b = self._breakdown_per_bouwdeel(df_b, name_b)

        # Jaarlijkse cashflow
        cashflow_a = self._calculate_cashflow(df_a, name_a)
        cashflow_b = self._calculate_cashflow(df_b, name_b)

        # Vergelijkende cashflow
        cashflow_vergelijking = self._compare_cashflows(cashflow_a, cashflow_b, name_a, name_b)

        # NCW berekening (Netto Contante Waarde)
        ncw_a = self._calculate_ncw(cashflow_a)
        ncw_b = self._calculate_ncw(cashflow_b)

        # Match-gebaseerde analyse indien beschikbaar
        match_analyse = None
        if match_df is not None and not match_df.empty:
            match_analyse = self._analyze_matched_costs(match_df, name_a, name_b)

        result = {
            f"totaal_{name_a}": totaal_a,
            f"totaal_{name_b}": totaal_b,
            "verschil_totaal": {
                "absoluut": totaal_a["totaal_over_horizon"] - totaal_b["totaal_over_horizon"],
                "percentage": (
                    (totaal_a["totaal_over_horizon"] - totaal_b["totaal_over_horizon"])
                    / totaal_b["totaal_over_horizon"]
                    * 100
                    if totaal_b["totaal_over_horizon"] > 0
                    else 0
                ),
            },
            f"breakdown_{name_a}": breakdown_a,
            f"breakdown_{name_b}": breakdown_b,
            f"cashflow_{name_a}": cashflow_a,
            f"cashflow_{name_b}": cashflow_b,
            "cashflow_vergelijking": cashflow_vergelijking,
            f"ncw_{name_a}": ncw_a,
            f"ncw_{name_b}": ncw_b,
            "match_analyse": match_analyse,
            "parameters": {
                "horizon_jaren": self.horizon,
                "inflatie_percentage": self.inflatie * 100,
                "start_jaar": self.start_jaar,
            },
            "samenvatting": self._generate_summary(
                totaal_a, totaal_b, breakdown_a, breakdown_b, name_a, name_b
            ),
        }

        logger.info(
            f"Financiële analyse voltooid: "
            f"{name_a}=€{totaal_a['totaal_over_horizon']:,.0f}, "
            f"{name_b}=€{totaal_b['totaal_over_horizon']:,.0f}"
        )

        return result

    def _calculate_total_costs(self, df: pd.DataFrame, name: str) -> dict:
        """Bereken totale kosten over horizon."""
        result = {
            "naam": name,
            "aantal_ingrepen": len(df),
            "totaal_eenmalig": 0,
            "totaal_over_horizon": 0,
            "gemiddeld_per_jaar": 0,
        }

        if "Totaalkosten" not in df.columns or "Cyclus" not in df.columns:
            # Probeer te berekenen
            if "Hoeveelheid" in df.columns and "Eenheidsprijs" in df.columns:
                df = df.copy()
                df["Totaalkosten"] = df["Hoeveelheid"] * df["Eenheidsprijs"]

        if "Totaalkosten" in df.columns:
            result["totaal_eenmalig"] = float(df["Totaalkosten"].sum())

            # Bereken over horizon met cycli
            if "Cyclus" in df.columns:
                for _, row in df.iterrows():
                    kosten = row.get("Totaalkosten", 0)
                    cyclus = row.get("Cyclus", self.horizon)

                    if pd.isna(kosten) or kosten == 0:
                        continue

                    if pd.isna(cyclus) or cyclus <= 0:
                        cyclus = self.horizon  # Eenmalig

                    uitvoeringen = max(1, int(self.horizon / cyclus))
                    result["totaal_over_horizon"] += kosten * uitvoeringen
            else:
                result["totaal_over_horizon"] = result["totaal_eenmalig"]

        result["gemiddeld_per_jaar"] = result["totaal_over_horizon"] / self.horizon

        return result

    def _breakdown_per_bouwdeel(self, df: pd.DataFrame, name: str) -> dict:
        """Bereken kosten breakdown per bouwdeel."""
        if "Bouwdeel" not in df.columns:
            return {}

        result = {}

        for bouwdeel in df["Bouwdeel"].dropna().unique():
            bd_df = df[df["Bouwdeel"] == bouwdeel]
            bd_totals = self._calculate_total_costs(bd_df, f"{name}_{bouwdeel}")

            result[bouwdeel] = {
                "aantal_ingrepen": len(bd_df),
                "totaal_eenmalig": bd_totals["totaal_eenmalig"],
                "totaal_over_horizon": bd_totals["totaal_over_horizon"],
                "percentage_van_totaal": 0,  # Wordt later berekend
            }

        # Bereken percentages
        totaal = sum(bd["totaal_over_horizon"] for bd in result.values())
        if totaal > 0:
            for bouwdeel in result:
                result[bouwdeel]["percentage_van_totaal"] = (
                    result[bouwdeel]["totaal_over_horizon"] / totaal * 100
                )

        return result

    def _calculate_cashflow(self, df: pd.DataFrame, name: str) -> pd.DataFrame:
        """Bereken jaarlijkse cashflow."""
        jaren = range(self.start_jaar, self.start_jaar + self.horizon)
        cashflow = pd.DataFrame({"Jaar": jaren, "Kosten": 0.0})
        cashflow = cashflow.set_index("Jaar")

        if "Totaalkosten" not in df.columns or "Cyclus" not in df.columns:
            return cashflow.reset_index()

        for _, row in df.iterrows():
            kosten = row.get("Totaalkosten", 0)
            cyclus = row.get("Cyclus")
            startjaar = row.get("Startjaar", self.start_jaar)

            if pd.isna(kosten) or kosten == 0:
                continue

            if pd.isna(cyclus) or cyclus <= 0:
                cyclus = self.horizon

            if pd.isna(startjaar):
                startjaar = self.start_jaar

            # Bepaal uitvoeringsjaren
            jaar = int(startjaar)
            while jaar < self.start_jaar + self.horizon:
                if jaar >= self.start_jaar and jaar in cashflow.index:
                    # Pas inflatie toe
                    jaren_vanaf_start = jaar - self.start_jaar
                    kosten_met_inflatie = kosten * ((1 + self.inflatie) ** jaren_vanaf_start)
                    cashflow.loc[jaar, "Kosten"] += kosten_met_inflatie

                jaar += int(cyclus)

        return cashflow.reset_index()

    def _compare_cashflows(
        self,
        cf_a: pd.DataFrame,
        cf_b: pd.DataFrame,
        name_a: str,
        name_b: str,
    ) -> pd.DataFrame:
        """Vergelijk cashflows van beide systemen."""
        merged = cf_a.merge(cf_b, on="Jaar", suffixes=(f"_{name_a}", f"_{name_b}"))

        kosten_a = f"Kosten_{name_a}"
        kosten_b = f"Kosten_{name_b}"

        merged["Verschil"] = merged[kosten_a] - merged[kosten_b]
        merged["Verschil_Cumulatief"] = merged["Verschil"].cumsum()

        return merged

    def _calculate_ncw(
        self, cashflow: pd.DataFrame, discontovoet: float = 0.03
    ) -> float:
        """Bereken Netto Contante Waarde."""
        ncw = 0.0

        for _, row in cashflow.iterrows():
            jaar = row["Jaar"]
            kosten = row["Kosten"]
            t = jaar - self.start_jaar

            ncw += kosten / ((1 + discontovoet) ** t)

        return ncw

    def _analyze_matched_costs(
        self, match_df: pd.DataFrame, name_a: str, name_b: str
    ) -> dict:
        """Analyseer kosten van gematchte ingrepen."""
        kosten_col_a = f"Totaalkosten_{name_a}"
        kosten_col_b = f"Totaalkosten_{name_b}"

        if kosten_col_a not in match_df.columns or kosten_col_b not in match_df.columns:
            return {}

        valid_mask = match_df[kosten_col_a].notna() & match_df[kosten_col_b].notna()
        df_valid = match_df[valid_mask]

        if df_valid.empty:
            return {}

        return {
            "aantal_vergelijkingen": len(df_valid),
            "totaal_kosten_a": float(df_valid[kosten_col_a].sum()),
            "totaal_kosten_b": float(df_valid[kosten_col_b].sum()),
            "verschil_totaal": float(
                df_valid[kosten_col_a].sum() - df_valid[kosten_col_b].sum()
            ),
            "gemiddeld_verschil_per_ingreep": float(
                (df_valid[kosten_col_a] - df_valid[kosten_col_b]).mean()
            ),
        }

    def _generate_summary(
        self,
        totaal_a: dict,
        totaal_b: dict,
        breakdown_a: dict,
        breakdown_b: dict,
        name_a: str,
        name_b: str,
    ) -> str:
        """Genereer tekstuele samenvatting."""
        verschil = totaal_a["totaal_over_horizon"] - totaal_b["totaal_over_horizon"]
        verschil_pct = (
            verschil / totaal_b["totaal_over_horizon"] * 100
            if totaal_b["totaal_over_horizon"] > 0
            else 0
        )

        lines = [
            "Financiële Analyse Samenvatting",
            "=" * 40,
            f"Horizon: {self.horizon} jaar",
            f"Inflatie: {self.inflatie * 100:.1f}%",
            "",
            f"Totaal {name_a}: €{totaal_a['totaal_over_horizon']:,.0f}",
            f"Totaal {name_b}: €{totaal_b['totaal_over_horizon']:,.0f}",
            f"Verschil: €{verschil:,.0f} ({verschil_pct:+.1f}%)",
            "",
            f"Gemiddeld per jaar:",
            f"  {name_a}: €{totaal_a['gemiddeld_per_jaar']:,.0f}",
            f"  {name_b}: €{totaal_b['gemiddeld_per_jaar']:,.0f}",
            "",
        ]

        # Top 3 bouwdelen per systeem
        if breakdown_a:
            sorted_a = sorted(
                breakdown_a.items(),
                key=lambda x: x[1]["totaal_over_horizon"],
                reverse=True,
            )
            lines.append(f"Top 3 bouwdelen {name_a}:")
            for bouwdeel, data in sorted_a[:3]:
                lines.append(
                    f"  - {bouwdeel}: €{data['totaal_over_horizon']:,.0f} "
                    f"({data['percentage_van_totaal']:.1f}%)"
                )

        return "\n".join(lines)

    def create_year_by_year_comparison(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
    ) -> pd.DataFrame:
        """
        Maak een jaar-voor-jaar vergelijking.

        Args:
            df_a: Dataset A
            df_b: Dataset B
            name_a: Naam systeem A
            name_b: Naam systeem B

        Returns:
            DataFrame met jaarlijkse vergelijking
        """
        cf_a = self._calculate_cashflow(df_a, name_a)
        cf_b = self._calculate_cashflow(df_b, name_b)

        comparison = self._compare_cashflows(cf_a, cf_b, name_a, name_b)

        # Voeg extra metrics toe
        kosten_a = f"Kosten_{name_a}"
        kosten_b = f"Kosten_{name_b}"

        comparison[f"Cumulatief_{name_a}"] = comparison[kosten_a].cumsum()
        comparison[f"Cumulatief_{name_b}"] = comparison[kosten_b].cumsum()

        return comparison
