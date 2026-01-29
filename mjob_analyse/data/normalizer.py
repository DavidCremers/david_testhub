"""Data normalisatie voor consistente verwerking."""

from typing import Optional

import pandas as pd
import numpy as np

from ..utils.logging import get_logger

logger = get_logger("data.normalizer")


class DataNormalizer:
    """
    Normaliseert onderhoudsdata voor consistente analyse.

    Standaardiseert datatypes, vult missende waarden, en normaliseert tekst.
    """

    def __init__(self):
        """Initialiseer de normalizer."""
        self._normalization_log: list[str] = []

    def normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Voer volledige normalisatie uit op een DataFrame.

        Args:
            df: Te normaliseren DataFrame

        Returns:
            Genormaliseerde DataFrame
        """
        self._normalization_log = []
        df_norm = df.copy()

        # Stap 1: Kolomnamen normaliseren (whitespace strippen)
        df_norm.columns = [str(col).strip() for col in df_norm.columns]

        # Stap 2: Numerieke velden normaliseren
        df_norm = self._normalize_numeric_fields(df_norm)

        # Stap 3: Tekstvelden normaliseren
        df_norm = self._normalize_text_fields(df_norm)

        # Stap 4: Cyclus velden normaliseren
        df_norm = self._normalize_cyclus(df_norm)

        # Stap 5: Jaar velden normaliseren
        df_norm = self._normalize_years(df_norm)

        # Stap 6: Bereken afgeleide velden
        df_norm = self._calculate_derived_fields(df_norm)

        logger.info(f"Normalisatie voltooid: {len(self._normalization_log)} aanpassingen")
        return df_norm

    def _normalize_numeric_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normaliseer numerieke velden."""
        numeric_columns = ["Hoeveelheid", "Eenheidsprijs", "Cyclus"]

        for col in numeric_columns:
            if col in df.columns:
                original_dtype = df[col].dtype

                # Converteer naar numeriek, vervang fouten door NaN
                df[col] = pd.to_numeric(df[col], errors="coerce")

                # Tel en log conversiefouten
                nan_count = df[col].isna().sum()
                if nan_count > 0:
                    self._normalization_log.append(
                        f"{col}: {nan_count} waarden konden niet worden geconverteerd"
                    )

                # Vervang negatieve waarden door 0 voor hoeveelheden en prijzen
                if col in ["Hoeveelheid", "Eenheidsprijs"]:
                    negative_count = (df[col] < 0).sum()
                    if negative_count > 0:
                        df.loc[df[col] < 0, col] = 0
                        self._normalization_log.append(
                            f"{col}: {negative_count} negatieve waarden naar 0 gezet"
                        )

        return df

    def _normalize_text_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normaliseer tekstvelden."""
        text_columns = [
            "Maatregel",
            "Element Omschrijving",
            "Complex Omschrijving",
            "Eenheid",
        ]

        for col in text_columns:
            if col in df.columns:
                # Strip whitespace
                df[col] = df[col].astype(str).str.strip()

                # Vervang lege strings en "nan" door echte NaN
                df[col] = df[col].replace(["", "nan", "None", "NaN"], np.nan)

                # Normaliseer naar lowercase voor maatregel (voor matching)
                if col == "Maatregel":
                    # Bewaar origineel
                    if "Maatregel_Origineel" not in df.columns:
                        df["Maatregel_Origineel"] = df[col]

        return df

    def _normalize_cyclus(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normaliseer cyclus waarden."""
        if "Cyclus" not in df.columns:
            return df

        # Converteer naar integer jaren
        df["Cyclus"] = pd.to_numeric(df["Cyclus"], errors="coerce")

        # Zet onrealistische cycli naar NaN
        # Cyclus moet tussen 1 en 100 jaar zijn
        invalid_cyclus = (df["Cyclus"] < 1) | (df["Cyclus"] > 100)
        invalid_count = invalid_cyclus.sum()
        if invalid_count > 0:
            df.loc[invalid_cyclus, "Cyclus"] = np.nan
            self._normalization_log.append(
                f"Cyclus: {invalid_count} ongeldige waarden (buiten 1-100 jaar)"
            )

        return df

    def _normalize_years(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normaliseer jaar velden."""
        year_columns = ["Startjaar", "Eindjaar", "Bouwjaar"]
        current_year = pd.Timestamp.now().year

        for col in year_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

                # Valideer jaar range (1900 - 2100)
                invalid = (df[col] < 1900) | (df[col] > 2100)
                invalid_count = invalid.sum()
                if invalid_count > 0:
                    df.loc[invalid, col] = np.nan
                    self._normalization_log.append(
                        f"{col}: {invalid_count} ongeldige waarden"
                    )

        return df

    def _calculate_derived_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Bereken afgeleide velden."""
        # Bereken totaalkosten indien mogelijk
        if "Hoeveelheid" in df.columns and "Eenheidsprijs" in df.columns:
            if "Totaalkosten" not in df.columns:
                df["Totaalkosten"] = df["Hoeveelheid"] * df["Eenheidsprijs"]
                self._normalization_log.append("Totaalkosten berekend")

        # Bereken jaarlijkse kosten indien cyclus bekend
        if "Totaalkosten" in df.columns and "Cyclus" in df.columns:
            if "Jaarlijkse_Kosten" not in df.columns:
                df["Jaarlijkse_Kosten"] = df["Totaalkosten"] / df["Cyclus"]
                # Vervang inf door NaN (cyclus = 0)
                df["Jaarlijkse_Kosten"] = df["Jaarlijkse_Kosten"].replace(
                    [np.inf, -np.inf], np.nan
                )
                self._normalization_log.append("Jaarlijkse kosten berekend")

        return df

    def get_normalization_report(self) -> list[str]:
        """
        Haal het normalisatierapport op.

        Returns:
            Lijst met normalisatie acties
        """
        return self._normalization_log.copy()

    def fill_missing_prices(
        self, df: pd.DataFrame, benchmark_prices: Optional[dict[str, float]] = None
    ) -> pd.DataFrame:
        """
        Vul ontbrekende prijzen in met benchmark waarden.

        Args:
            df: DataFrame met data
            benchmark_prices: Dictionary met benchmark prijzen per maatregel

        Returns:
            DataFrame met ingevulde prijzen
        """
        if "Eenheidsprijs" not in df.columns:
            return df

        if benchmark_prices is None:
            return df

        missing_mask = df["Eenheidsprijs"].isna()
        filled_count = 0

        for idx in df[missing_mask].index:
            maatregel = df.loc[idx, "Maatregel"]
            if pd.notna(maatregel):
                maatregel_lower = str(maatregel).lower()
                for key, price in benchmark_prices.items():
                    if key.lower() in maatregel_lower:
                        df.loc[idx, "Eenheidsprijs"] = price
                        filled_count += 1
                        break

        if filled_count > 0:
            self._normalization_log.append(
                f"Eenheidsprijs: {filled_count} waarden ingevuld met benchmarks"
            )

        return df

    def standardize_units(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standaardiseer eenheden naar uniforme notatie.

        Args:
            df: DataFrame met eenheid kolom

        Returns:
            DataFrame met gestandaardiseerde eenheden
        """
        if "Eenheid" not in df.columns:
            return df

        # Eenheid mapping
        unit_mapping = {
            "m2": "m²",
            "m²": "m²",
            "vierkante meter": "m²",
            "m1": "m¹",
            "m¹": "m¹",
            "m": "m¹",
            "strekkende meter": "m¹",
            "st": "st",
            "stuk": "st",
            "stuks": "st",
            "vhe": "VHE",
            "woning": "VHE",
            "woningen": "VHE",
        }

        df["Eenheid"] = (
            df["Eenheid"]
            .astype(str)
            .str.lower()
            .str.strip()
            .map(lambda x: unit_mapping.get(x, x))
        )

        return df
