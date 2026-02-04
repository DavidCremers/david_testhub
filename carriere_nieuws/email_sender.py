"""
Email verzending module voor Carrière Nieuws alerts.

Ondersteunt meerdere email providers:
- SendGrid (gratis: 100 emails/dag)
- Mailgun (gratis tier beschikbaar)
- SMTP (Gmail, Outlook, eigen server)
"""

import logging
import smtplib
import ssl
from abc import ABC, abstractmethod
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import requests

from .scraper import CarriereNieuwsItem

logger = logging.getLogger(__name__)


@dataclass
class EmailConfig:
    """Configuratie voor email verzending."""

    # Provider: "sendgrid", "mailgun", of "smtp"
    provider: str = "smtp"

    # API key (voor SendGrid/Mailgun)
    api_key: str = ""

    # Mailgun specifiek
    mailgun_domain: str = ""

    # SMTP specifiek
    smtp_server: str = ""
    smtp_port: int = 587
    username: str = ""
    password: str = ""
    use_tls: bool = True
    use_ssl: bool = False

    # Algemeen
    sender_email: str = ""
    sender_name: str = "Aedes Carrière Nieuws Monitor"


class EmailProvider(ABC):
    """Abstract base class voor email providers."""

    @abstractmethod
    def send(self, to: list[str], subject: str, html: str, text: str) -> bool:
        """Verstuur email."""
        pass

    @abstractmethod
    def test_connection(self) -> bool:
        """Test de verbinding."""
        pass


