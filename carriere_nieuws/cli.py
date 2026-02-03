"""
CLI interface voor Aedes Carrière Nieuws Monitor.

Gebruik: carriere-nieuws --help
"""

import logging
import sys
import time
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.logging import RichHandler

from . import __version__
from .config import (
    AppConfig,
    create_example_config,
    load_config,
    validate_config,
    DEFAULT_CONFIG_PATH,
)
from .email_sender import EmailSender
from .scraper import AedesCarriereScraper

app = typer.Typer(
    name="carriere-nieuws",
    help="Monitor Aedes carrière nieuws en verstuur email alerts.",
    add_completion=False,
)
console = Console()


def setup_logging(level: str = "INFO") -> None:
    """Configureer logging met Rich handler."""
    logging.basicConfig(
        level=level,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )


@app.command()
def check(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Pad naar configuratiebestand"
    ),
    send_email: bool = typer.Option(
        True, "--email/--no-email", help="Verstuur email notificaties"
    ),
    show_all: bool = typer.Option(
        False, "--all", "-a", help="Toon alle items, niet alleen nieuwe"
    ),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Verbose output"
    ),
) -> None:
    """
    Check op nieuw carrière nieuws en verstuur optioneel email.

    Dit is het hoofdcommando voor het controleren op nieuw nieuws.
    """
    # Laad configuratie
    config = load_config(config_file)
    setup_logging("DEBUG" if verbose else config.log_level)
    logger = logging.getLogger(__name__)

    console.print("\n[bold blue]🏠 Aedes Carrière Nieuws Monitor[/bold blue]\n")

    # Valideer configuratie als we email willen versturen
    if send_email:
        errors = validate_config(config)
        if errors:
            console.print("[yellow]⚠️  Configuratie problemen:[/yellow]")
            for error in errors:
                console.print(f"   • {error}")
            console.print("\n[dim]Email verzending uitgeschakeld. Gebruik --no-email om zonder email te draaien.[/dim]")
            send_email = False

    # Initialiseer scraper
    try:
        scraper = AedesCarriereScraper(cache_file=config.cache_file)
    except Exception as e:
        console.print(f"[red]❌ Fout bij initialiseren scraper: {e}[/red]")
        raise typer.Exit(1)

    # Haal nieuws op
    console.print("[dim]Ophalen van carrière nieuws...[/dim]")
    try:
        if show_all:
            items = scraper.get_all_items()
            console.print(f"\n[green]✓ {len(items)} carrière nieuws items gevonden[/green]\n")
        else:
            items = scraper.get_new_items()
            if items:
                console.print(f"\n[green]✓ {len(items)} nieuwe items gevonden![/green]\n")
            else:
                console.print("\n[dim]Geen nieuwe items gevonden.[/dim]\n")
    except Exception as e:
        console.print(f"[red]❌ Fout bij ophalen nieuws: {e}[/red]")
        logger.exception("Scraper fout")
        raise typer.Exit(1)

    # Toon items in tabel
    if items:
        table = Table(title="Carrière Nieuws", show_lines=True)
        table.add_column("Titel", style="cyan", max_width=50)
        table.add_column("Datum", style="green", max_width=15)
        table.add_column("URL", style="blue", max_width=40)

        for item in items:
            table.add_row(
                item.titel[:50] + "..." if len(item.titel) > 50 else item.titel,
                item.datum or "-",
                item.url[:40] + "..." if len(item.url) > 40 else item.url,
            )

        console.print(table)

    # Verstuur email als er nieuwe items zijn
    if send_email and items and not show_all:
        console.print("\n[dim]Versturen van email notificaties...[/dim]")
        try:
            sender = EmailSender(config.email)
            success = sender.send_notification(config.recipients, items)
            if success:
                console.print(f"[green]✓ Email verstuurd naar {len(config.recipients)} ontvanger(s)[/green]")
                for recipient in config.recipients:
                    console.print(f"   • {recipient}")
            else:
                console.print("[red]❌ Email verzending mislukt[/red]")
        except Exception as e:
            console.print(f"[red]❌ Fout bij versturen email: {e}[/red]")
            logger.exception("Email fout")


@app.command()
def watch(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Pad naar configuratiebestand"
    ),
    interval: Optional[int] = typer.Option(
        None, "--interval", "-i", help="Check interval in minuten"
    ),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Verbose output"
    ),
) -> None:
    """
    Draai continu en check periodiek op nieuw nieuws.

    Dit commando blijft draaien en checkt op vaste intervallen.
    Gebruik Ctrl+C om te stoppen.
    """
    config = load_config(config_file)
    setup_logging("DEBUG" if verbose else config.log_level)
    logger = logging.getLogger(__name__)

    check_interval = interval or config.check_interval_minutes

    # Valideer configuratie
    errors = validate_config(config)
    if errors:
        console.print("[red]❌ Configuratie problemen:[/red]")
        for error in errors:
            console.print(f"   • {error}")
        raise typer.Exit(1)

    console.print(f"\n[bold blue]🏠 Aedes Carrière Nieuws Monitor - Watch Mode[/bold blue]")
    console.print(f"[dim]Check interval: {check_interval} minuten[/dim]")
    console.print(f"[dim]Ontvangers: {', '.join(config.recipients)}[/dim]")
    console.print("[dim]Druk Ctrl+C om te stoppen[/dim]\n")

    scraper = AedesCarriereScraper(cache_file=config.cache_file)
    sender = EmailSender(config.email)

    try:
        while True:
            console.print(f"[dim][{time.strftime('%H:%M:%S')}] Controleren op nieuw nieuws...[/dim]")

            try:
                items = scraper.get_new_items()

                if items:
                    console.print(f"[green]✓ {len(items)} nieuwe items gevonden![/green]")
                    for item in items:
                        console.print(f"   • {item.titel}")

                    success = sender.send_notification(config.recipients, items)
                    if success:
                        console.print(f"[green]✓ Email verstuurd[/green]")
                    else:
                        console.print("[yellow]⚠️  Email verzending mislukt[/yellow]")
                else:
                    console.print("[dim]Geen nieuwe items[/dim]")

            except Exception as e:
                console.print(f"[red]❌ Fout: {e}[/red]")
                logger.exception("Check fout")

            # Wacht tot volgende check
            console.print(f"[dim]Volgende check over {check_interval} minuten...[/dim]\n")
            time.sleep(check_interval * 60)

    except KeyboardInterrupt:
        console.print("\n[yellow]Gestopt door gebruiker[/yellow]")


