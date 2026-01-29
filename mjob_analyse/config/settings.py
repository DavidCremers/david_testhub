"""Configuratie beheer voor MJOB Analyse."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml

from ..utils.logging import get_logger

logger = get_logger("config")

# Pad naar default configuratie
DEFAULT_CONFIG_PATH = Path(__file__).parent / "defaults.yaml"


@dataclass
class AnalyseSettings:
    """Instellingen voor de analyse."""

    horizon_jaren: int = 60
    inflatie_percentage: float = 2.0
    start_jaar: int = 2024


@dataclass
class DrempelSettings:
    """Drempelwaarden voor afwijkingsdetectie."""

    prijs_afwijking_percentage: float = 15.0
    cyclus_afwijking_jaren: int = 3
    hoeveelheid_afwijking_percentage: float = 20.0
    match_confidence_minimum: float = 0.6


@dataclass
class OutputSettings:
    """Output instellingen."""

    excel_max_rijen: int = 100000
    excel_auto_breedte: bool = True
    excel_kleur_afwijkingen: bool = True
    html_include_grafieken: bool = True


@dataclass
class Config:
    """Hoofdconfiguratie voor MJOB Analyse."""

    analyse: AnalyseSettings = field(default_factory=AnalyseSettings)
    drempels: DrempelSettings = field(default_factory=DrempelSettings)
    output: OutputSettings = field(default_factory=OutputSettings)
    kolom_mappings: dict[str, dict[str, str]] = field(default_factory=dict)
    bouwdeel_classificatie: dict[str, list[str]] = field(default_factory=dict)
    activiteit_classificatie: dict[str, list[str]] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Config":
        """Maak Config instantie van dictionary."""
        config = cls()

        # Analyse settings
        if "analyse" in data:
            analyse_data = data["analyse"]
            config.analyse = AnalyseSettings(
                horizon_jaren=analyse_data.get("horizon_jaren", 60),
                inflatie_percentage=analyse_data.get("inflatie_percentage", 2.0),
                start_jaar=analyse_data.get("start_jaar", 2024),
            )

        # Drempel settings
        if "drempels" in data:
            drempel_data = data["drempels"]
            config.drempels = DrempelSettings(
                prijs_afwijking_percentage=drempel_data.get(
                    "prijs_afwijking_percentage", 15.0
                ),
                cyclus_afwijking_jaren=drempel_data.get("cyclus_afwijking_jaren", 3),
                hoeveelheid_afwijking_percentage=drempel_data.get(
                    "hoeveelheid_afwijking_percentage", 20.0
                ),
                match_confidence_minimum=drempel_data.get(
                    "match_confidence_minimum", 0.6
                ),
            )

        # Output settings
        if "output" in data:
            output_data = data.get("output", {})
            excel_data = output_data.get("excel", {})
            html_data = output_data.get("html", {})
            config.output = OutputSettings(
                excel_max_rijen=excel_data.get("max_rijen_per_tab", 100000),
                excel_auto_breedte=excel_data.get("auto_kolom_breedte", True),
                excel_kleur_afwijkingen=excel_data.get("kleur_afwijkingen", True),
                html_include_grafieken=html_data.get("include_grafieken", True),
            )

        # Mappings en classificaties
        config.kolom_mappings = data.get("kolom_mappings", {})
        config.bouwdeel_classificatie = data.get("bouwdeel_classificatie", {})
        config.activiteit_classificatie = data.get("activiteit_classificatie", {})

        return config

    def get_kolom_mapping(self, systeem_type: str) -> dict[str, str]:
        """
        Haal kolom mapping op voor een specifiek systeemtype.

        Args:
            systeem_type: Naam van het systeem (vastware, plato, etc.)

        Returns:
            Dictionary met kolom mappings
        """
        systeem_lower = systeem_type.lower()
        if systeem_lower in self.kolom_mappings:
            return self.kolom_mappings[systeem_lower]

        logger.warning(f"Geen kolom mapping gevonden voor systeem: {systeem_type}")
        return {}


def load_config(config_path: Optional[Path] = None) -> Config:
    """
    Laad configuratie uit YAML bestand.

    Laadt eerst de defaults en overschrijft met custom config indien aanwezig.

    Args:
        config_path: Optioneel pad naar custom configuratie

    Returns:
        Config instantie
    """
    # Laad defaults
    logger.debug(f"Laden default configuratie: {DEFAULT_CONFIG_PATH}")
    with open(DEFAULT_CONFIG_PATH, "r", encoding="utf-8") as f:
        config_data = yaml.safe_load(f)

    # Overschrijf met custom config indien aanwezig
    if config_path and config_path.exists():
        logger.info(f"Laden custom configuratie: {config_path}")
        with open(config_path, "r", encoding="utf-8") as f:
            custom_data = yaml.safe_load(f)

        # Deep merge custom data into config_data
        config_data = _deep_merge(config_data, custom_data)

    return Config.from_dict(config_data)


def _deep_merge(base: dict, override: dict) -> dict:
    """
    Voeg twee dictionaries diep samen.

    Args:
        base: Basis dictionary
        override: Dictionary met overschrijvende waarden

    Returns:
        Samengevoegde dictionary
    """
    result = base.copy()

    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value

    return result
