"""
Configuratie management voor Carrière Nieuws Monitor.

Ondersteunt YAML configuratiebestanden en environment variables.
"""

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml

from .email_sender import EmailConfig

logger = logging.getLogger(__name__)

DEFAULT_CONFIG_PATH = Path.home() / ".carriere_nieuws" / "config.yaml"
DEFAULT_CACHE_PATH = Path.home() / ".carriere_nieuws" / "cache.json"


@dataclass
class AppConfig:
    """Volledige applicatie configuratie."""

    # Email configuratie
    email: Optional[EmailConfig] = None

    # Ontvangers
    recipients: list[str] = field(default_factory=list)

    # Cache locatie
    cache_file: Path = field(default_factory=lambda: DEFAULT_CACHE_PATH)

    # Logging niveau
    log_level: str = "INFO"

    # Check interval in minuten (voor scheduler) - standaard 1x per dag
    check_interval_minutes: int = 1440


def load_config(config_path: Optional[Path] = None) -> AppConfig:
    """
    Laad configuratie uit YAML bestand en/of environment variables.

    Environment variables hebben voorrang op YAML configuratie.

    Args:
        config_path: Pad naar configuratiebestand. Standaard ~/.carriere_nieuws/config.yaml

    Returns:
        AppConfig object met alle instellingen.
    """
    config_path = config_path or DEFAULT_CONFIG_PATH
    config_data = {}

    # Laad YAML configuratie indien aanwezig
    if config_path.exists():
        try:
            with open(config_path, "r") as f:
                config_data = yaml.safe_load(f) or {}
            logger.info(f"Configuratie geladen uit {config_path}")
        except yaml.YAMLError as e:
            logger.error(f"Fout bij laden configuratie: {e}")
            config_data = {}

    # Email configuratie
    email_config = None
    email_data = config_data.get("email", {})

    # Haal email instellingen uit environment of config
    smtp_server = os.getenv("SMTP_SERVER", email_data.get("smtp_server", ""))
    smtp_port = int(os.getenv("SMTP_PORT", email_data.get("smtp_port", 587)))
    smtp_username = os.getenv("SMTP_USERNAME", email_data.get("username", ""))
    smtp_password = os.getenv("SMTP_PASSWORD", email_data.get("password", ""))
    sender_email = os.getenv("SENDER_EMAIL", email_data.get("sender_email", ""))
    sender_name = os.getenv("SENDER_NAME", email_data.get("sender_name", "Aedes Carrière Nieuws Monitor"))
    use_tls = os.getenv("SMTP_USE_TLS", str(email_data.get("use_tls", True))).lower() == "true"
    use_ssl = os.getenv("SMTP_USE_SSL", str(email_data.get("use_ssl", False))).lower() == "true"

    if smtp_server and smtp_username and smtp_password and sender_email:
        email_config = EmailConfig(
            smtp_server=smtp_server,
            smtp_port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            sender_email=sender_email,
            sender_name=sender_name,
            use_tls=use_tls,
            use_ssl=use_ssl,
        )

    # Ontvangers uit environment of config
    recipients_env = os.getenv("RECIPIENTS", "")
    if recipients_env:
        recipients = [r.strip() for r in recipients_env.split(",") if r.strip()]
    else:
        recipients = config_data.get("recipients", [])

    # Cache bestand
    cache_file = Path(
        os.getenv("CACHE_FILE", str(config_data.get("cache_file", DEFAULT_CACHE_PATH)))
    )

    # Log niveau
    log_level = os.getenv("LOG_LEVEL", config_data.get("log_level", "INFO"))

    # Check interval (standaard 1440 = 24 uur)
    check_interval = int(
        os.getenv("CHECK_INTERVAL_MINUTES", config_data.get("check_interval_minutes", 1440))
    )

    return AppConfig(
        email=email_config,
        recipients=recipients,
        cache_file=cache_file,
        log_level=log_level,
        check_interval_minutes=check_interval,
    )


def create_example_config(config_path: Optional[Path] = None) -> Path:
    """
    Maak een voorbeeld configuratiebestand.

    Args:
        config_path: Pad waar het bestand aangemaakt moet worden.

    Returns:
        Pad naar het aangemaakte bestand.
    """
    config_path = config_path or DEFAULT_CONFIG_PATH

    example_config = """# Aedes Carrière Nieuws Monitor Configuratie
# ==========================================

# Email instellingen (SMTP)
email:
  # SMTP server (bijv. smtp.gmail.com, smtp.office365.com)
  smtp_server: "smtp.gmail.com"
  smtp_port: 587

  # Authenticatie
  username: "jouw.email@gmail.com"
  password: "jouw-app-wachtwoord"  # Gebruik app-specifiek wachtwoord voor Gmail

  # Afzender informatie
  sender_email: "jouw.email@gmail.com"
  sender_name: "Aedes Carrière Nieuws Monitor"

  # Beveiligingsopties
  use_tls: true   # STARTTLS (poort 587)
  use_ssl: false  # SSL/TLS (poort 465)

# Lijst van email adressen die notificaties ontvangen
recipients:
  - "ontvanger1@example.com"
  - "ontvanger2@example.com"
  - "team@example.com"

# Locatie van cache bestand (om duplicaten te voorkomen)
cache_file: "~/.carriere_nieuws/cache.json"

# Logging niveau (DEBUG, INFO, WARNING, ERROR)
log_level: "INFO"

# Interval voor automatische checks (in minuten, 1440 = 24 uur)
check_interval_minutes: 1440

# Environment variables die deze instellingen overschrijven:
# - SMTP_SERVER
# - SMTP_PORT
# - SMTP_USERNAME
# - SMTP_PASSWORD
# - SENDER_EMAIL
# - SENDER_NAME
# - SMTP_USE_TLS
# - SMTP_USE_SSL
# - RECIPIENTS (comma-separated)
# - CACHE_FILE
# - LOG_LEVEL
# - CHECK_INTERVAL_MINUTES
"""

    # Maak directory aan indien nodig
    config_path.parent.mkdir(parents=True, exist_ok=True)

    with open(config_path, "w") as f:
        f.write(example_config)

    logger.info(f"Voorbeeld configuratie aangemaakt: {config_path}")
    return config_path


def validate_config(config: AppConfig) -> list[str]:
    """
    Valideer de configuratie en geef een lijst van problemen.

    Args:
        config: Te valideren configuratie.

    Returns:
        Lijst van foutmeldingen (leeg als alles OK is).
    """
    errors = []

    if not config.email:
        errors.append("Email configuratie ontbreekt (SMTP instellingen)")
    else:
        if not config.email.smtp_server:
            errors.append("SMTP server niet geconfigureerd")
        if not config.email.username:
            errors.append("SMTP username niet geconfigureerd")
        if not config.email.password:
            errors.append("SMTP password niet geconfigureerd")
        if not config.email.sender_email:
            errors.append("Sender email niet geconfigureerd")

    if not config.recipients:
        errors.append("Geen ontvangers geconfigureerd")

    return errors