@app.command()
def init(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Pad voor configuratiebestand"
    ),
    force: bool = typer.Option(
        False, "--force", "-f", help="Overschrijf bestaand bestand"
    ),
) -> None:
    """
    Maak een voorbeeld configuratiebestand aan.

    Dit creëert een config.yaml met alle beschikbare opties.
    """
    config_path = config_file or DEFAULT_CONFIG_PATH

    if config_path.exists() and not force:
        console.print(f"[yellow]⚠️  Configuratiebestand bestaat al: {config_path}[/yellow]")
        console.print("[dim]Gebruik --force om te overschrijven[/dim]")
        raise typer.Exit(1)

    try:
        created_path = create_example_config(config_path)
        console.print(f"[green]✓ Configuratiebestand aangemaakt: {created_path}[/green]")
        console.print("\n[dim]Bewerk dit bestand om je SMTP en email instellingen toe te voegen.[/dim]")
    except Exception as e:
        console.print(f"[red]❌ Fout bij aanmaken configuratie: {e}[/red]")
        raise typer.Exit(1)


@app.command()
def test_email(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Pad naar configuratiebestand"
    ),
    recipient: Optional[str] = typer.Option(
        None, "--to", "-t", help="Test ontvanger email adres"
    ),
) -> None:
    """
    Test de email configuratie door een testbericht te versturen.
    """
    config = load_config(config_file)
    setup_logging(config.log_level)

    errors = validate_config(config)
    if errors:
        console.print("[red]❌ Configuratie problemen:[/red]")
        for error in errors:
            console.print(f"   • {error}")
        raise typer.Exit(1)

    # Bepaal ontvangers
    test_recipients = [recipient] if recipient else config.recipients[:1]

    console.print("\n[bold blue]🔧 Email Test[/bold blue]\n")
    console.print(f"[dim]SMTP Server: {config.email.smtp_server}:{config.email.smtp_port}[/dim]")
    console.print(f"[dim]Afzender: {config.email.sender_email}[/dim]")
    console.print(f"[dim]Ontvanger: {test_recipients[0]}[/dim]")

    sender = EmailSender(config.email)

    # Test verbinding
    console.print("\n[dim]Testen SMTP verbinding...[/dim]")
    if sender.test_connection():
        console.print("[green]✓ SMTP verbinding OK[/green]")
    else:
        console.print("[red]❌ SMTP verbinding mislukt[/red]")
        raise typer.Exit(1)

    # Verstuur test email
    console.print("\n[dim]Versturen test email...[/dim]")

    from .scraper import CarriereNieuwsItem
    test_item = CarriereNieuwsItem(
        titel="Test Bericht - Carrière Nieuws Monitor",
        url="https://aedes.nl/vereniging/carrierenieuws",
        datum=time.strftime("%d-%m-%Y"),
        beschrijving="Dit is een testbericht om te controleren of de email configuratie correct werkt.",
    )

    success = sender.send_notification(
        test_recipients,
        [test_item],
        subject="[TEST] Aedes Carrière Nieuws Monitor"
    )

    if success:
        console.print(f"[green]✓ Test email verstuurd naar {test_recipients[0]}[/green]")
    else:
        console.print("[red]❌ Test email versturen mislukt[/red]")
        raise typer.Exit(1)


@app.command()
def reset_cache(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Pad naar configuratiebestand"
    ),
    confirm: bool = typer.Option(
        False, "--yes", "-y", help="Bevestig zonder prompt"
    ),
) -> None:
    """
    Wis de cache van bekende nieuws items.

    Na het wissen worden alle items als 'nieuw' beschouwd.
    """
    config = load_config(config_file)

    if not confirm:
        confirm = typer.confirm("Weet je zeker dat je de cache wilt wissen?")

    if confirm:
        scraper = AedesCarriereScraper(cache_file=config.cache_file)
        scraper.reset_cache()
        console.print("[green]✓ Cache gewist[/green]")
    else:
        console.print("[dim]Geannuleerd[/dim]")


@app.command()
def version() -> None:
    """Toon de versie informatie."""
    console.print(f"Aedes Carrière Nieuws Monitor v{__version__}")


def main() -> None:
    """Entry point voor de CLI."""
    app()


if __name__ == "__main__":
    main()
