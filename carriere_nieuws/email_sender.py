"""
Email verzending module voor Carrière Nieuws alerts.

Ondersteunt SMTP verzending naar meerdere ontvangers.
"""

import logging
import smtplib
import ssl
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from .scraper import CarriereNieuwsItem

logger = logging.getLogger(__name__)


@dataclass
class EmailConfig:
    """Configuratie voor email verzending."""

    smtp_server: str
    smtp_port: int
    username: str
    password: str
    sender_email: str
    sender_name: str = "Aedes Carrière Nieuws Monitor"
    use_tls: bool = True
    use_ssl: bool = False


class EmailSender:
    """Verstuurt email notificaties voor carrière nieuws."""

    def __init__(self, config: EmailConfig):
        """
        Initialiseer de email sender.

        Args:
            config: Email configuratie.
        """
        self.config = config

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
        """
        Verstuur een email notificatie naar meerdere ontvangers.

        Args:
            recipients: Lijst van email adressen.
            items: Lijst van nieuws items om te versturen.
            subject: Optioneel onderwerp (standaard wordt gegenereerd).

        Returns:
            True als alle emails succesvol zijn verstuurd.
        """
        if not items:
            logger.info("Geen items om te versturen")
            return True

        if not recipients:
            logger.warning("Geen ontvangers opgegeven")
            return False

        if subject is None:
            subject = f"[Aedes Carrière Nieuws] {len(items)} nieuw{'e' if len(items) != 1 else ''} bericht{'en' if len(items) != 1 else ''}"

        # Maak email bericht
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.config.sender_name} <{self.config.sender_email}>"
        msg["To"] = ", ".join(recipients)

        # Voeg plain en HTML versies toe
        plain_content = self._create_plain_content(items)
        html_content = self._create_html_content(items)

        msg.attach(MIMEText(plain_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Verstuur email
        try:
            if self.config.use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(
                    self.config.smtp_server,
                    self.config.smtp_port,
                    context=context
                ) as server:
                    server.login(self.config.username, self.config.password)
                    server.sendmail(
                        self.config.sender_email,
                        recipients,
                        msg.as_string()
                    )
            else:
                with smtplib.SMTP(
                    self.config.smtp_server,
                    self.config.smtp_port
                ) as server:
                    if self.config.use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    server.login(self.config.username, self.config.password)
                    server.sendmail(
                        self.config.sender_email,
                        recipients,
                        msg.as_string()
                    )

            logger.info(f"Email verstuurd naar {len(recipients)} ontvanger(s)")
            return True

        except smtplib.SMTPException as e:
            logger.error(f"SMTP fout bij versturen email: {e}")
            return False
        except Exception as e:
            logger.error(f"Onverwachte fout bij versturen email: {e}")
            return False

    def test_connection(self) -> bool:
        """
        Test de SMTP verbinding.

        Returns:
            True als de verbinding succesvol is.
        """
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
