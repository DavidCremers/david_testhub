"""Classificatie van ingrepen naar bouwdeel, element en activiteitstype."""

from typing import Optional
import re

import pandas as pd

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("matching.classifier")


class IngreepClassifier:
    """
    Classificeert onderhoudsingrepen naar bouwdeel, element en activiteitstype.

    Gebruikt configureerbare regels en patroonherkenning.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de classifier met configuratie.

        Args:
            config: Configuratie met classificatieregels
        """
        self.config = config
        self._build_patterns()

    def _build_patterns(self) -> None:
        """Bouw regex patronen voor classificatie."""
        self._bouwdeel_patterns: dict[str, re.Pattern] = {}
        self._activiteit_patterns: dict[str, re.Pattern] = {}

        # Bouwdeel patronen
        for bouwdeel, keywords in self.config.bouwdeel_classificatie.items():
            if keywords:
                pattern = "|".join(re.escape(kw) for kw in keywords)
                self._bouwdeel_patterns[bouwdeel] = re.compile(
                    pattern, re.IGNORECASE
                )

        # Activiteit patronen
        for activiteit, keywords in self.config.activiteit_classificatie.items():
            if keywords:
                pattern = "|".join(re.escape(kw) for kw in keywords)
                self._activiteit_patterns[activiteit] = re.compile(
                    pattern, re.IGNORECASE
                )

        logger.debug(
            f"Patronen gebouwd: {len(self._bouwdeel_patterns)} bouwdelen, "
            f"{len(self._activiteit_patterns)} activiteiten"
        )

    def classify(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Classificeer alle ingrepen in een DataFrame.

        Args:
            df: DataFrame met onderhoudsdata

        Returns:
            DataFrame met toegevoegde classificatie kolommen
        """
        df_classified = df.copy()

        # Voeg classificatie kolommen toe
        df_classified["Bouwdeel"] = None
        df_classified["Activiteitstype"] = None

        # Bepaal de tekst kolommen voor classificatie
        text_cols = self._get_text_columns(df_classified)

        for idx in df_classified.index:
            combined_text = self._get_combined_text(df_classified.loc[idx], text_cols)

            # Classificeer bouwdeel
            df_classified.at[idx, "Bouwdeel"] = self._classify_bouwdeel(combined_text)

            # Classificeer activiteitstype
            df_classified.at[idx, "Activiteitstype"] = self._classify_activiteit(
                combined_text
            )

        # Log statistieken
        bouwdeel_classified = df_classified["Bouwdeel"].notna().sum()
        activiteit_classified = df_classified["Activiteitstype"].notna().sum()
        total = len(df_classified)

        logger.info(
            f"Classificatie: {bouwdeel_classified}/{total} bouwdelen, "
            f"{activiteit_classified}/{total} activiteiten"
        )

        return df_classified

    def _get_text_columns(self, df: pd.DataFrame) -> list[str]:
        """Bepaal welke kolommen te gebruiken voor classificatie."""
        priority_columns = [
            "Maatregel",
            "Element Omschrijving",
            "Element",
            "Maatregel omschrijving",
        ]
        return [col for col in priority_columns if col in df.columns]

    def _get_combined_text(self, row: pd.Series, text_cols: list[str]) -> str:
        """Combineer relevante tekstvelden tot één string."""
        texts = []
        for col in text_cols:
            val = row.get(col)
            if pd.notna(val):
                texts.append(str(val))
        return " ".join(texts).lower()

    def _classify_bouwdeel(self, text: str) -> Optional[str]:
        """
        Classificeer tekst naar bouwdeel.

        Args:
            text: Te classificeren tekst

        Returns:
            Bouwdeel naam of None
        """
        if not text:
            return None

        # Prioriteit volgorde voor bouwdelen (specifieker eerst)
        priority_order = [
            "cv_installatie",
            "ventilatie",
            "elektra",
            "riolering",
            "keuken",
            "badkamer",
            "binnenschilderwerk",
            "buitenschilderwerk",
            "glas",
            "kozijn",
            "dakkapel",
            "dak",
            "gevel",
            "fundering",
            "algemene_ruimten",
        ]

        # Check in prioriteitsvolgorde
        for bouwdeel in priority_order:
            if bouwdeel in self._bouwdeel_patterns:
                if self._bouwdeel_patterns[bouwdeel].search(text):
                    return bouwdeel

        # Check overige bouwdelen
        for bouwdeel, pattern in self._bouwdeel_patterns.items():
            if bouwdeel not in priority_order:
                if pattern.search(text):
                    return bouwdeel

        return None

    def _classify_activiteit(self, text: str) -> Optional[str]:
        """
        Classificeer tekst naar activiteitstype.

        Args:
            text: Te classificeren tekst

        Returns:
            Activiteitstype of None
        """
        if not text:
            return None

        # Prioriteit: vervanging > schilderwerk > reparatie > onderhoud > inspectie
        priority_order = [
            "vervanging",
            "schilderwerk",
            "reparatie",
            "onderhoud",
            "inspectie",
        ]

        for activiteit in priority_order:
            if activiteit in self._activiteit_patterns:
                if self._activiteit_patterns[activiteit].search(text):
                    return activiteit

        return None

    def get_classification_stats(self, df: pd.DataFrame) -> dict:
        """
        Genereer statistieken over de classificatie.

        Args:
            df: Geclassificeerd DataFrame

        Returns:
            Dictionary met statistieken
        """
        stats = {
            "totaal_ingrepen": len(df),
            "bouwdeel_verdeling": {},
            "activiteit_verdeling": {},
            "niet_geclassificeerd": {
                "bouwdeel": 0,
                "activiteit": 0,
            },
        }

        if "Bouwdeel" in df.columns:
            bouwdeel_counts = df["Bouwdeel"].value_counts(dropna=False)
            stats["bouwdeel_verdeling"] = bouwdeel_counts.dropna().to_dict()
            stats["niet_geclassificeerd"]["bouwdeel"] = int(
                bouwdeel_counts.get(None, 0) + df["Bouwdeel"].isna().sum()
            )

        if "Activiteitstype" in df.columns:
            activiteit_counts = df["Activiteitstype"].value_counts(dropna=False)
            stats["activiteit_verdeling"] = activiteit_counts.dropna().to_dict()
            stats["niet_geclassificeerd"]["activiteit"] = int(
                activiteit_counts.get(None, 0) + df["Activiteitstype"].isna().sum()
            )

        return stats

    def classify_single(
        self, maatregel: str, element: Optional[str] = None
    ) -> dict[str, Optional[str]]:
        """
        Classificeer een enkele ingreep.

        Args:
            maatregel: Maatregel omschrijving
            element: Optionele element omschrijving

        Returns:
            Dictionary met bouwdeel en activiteitstype
        """
        combined_text = maatregel.lower()
        if element:
            combined_text += " " + element.lower()

        return {
            "bouwdeel": self._classify_bouwdeel(combined_text),
            "activiteitstype": self._classify_activiteit(combined_text),
        }

    def add_custom_rule(
        self, category: str, target: str, keywords: list[str]
    ) -> None:
        """
        Voeg een custom classificatieregel toe.

        Args:
            category: "bouwdeel" of "activiteit"
            target: Naam van de classificatie
            keywords: Lijst met keywords
        """
        pattern = "|".join(re.escape(kw) for kw in keywords)
        compiled = re.compile(pattern, re.IGNORECASE)

        if category == "bouwdeel":
            self._bouwdeel_patterns[target] = compiled
            logger.info(f"Custom bouwdeel regel toegevoegd: {target}")
        elif category == "activiteit":
            self._activiteit_patterns[target] = compiled
            logger.info(f"Custom activiteit regel toegevoegd: {target}")
