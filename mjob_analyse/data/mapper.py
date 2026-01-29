"""Kolom mapping voor het vertalen van systeemspecifieke kolommen."""

from typing import Optional

import pandas as pd

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("data.mapper")


# Standaard veldnamen die intern gebruikt worden
STANDAARD_VELDEN = {
    "complex_id": "Complex ID",
    "complex_omschrijving": "Complex Omschrijving",
    "plaatsaanduiding": "Plaatsaanduiding",
    "element_code": "Element Code",
    "element_omschrijving": "Element Omschrijving",
    "maatregel": "Maatregel",
    "hoeveelheid": "Hoeveelheid",
    "eenheid": "Eenheid",
    "eenheidsprijs": "Eenheidsprijs",
    "cyclus": "Cyclus",
    "startjaar": "Startjaar",
    "eindjaar": "Eindjaar",
    "bouwjaar": "Bouwjaar",
    "prioriteit": "Prioriteit",
}


class ColumnMapper:
    """
    Vertaalt kolommen van bronsystemen naar standaard veldnamen.

    Ondersteunt automatische detectie en handmatige mapping.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de mapper met configuratie.

        Args:
            config: Configuratie met kolom mappings
        """
        self.config = config
        self._fuzzy_cache: dict[str, str] = {}

    def map_columns(
        self,
        df: pd.DataFrame,
        systeem_type: Optional[str] = None,
        custom_mapping: Optional[dict[str, str]] = None,
    ) -> pd.DataFrame:
        """
        Map kolommen naar standaard veldnamen.

        Args:
            df: DataFrame met originele kolommen
            systeem_type: Type bronsysteem voor automatische mapping
            custom_mapping: Handmatige mapping (overschrijft auto-detectie)

        Returns:
            DataFrame met gestandaardiseerde kolommen
        """
        df_mapped = df.copy()

        # Bepaal welke mapping te gebruiken
        if custom_mapping:
            mapping = custom_mapping
            logger.info("Gebruik custom kolom mapping")
        elif systeem_type:
            mapping = self.config.get_kolom_mapping(systeem_type)
            logger.info(f"Gebruik mapping voor systeem: {systeem_type}")
        else:
            mapping = self._auto_detect_mapping(df)
            logger.info("Gebruik auto-gedetecteerde mapping")

        if not mapping:
            logger.warning("Geen mapping beschikbaar, kolommen blijven ongewijzigd")
            return df_mapped

        # Voer de mapping uit (van config-sleutel naar originele kolomnaam)
        # mapping format: {"standaard_veld": "Originele Kolom Naam"}
        rename_dict = {}
        for standaard_veld, originele_kolom in mapping.items():
            if originele_kolom in df_mapped.columns:
                standaard_naam = STANDAARD_VELDEN.get(standaard_veld, standaard_veld)
                rename_dict[originele_kolom] = standaard_naam
                logger.debug(f"Map: '{originele_kolom}' -> '{standaard_naam}'")

        df_mapped = df_mapped.rename(columns=rename_dict)

        # Log niet-gemapte kolommen
        mapped_cols = set(rename_dict.values())
        unmapped = [c for c in df_mapped.columns if c not in mapped_cols]
        if unmapped:
            logger.debug(f"Niet-gemapte kolommen behouden: {unmapped[:10]}")

        return df_mapped

    def _auto_detect_mapping(self, df: pd.DataFrame) -> dict[str, str]:
        """
        Probeer automatisch kolommen te matchen met standaard velden.

        Args:
            df: DataFrame om te analyseren

        Returns:
            Dictionary met gedetecteerde mapping
        """
        mapping = {}
        columns_lower = {col.lower().strip(): col for col in df.columns}

        # Bekende patronen voor automatische detectie
        patterns = {
            "complex_id": ["complex", "complexnummer", "complexnr", "complex_id"],
            "complex_omschrijving": [
                "complex omschrijving",
                "complexnaam",
                "complex naam",
            ],
            "element_code": ["element", "elementcode", "elementnr", "element_code"],
            "element_omschrijving": [
                "element omschrijving",
                "elementomschrijving",
                "element naam",
            ],
            "maatregel": [
                "maatregel",
                "maatregel omschrijving",
                "activiteit",
                "ingreep",
            ],
            "hoeveelheid": ["hoeveelheid", "aantal", "quantity", "hv"],
            "eenheid": ["eenheid", "unit", "eh"],
            "eenheidsprijs": [
                "eenheidsprijs",
                "prijs",
                "prijs per eenheid",
                "unit price",
                "ep",
            ],
            "cyclus": ["cyclus", "interval", "frequentie", "cycle"],
            "startjaar": ["startjaar", "eerste jaar", "start jaar", "eerste uitvoering"],
            "eindjaar": ["eindjaar", "laatste jaar", "eind jaar"],
            "bouwjaar": ["bouwjaar", "bouwjaar element", "bouwjaar object"],
        }

        for standaard_veld, varianten in patterns.items():
            for variant in varianten:
                if variant in columns_lower:
                    mapping[standaard_veld] = columns_lower[variant]
                    break

        logger.debug(f"Auto-gedetecteerde mapping: {len(mapping)} velden")
        return mapping

    def get_available_columns(self, df: pd.DataFrame) -> dict[str, list[str]]:
        """
        Analyseer beschikbare kolommen en categoriseer ze.

        Args:
            df: DataFrame om te analyseren

        Returns:
            Dictionary met categorieën en kolomnamen
        """
        result = {
            "numeriek": [],
            "tekst": [],
            "datum": [],
            "onbekend": [],
        }

        for col in df.columns:
            dtype = df[col].dtype

            if pd.api.types.is_numeric_dtype(dtype):
                result["numeriek"].append(col)
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                result["datum"].append(col)
            elif pd.api.types.is_string_dtype(dtype) or dtype == object:
                result["tekst"].append(col)
            else:
                result["onbekend"].append(col)

        return result

    def suggest_mapping(self, df: pd.DataFrame) -> dict[str, Optional[str]]:
        """
        Genereer suggesties voor kolom mapping.

        Args:
            df: DataFrame om te analyseren

        Returns:
            Dictionary met standaard velden en gesuggereerde kolommen
        """
        auto_mapping = self._auto_detect_mapping(df)
        suggestions = {}

        for standaard_veld in STANDAARD_VELDEN:
            suggestions[standaard_veld] = auto_mapping.get(standaard_veld)

        return suggestions

    def validate_mapping(
        self, df: pd.DataFrame, mapping: dict[str, str]
    ) -> tuple[bool, list[str]]:
        """
        Valideer een kolom mapping tegen een DataFrame.

        Args:
            df: DataFrame om te valideren
            mapping: Te valideren mapping

        Returns:
            Tuple van (is_valid, lijst met foutmeldingen)
        """
        errors = []
        required_fields = ["maatregel", "hoeveelheid"]

        for field in required_fields:
            if field not in mapping:
                errors.append(f"Verplicht veld '{field}' ontbreekt in mapping")
            elif mapping[field] not in df.columns:
                errors.append(
                    f"Kolom '{mapping[field]}' voor veld '{field}' niet gevonden"
                )

        # Check of gemapte kolommen bestaan
        for field, column in mapping.items():
            if column not in df.columns:
                errors.append(f"Kolom '{column}' niet gevonden in data")

        return len(errors) == 0, errors
