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

    # Provider type (sendgrid, mailgun, of smtp)
    provider = os.getenv("EMAIL_PROVIDER", email_data.get("provider", "smtp")).lower()

    # API key (voor SendGrid/Mailgun)
    api_key = os.getenv("EMAIL_API_KEY", email_data.get("api_key", ""))

    # Mailgun domain
    mailgun_domain = os.getenv("MAILGUN_DOMAIN", email_data.get("mailgun_domain", ""))

    # SMTP instellingen (fallback)
    smtp_server = os.getenv("SMTP_SERVER", email_data.get("smtp_server", ""))
    smtp_port = int(os.getenv("SMTP_PORT", email_data.get("smtp_port", 587)))
    smtp_username = os.getenv("SMTP_USERNAME", email_data.get("username", ""))
    smtp_password = os.getenv("SMTP_PASSWORD", email_data.get("password", ""))
    use_tls = os.getenv("SMTP_USE_TLS", str(email_data.get("use_tls", True))).lower() == "true"
    use_ssl = os.getenv("SMTP_USE_SSL", str(email_data.get("use_ssl", False))).lower() == "true"

    # Algemene email instellingen
    sender_email = os.getenv("SENDER_EMAIL", email_data.get("sender_email", ""))
    sender_name = os.getenv("SENDER_NAME", email_data.get("sender_name", "Aedes Carrière Nieuws Monitor"))

    # Check of we genoeg info hebben voor de gekozen provider
    has_valid_config = False

    if provider == "sendgrid" and api_key and sender_email:
        has_valid_config = True
    elif provider == "mailgun" and api_key and mailgun_domain and sender_email:
        has_valid_config = True
    elif provider == "smtp" and smtp_server and smtp_username and smtp_password and sender_email:
        has_valid_config = True

    if has_valid_config:
        email_config = EmailConfig(
            provider=provider,
            api_key=api_key,
            mailgun_domain=mailgun_domain,
            smtp_server=smtp_server,
            smtp_port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            use_tls=use_tls,
            use_ssl=use_ssl,
            sender_email=sender_email,
            sender_name=sender_name,
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
    """Maak een voorbeeld configuratiebestand."""
    config_path = config_path or DEFAULT_CONFIG_PATH

    example_config = """# Aedes Carrière Nieuws Monitor Configuratie
# ==========================================

# Kies je email provider: "sendgrid", "mailgun", of "smtp"
# SendGrid en Mailgun zijn gratis services, geen eigen email nodig!

email:
  # =====================================================
  # OPTIE 1: SendGrid (AANBEVOLEN - gratis 100 emails/dag)
  # =====================================================
  # 1. Ga naar https://sendgrid.com en maak gratis account
  # 2. Maak een API key aan
  # 3. Vul onderstaande in:

  # provider: "sendgrid"
  # api_key: "SG.xxxxxxxxxxxxxxxxxxxx"
  # sender_email: "nieuws@jouwdomein.nl"  # Of sendgrid verified email
  # sender_name: "Aedes Carrière Nieuws"

  # =====================================================
  # OPTIE 2: Mailgun (gratis tier beschikbaar)
  # =====================================================
  # 1. Ga naar https://mailgun.com en maak account
  # 2. Voeg je domein toe of gebruik sandbox domein
  # 3. Vul onderstaande in:

  # provider: "mailgun"
  # api_key: "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  # mailgun_domain: "mg.jouwdomein.nl"  # Of sandbox domein
  # sender_email: "nieuws@mg.jouwdomein.nl"
  # sender_name: "Aedes Carrière Nieuws"

  # =====================================================
  # OPTIE 3: SMTP (Gmail, Outlook, eigen server)
  # =====================================================
  # Gebruik je eigen email account

  provider: "smtp"
  smtp_server: "smtp.gmail.com"
  smtp_port: 587
  username: "jouw.email@gmail.com"
  password: "jouw-app-wachtwoord"
  sender_email: "jouw.email@gmail.com"
  sender_name: "Aedes Carrière Nieuws Monitor"
  use_tls: true
  use_ssl: false

# Ontvangers (wie krijgt de emails?)
recipients:
  - "ontvanger1@example.com"
  - "ontvanger2@example.com"

# Overige instellingen
cache_file: "~/.carriere_nieuws/cache.json"
log_level: "INFO"
check_interval_minutes: 1440  # 24 uur

# =====================================================
# Environment Variables (alternatief voor config file)
# =====================================================
# EMAIL_PROVIDER=sendgrid|mailgun|smtp
# EMAIL_API_KEY=xxx (voor sendgrid/mailgun)
# MAILGUN_DOMAIN=xxx (voor mailgun)
# SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD (voor smtp)
# SENDER_EMAIL, SENDER_NAME
# RECIPIENTS=email1@x.com,email2@x.com
"""

    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w") as f:
        f.write(example_config)

    logger.info(f"Voorbeeld configuratie aangemaakt: {config_path}")
    return config_path


def validate_config(config: AppConfig) -> list[str]:
    """Valideer de configuratie en geef een lijst van problemen."""
    errors = []

    if not config.email:
        errors.append("Email configuratie ontbreekt")
    else:
        provider = config.email.provider.lower()

        if provider == "sendgrid":
            if not config.email.api_key:
                errors.append("SendGrid API key niet geconfigureerd")
            if not config.email.sender_email:
                errors.append("Sender email niet geconfigureerd")

        elif provider == "mailgun":
            if not config.email.api_key:
                errors.append("Mailgun API key niet geconfigureerd")
            if not config.email.mailgun_domain:
                errors.append("Mailgun domain niet geconfigureerd")
            if not config.email.sender_email:
                errors.append("Sender email niet geconfigureerd")

        else:  # smtp
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
