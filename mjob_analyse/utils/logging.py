"""Logging configuratie voor MJOB Analyse."""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logging(
    level: str = "INFO",
    log_file: Optional[Path] = None,
    verbose: bool = False
) -> None:
    """
    Configureer logging voor de applicatie.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR)
        log_file: Optioneel pad naar logbestand
        verbose: Extra verbose output naar console
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Basis format
    console_format = "%(message)s"
    file_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    if verbose:
        console_format = "%(levelname)s: %(message)s"

    # Root logger configureren
    root_logger = logging.getLogger("mjob_analyse")
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(console_format))
    root_logger.addHandler(console_handler)

    # File handler (optioneel)
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter(file_format))
        root_logger.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """
    Krijg een logger instance voor een module.

    Args:
        name: Naam van de module

    Returns:
        Logger instance
    """
    return logging.getLogger(f"mjob_analyse.{name}")