class SendGridProvider(EmailProvider):
    """SendGrid email provider (gratis: 100 emails/dag)."""

    API_URL = "https://api.sendgrid.com/v3/mail/send"

    def __init__(self, api_key: str, sender_email: str, sender_name: str):
        self.api_key = api_key
        self.sender_email = sender_email
        self.sender_name = sender_name

    def send(self, to: list[str], subject: str, html: str, text: str) -> bool:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "personalizations": [{"to": [{"email": addr} for addr in to]}],
            "from": {"email": self.sender_email, "name": self.sender_name},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text},
                {"type": "text/html", "value": html},
            ],
        }

        try:
            response = requests.post(self.API_URL, headers=headers, json=data, timeout=30)
            if response.status_code in (200, 202):
                logger.info(f"SendGrid: Email verstuurd naar {len(to)} ontvanger(s)")
                return True
            else:
                logger.error(f"SendGrid fout: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"SendGrid fout: {e}")
            return False

    def test_connection(self) -> bool:
        """Test API key validiteit."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            # Check API key met scopes endpoint
            response = requests.get(
                "https://api.sendgrid.com/v3/scopes",
                headers=headers,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"SendGrid test mislukt: {e}")
            return False


class MailgunProvider(EmailProvider):
    """Mailgun email provider."""

    def __init__(self, api_key: str, domain: str, sender_email: str, sender_name: str):
        self.api_key = api_key
        self.domain = domain
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.api_url = f"https://api.mailgun.net/v3/{domain}/messages"

    def send(self, to: list[str], subject: str, html: str, text: str) -> bool:
        try:
            response = requests.post(
                self.api_url,
                auth=("api", self.api_key),
                data={
                    "from": f"{self.sender_name} <{self.sender_email}>",
                    "to": to,
                    "subject": subject,
                    "text": text,
                    "html": html,
                },
                timeout=30
            )
            if response.status_code == 200:
                logger.info(f"Mailgun: Email verstuurd naar {len(to)} ontvanger(s)")
                return True
            else:
                logger.error(f"Mailgun fout: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Mailgun fout: {e}")
            return False

    def test_connection(self) -> bool:
        """Test API key en domain."""
        try:
            response = requests.get(
                f"https://api.mailgun.net/v3/{self.domain}",
                auth=("api", self.api_key),
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Mailgun test mislukt: {e}")
            return False


class SMTPProvider(EmailProvider):
    """SMTP email provider (Gmail, Outlook, eigen server)."""

    def __init__(self, config: EmailConfig):
        self.config = config

    def send(self, to: list[str], subject: str, html: str, text: str) -> bool:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.config.sender_name} <{self.config.sender_email}>"
        msg["To"] = ", ".join(to)

        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

        try:
            if self.config.use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(
                    self.config.smtp_server,
                    self.config.smtp_port,
                    context=context
                ) as server:
                    server.login(self.config.username, self.config.password)
                    server.sendmail(self.config.sender_email, to, msg.as_string())
            else:
                with smtplib.SMTP(
                    self.config.smtp_server,
                    self.config.smtp_port
                ) as server:
                    if self.config.use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    server.login(self.config.username, self.config.password)
                    server.sendmail(self.config.sender_email, to, msg.as_string())

            logger.info(f"SMTP: Email verstuurd naar {len(to)} ontvanger(s)")
            return True
        except smtplib.SMTPException as e:
            logger.error(f"SMTP fout: {e}")
            return False
        except Exception as e:
            logger.error(f"SMTP fout: {e}")
            return False

    def test_connection(self) -> bool:
        try:
            if self.config.use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(
                    self.config.smtp_server,
                    self.config.smtp_port,
                    context=context
                ) as server:
                    server.login(self.config.username, self.config.password)
            else:
                with smtplib.SMTP(
                    self.config.smtp_server,
                    self.config.smtp_port
                ) as server:
                    if self.config.use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    server.login(self.config.username, self.config.password)

            logger.info("SMTP verbinding succesvol")
            return True
        except Exception as e:
            logger.error(f"SMTP verbinding mislukt: {e}")
            return False


def create_provider(config: EmailConfig) -> EmailProvider:
    """Factory functie om de juiste provider te maken."""
    provider = config.provider.lower()

    if provider == "sendgrid":
        return SendGridProvider(
            api_key=config.api_key,
            sender_email=config.sender_email,
            sender_name=config.sender_name,
        )
    elif provider == "mailgun":
        return MailgunProvider(
            api_key=config.api_key,
            domain=config.mailgun_domain,
            sender_email=config.sender_email,
            sender_name=config.sender_name,
        )
    else:  # smtp
        return SMTPProvider(config)


class EmailSender:
    """Verstuurt email notificaties voor carrière nieuws."""

    def __init__(self, config: EmailConfig):
        self.config = config
        self.provider = create_provider(config)

    def _create_html_content(self, items: list[CarriereNieuwsItem]) -> str:
        """Maak HTML content voor de email."""
        items_html = ""
        for item in items:
            items_html += f"""
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <a href="{item.url}" style="color: #0066cc; text-decoration: none;">{item.titel}</a>
                </h3>
                {f'<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Datum:</strong> {item.datum}</p>' if item.datum else ''}
                {f'<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Organisatie:</strong> {item.organisatie}</p>' if item.organisatie else ''}
                {f'<p style="margin: 10px 0; color: #444;">{item.beschrijving}</p>' if item.beschrijving else ''}
                <p style="margin: 10px 0 0 0;">
                    <a href="{item.url}" style="display: inline-block; padding: 8px 16px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
                        Lees meer →
                    </a>
                </p>
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🏠 Aedes Carrière Nieuws</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Nieuw carrière nieuws beschikbaar</p>
            </div>

            <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
                <p style="margin-bottom: 20px;">
                    Er {'is' if len(items) == 1 else 'zijn'} <strong>{len(items)}</strong> nieuw{'e' if len(items) != 1 else ''}
                    carrière bericht{'en' if len(items) != 1 else ''} gevonden op de Aedes website:
                </p>

                {items_html}
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">
                    Dit is een automatische notificatie van de Aedes Carrière Nieuws Monitor.<br>
                    <a href="https://aedes.nl/vereniging/carrierenieuws" style="color: #0066cc;">Bekijk alle carrière nieuws op Aedes.nl</a>
                </p>
            </div>
        </body>
        </html>
        """

    def _create_plain_content(self, items: list[CarriereNieuwsItem]) -> str:
        """Maak plain text content voor de email."""
        lines = [
            "AEDES CARRIÈRE NIEUWS",
            "=" * 40,
            "",
            f"Er {'is' if len(items) == 1 else 'zijn'} {len(items)} nieuw{'e' if len(items) != 1 else ''} "
            f"carrière bericht{'en' if len(items) != 1 else ''} gevonden:",
            "",
        ]

        for i, item in enumerate(items, 1):
            lines.append(f"{i}. {item.titel}")
            if item.datum:
                lines.append(f"   Datum: {item.datum}")
            if item.organisatie:
                lines.append(f"   Organisatie: {item.organisatie}")
            if item.beschrijving:
                lines.append(f"   {item.beschrijving[:200]}...")
            lines.append(f"   Link: {item.url}")
            lines.append("")

        lines.extend([
            "-" * 40,
            "Dit is een automatische notificatie van de Aedes Carrière Nieuws Monitor.",
            "Bekijk alle nieuws: https://aedes.nl/vereniging/carrierenieuws",
        ])

        return "\n".join(lines)

    def send_notification(
        self,
        recipients: list[str],
        items: list[CarriereNieuwsItem],
        subject: Optional[str] = None,
    ) -> bool:
        """Verstuur een email notificatie naar meerdere ontvangers."""
        if not items:
            logger.info("Geen items om te versturen")
            return True

        if not recipients:
            logger.warning("Geen ontvangers opgegeven")
            return False

        if subject is None:
            subject = f"[Aedes Carrière Nieuws] {len(items)} nieuw{'e' if len(items) != 1 else ''} bericht{'en' if len(items) != 1 else ''}"

        html_content = self._create_html_content(items)
        plain_content = self._create_plain_content(items)

        return self.provider.send(recipients, subject, html_content, plain_content)

    def test_connection(self) -> bool:
        """Test de email provider verbinding."""
        return self.provider.test_connection()
