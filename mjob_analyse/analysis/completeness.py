"""Completheidsanalyse module voor identificatie van ontbrekende ingrepen."""

from typing import Optional

import pandas as pd

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("analysis.completeness")


# Veelvoorkomende ingrepen die vaak ontbreken
KRITISCHE_INGREPEN = {
    "dak": [
        "dakpannen vervangen",
        "dakgoten vervangen",
        "dakbedekking vervangen",
        "loodwerk vervangen",
    ],
    "gevel": [
        "voegwerk herstellen",
        "metselwerk herstellen",
        "gevelreiniging",
    ],
    "kozijn": [
        "kozijnen vervangen",
        "kozijnen schilderen",
        "hang- en sluitwerk vervangen",
    ],
    "glas": [
        "beglazing vervangen",
        "glaskit vervangen",
    ],
    "schilderwerk": [
        "buitenschilderwerk",
        "binnenschilderwerk",
    ],
    "installaties": [
        "cv-ketel vervangen",
        "warmtepomp vervangen",
        "ventilatie vervangen",
        "elektrische installatie vervangen",
    ],
    "sanitair": [
        "keuken vervangen",
        "badkamer vervangen",
        "toilet vervangen",
    ],
    "overig": [
        "fundering inspecteren",
        "riolering inspecteren",
        "lift onderhoud",
    ],
}


class CompleetheidsAnalyse:
    """
    Analyseert de compleetheid van onderhoudsplannen.

    Identificeert ontbrekende ingrepen en vergelijkt dekking tussen systemen.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de completheidsanalyse.

        Args:
            config: Configuratie
        """
        self.config = config
        self.kritische_ingrepen = KRITISCHE_INGREPEN

    def analyze(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        unmatched_a: list[int],
        unmatched_b: list[int],
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
    ) -> dict:
        """
        Voer completheidsanalyse uit.

        Args:
            df_a: Volledige dataset A
            df_b: Volledige dataset B
            unmatched_a: Indices van niet-gematchte ingrepen in A
            unmatched_b: Indices van niet-gematchte ingrepen in B
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem

        Returns:
            Dictionary met analyseresultaten
        """
        logger.info("Start completheidsanalyse")

        # Ontbrekende ingrepen per systeem
        ontbrekend_in_a = self._get_unmatched_details(df_b, unmatched_b)
        ontbrekend_in_b = self._get_unmatched_details(df_a, unmatched_a)

        # Bouwdeel dekking analyse
        dekking_a = self._analyze_coverage(df_a, name_a)
        dekking_b = self._analyze_coverage(df_b, name_b)

        # Check kritische ingrepen
        kritische_gaps_a = self._check_critical_items(df_a)
        kritische_gaps_b = self._check_critical_items(df_b)

        # Vergelijk dekking
        dekking_vergelijking = self._compare_coverage(dekking_a, dekking_b)

        result = {
            f"ontbrekend_in_{name_a}": ontbrekend_in_a,
            f"ontbrekend_in_{name_b}": ontbrekend_in_b,
            f"dekking_{name_a}": dekking_a,
            f"dekking_{name_b}": dekking_b,
            "dekking_vergelijking": dekking_vergelijking,
            f"kritische_gaps_{name_a}": kritische_gaps_a,
            f"kritische_gaps_{name_b}": kritische_gaps_b,
            "statistieken": {
                f"totaal_{name_a}": len(df_a),
                f"totaal_{name_b}": len(df_b),
                f"ongematchd_{name_a}": len(unmatched_a),
                f"ongematchd_{name_b}": len(unmatched_b),
                "match_percentage": (
                    (1 - (len(unmatched_a) + len(unmatched_b)) / (len(df_a) + len(df_b)))
                    * 100
                    if (len(df_a) + len(df_b)) > 0
                    else 0
                ),
            },
            "samenvatting": self._generate_summary(
                ontbrekend_in_a,
                ontbrekend_in_b,
                kritische_gaps_a,
                kritische_gaps_b,
                name_a,
                name_b,
            ),
        }

        logger.info(
            f"Completheidsanalyse voltooid: "
            f"{len(unmatched_a)} ontbrekend in {name_b}, "
            f"{len(unmatched_b)} ontbrekend in {name_a}"
        )

        return result

    def _get_unmatched_details(
        self, df: pd.DataFrame, indices: list[int]
    ) -> pd.DataFrame:
        """Haal details van niet-gematchte ingrepen."""
        if not indices:
            return pd.DataFrame()

        unmatched_df = df.loc[indices].copy()

        # Selecteer relevante kolommen indien aanwezig
        relevant_cols = [
            "Maatregel",
            "Element Omschrijving",
            "Bouwdeel",
            "Activiteitstype",
            "Hoeveelheid",
            "Eenheid",
            "Eenheidsprijs",
            "Cyclus",
            "Totaalkosten",
        ]

        available_cols = [c for c in relevant_cols if c in unmatched_df.columns]
        return unmatched_df[available_cols] if available_cols else unmatched_df

    def _analyze_coverage(self, df: pd.DataFrame, name: str) -> dict:
        """Analyseer welke bouwdelen gedekt worden."""
        coverage = {
            "naam": name,
            "totaal_ingrepen": len(df),
            "bouwdelen": {},
            "activiteiten": {},
        }

        if "Bouwdeel" in df.columns:
            bouwdeel_counts = df["Bouwdeel"].value_counts(dropna=False)
            coverage["bouwdelen"] = {
                k if pd.notna(k) else "Niet geclassificeerd": int(v)
                for k, v in bouwdeel_counts.items()
            }

        if "Activiteitstype" in df.columns:
            activiteit_counts = df["Activiteitstype"].value_counts(dropna=False)
            coverage["activiteiten"] = {
                k if pd.notna(k) else "Niet geclassificeerd": int(v)
                for k, v in activiteit_counts.items()
            }

        return coverage

    def _check_critical_items(self, df: pd.DataFrame) -> dict:
        """Check of kritische ingrepen aanwezig zijn."""
        gaps = {}

        # Maak lookup van aanwezige maatregelen
        maatregelen = set()
        if "Maatregel" in df.columns:
            maatregelen = set(
                str(m).lower() for m in df["Maatregel"].dropna().unique()
            )

        for categorie, ingrepen in self.kritische_ingrepen.items():
            missing = []
            for ingreep in ingrepen:
                # Check of de ingreep (deels) voorkomt
                found = any(ingreep.lower() in m for m in maatregelen)
                if not found:
                    missing.append(ingreep)

            if missing:
                gaps[categorie] = missing

        return gaps

    def _compare_coverage(self, dekking_a: dict, dekking_b: dict) -> dict:
        """Vergelijk dekking tussen twee systemen."""
        comparison = {
            "alleen_in_a": [],
            "alleen_in_b": [],
            "in_beide": [],
            "aantal_verschil": {},
        }

        bouwdelen_a = set(dekking_a.get("bouwdelen", {}).keys())
        bouwdelen_b = set(dekking_b.get("bouwdelen", {}).keys())

        comparison["alleen_in_a"] = list(bouwdelen_a - bouwdelen_b)
        comparison["alleen_in_b"] = list(bouwdelen_b - bouwdelen_a)
        comparison["in_beide"] = list(bouwdelen_a & bouwdelen_b)

        # Vergelijk aantallen voor gedeelde bouwdelen
        for bouwdeel in comparison["in_beide"]:
            count_a = dekking_a["bouwdelen"].get(bouwdeel, 0)
            count_b = dekking_b["bouwdelen"].get(bouwdeel, 0)
            comparison["aantal_verschil"][bouwdeel] = {
                "a": count_a,
                "b": count_b,
                "verschil": count_a - count_b,
            }

        return comparison

    def _generate_summary(
        self,
        ontbrekend_in_a: pd.DataFrame,
        ontbrekend_in_b: pd.DataFrame,
        gaps_a: dict,
        gaps_b: dict,
        name_a: str,
        name_b: str,
    ) -> str:
        """Genereer tekstuele samenvatting."""
        lines = [
            "Completheidsanalyse Samenvatting",
            "=" * 40,
            "",
            f"Ontbrekend in {name_a}: {len(ontbrekend_in_a)} ingrepen",
            f"Ontbrekend in {name_b}: {len(ontbrekend_in_b)} ingrepen",
            "",
        ]

        if gaps_a:
            lines.append(f"Kritische gaps in {name_a}:")
            for cat, items in list(gaps_a.items())[:3]:
                lines.append(f"  - {cat}: {', '.join(items[:2])}")
            lines.append("")

        if gaps_b:
            lines.append(f"Kritische gaps in {name_b}:")
            for cat, items in list(gaps_b.items())[:3]:
                lines.append(f"  - {cat}: {', '.join(items[:2])}")

        return "\n".join(lines)

    def get_unmatched_by_category(
        self, df: pd.DataFrame, indices: list[int]
    ) -> dict[str, pd.DataFrame]:
        """
        Groepeer niet-gematchte ingrepen per bouwdeel.

        Args:
            df: Volledige dataset
            indices: Indices van niet-gematchte ingrepen

        Returns:
            Dictionary met DataFrames per bouwdeel
        """
        if not indices:
            return {}

        unmatched = df.loc[indices].copy()

        if "Bouwdeel" not in unmatched.columns:
            return {"Alle": unmatched}

        result = {}
        for bouwdeel in unmatched["Bouwdeel"].unique():
            key = bouwdeel if pd.notna(bouwdeel) else "Niet geclassificeerd"
            result[key] = unmatched[unmatched["Bouwdeel"] == bouwdeel]

        return result
