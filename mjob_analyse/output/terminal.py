"""Terminal output module voor overzichtelijke console rapportage."""

from typing import Any, Optional
import sys

from ..utils.logging import get_logger

logger = get_logger("output.terminal")


class TerminalOutput:
    """
    Genereert overzichtelijke terminal output voor analyseresultaten.

    Gebruikt kleuren en formatting voor leesbaarheid.
    """

    # ANSI kleurcodes
    COLORS = {
        "reset": "\033[0m",
        "bold": "\033[1m",
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "magenta": "\033[95m",
        "cyan": "\033[96m",
    }

    def __init__(self, use_colors: bool = True):
        """
        Initialiseer terminal output.

        Args:
            use_colors: Gebruik ANSI kleuren
        """
        self.use_colors = use_colors and sys.stdout.isatty()

    def _color(self, text: str, color: str) -> str:
        """Voeg kleur toe aan tekst."""
        if not self.use_colors:
            return text
        return f"{self.COLORS.get(color, '')}{text}{self.COLORS['reset']}"

    def _bold(self, text: str) -> str:
        """Maak tekst bold."""
        return self._color(text, "bold")

    def print_header(self, title: str) -> None:
        """Print een header sectie."""
        width = 60
        print()
        print(self._bold("=" * width))
        print(self._bold(f"  {title.upper()}"))
        print(self._bold("=" * width))
        print()

    def print_subheader(self, title: str) -> None:
        """Print een subheader."""
        print()
        print(self._color(f"── {title} ──", "cyan"))
        print()

    def print_key_value(
        self, key: str, value: Any, indent: int = 0, highlight: bool = False
    ) -> None:
        """Print een key-value paar."""
        prefix = "  " * indent
        formatted_value = self._format_value(value)

        if highlight:
            formatted_value = self._color(formatted_value, "yellow")

        print(f"{prefix}{key}: {formatted_value}")

    def _format_value(self, value: Any) -> str:
        """Formatteer een waarde voor weergave."""
        if isinstance(value, float):
            if abs(value) >= 1000:
                return f"€{value:,.0f}"
            return f"{value:.2f}"
        if isinstance(value, int):
            if abs(value) >= 1000:
                return f"{value:,}"
            return str(value)
        return str(value)

    def print_comparison_table(
        self,
        items: list[dict],
        columns: list[tuple[str, str]],
        title: Optional[str] = None,
    ) -> None:
        """
        Print een vergelijkingstabel.

        Args:
            items: Lijst met dictionaries
            columns: Lijst van (key, header) tuples
            title: Optionele titel
        """
        if title:
            self.print_subheader(title)

        if not items:
            print("  Geen data beschikbaar")
            return

        # Bepaal kolombreedtes
        widths = {}
        for key, header in columns:
            widths[key] = max(
                len(header),
                max(len(str(item.get(key, ""))[:30]) for item in items),
            )

        # Print header
        header_row = " │ ".join(
            header.ljust(widths[key]) for key, header in columns
        )
        print(f"  {self._bold(header_row)}")
        print(f"  {'─' * len(header_row)}")

        # Print rijen
        for item in items[:15]:  # Max 15 rijen
            row = " │ ".join(
                str(item.get(key, ""))[:30].ljust(widths[key])
                for key, _ in columns
            )
            print(f"  {row}")

        if len(items) > 15:
            print(f"  ... en {len(items) - 15} meer")

    def print_progress_bar(
        self, current: int, total: int, label: str = "", width: int = 40
    ) -> None:
        """Print een voortgangsbalk."""
        if total == 0:
            return

        percentage = current / total
        filled = int(width * percentage)
        bar = "█" * filled + "░" * (width - filled)

        print(f"\r  {label} [{bar}] {percentage:.0%}", end="", flush=True)

        if current == total:
            print()

    def print_summary(self, analysis_results: dict) -> None:
        """
        Print een complete samenvatting van alle analyses.

        Args:
            analysis_results: Dictionary met alle analyseresultaten
        """
        self.print_header("MJOB Analyse Samenvatting")

        # Match kwaliteit
        if "match_quality" in analysis_results:
            mq = analysis_results["match_quality"]
            self.print_subheader("Match Kwaliteit")
            self.print_key_value("Totaal matches", mq.get("totaal_matches", 0))
            self.print_key_value(
                "Gemiddelde confidence",
                f"{mq.get('gemiddelde_confidence', 0):.0%}",
            )
            self.print_key_value("Exacte matches", mq.get("exact_matches", 0))
            self.print_key_value("Fuzzy matches", mq.get("fuzzy_matches", 0))

        # Prijs analyse
        if "prijs" in analysis_results:
            prijs = analysis_results["prijs"]
            self.print_subheader("Prijsanalyse")
            stats = prijs.get("statistieken", {})
            self.print_key_value(
                "Vergeleken", f"{stats.get('aantal_vergelijkingen', 0)} ingrepen"
            )
            self.print_key_value(
                "Uitschieters (>15%)",
                stats.get("aantal_uitschieters", 0),
                highlight=stats.get("aantal_uitschieters", 0) > 0,
            )
            self.print_key_value(
                "Gem. prijsverschil",
                f"{stats.get('gemiddeld_verschil_percentage', 0):+.1f}%",
            )

        # Cyclus analyse
        if "cyclus" in analysis_results:
            cyclus = analysis_results["cyclus"]
            self.print_subheader("Cyclusanalyse")
            stats = cyclus.get("statistieken", {})
            self.print_key_value(
                "Sterke afwijkingen",
                stats.get("aantal_afwijkingen", 0),
                highlight=stats.get("aantal_afwijkingen", 0) > 0,
            )
            self.print_key_value(
                "Financieel effect",
                stats.get("totaal_financieel_effect", 0),
            )

        # Compleetheid
        if "compleetheid" in analysis_results:
            compl = analysis_results["compleetheid"]
            self.print_subheader("Compleetheidsanalyse")
            stats = compl.get("statistieken", {})
            for key, value in stats.items():
                if "ongematchd" in key:
                    self.print_key_value(
                        key.replace("_", " ").title(),
                        value,
                        highlight=value > 0,
                    )

        # Financieel
        if "financieel" in analysis_results:
            fin = analysis_results["financieel"]
            self.print_subheader("Financiële Analyse")

            for key, value in fin.items():
                if key.startswith("totaal_") and isinstance(value, dict):
                    naam = value.get("naam", key)
                    self.print_key_value(
                        f"Totaal {naam}",
                        value.get("totaal_over_horizon", 0),
                    )

            if "verschil_totaal" in fin:
                verschil = fin["verschil_totaal"]
                self.print_key_value(
                    "Verschil",
                    f"€{verschil.get('absoluut', 0):,.0f} "
                    f"({verschil.get('percentage', 0):+.1f}%)",
                    highlight=True,
                )

        # Actiepunten
        self._print_action_items(analysis_results)

    def _print_action_items(self, analysis_results: dict) -> None:
        """Print actiepunten op basis van de analyses."""
        self.print_subheader("Actiepunten")

        items = []

        # Prijs actiepunten
        if "prijs" in analysis_results:
            prijs = analysis_results["prijs"]
            top = prijs.get("top_afwijkingen", [])
            if top:
                items.append(
                    f"⚠ Controleer {len(top)} sterke prijsafwijkingen, "
                    f"grootste: {top[0].get('verschil_percentage', 0):+.1f}%"
                )

        # Cyclus actiepunten
        if "cyclus" in analysis_results:
            cyclus = analysis_results["cyclus"]
            stats = cyclus.get("statistieken", {})
            effect = stats.get("totaal_financieel_effect", 0)
            if abs(effect) > 10000:
                items.append(
                    f"⚠ Cyclusverschillen leiden tot €{effect:,.0f} "
                    f"verschil over {stats.get('horizon_jaren', 60)} jaar"
                )

        # Compleetheid actiepunten
        if "compleetheid" in analysis_results:
            compl = analysis_results["compleetheid"]
            for key, gaps in compl.items():
                if key.startswith("kritische_gaps") and gaps:
                    systeem = key.replace("kritische_gaps_", "")
                    total_gaps = sum(len(v) for v in gaps.values())
                    items.append(
                        f"⚠ {total_gaps} kritische ingrepen ontbreken in {systeem}"
                    )

        if items:
            for item in items[:10]:
                print(f"  {self._color(item, 'yellow')}")
        else:
            print(f"  {self._color('✓ Geen kritische actiepunten geïdentificeerd', 'green')}")

        print()

    def print_error(self, message: str) -> None:
        """Print een foutmelding."""
        print(f"\n  {self._color('FOUT:', 'red')} {message}\n")

    def print_warning(self, message: str) -> None:
        """Print een waarschuwing."""
        print(f"  {self._color('WAARSCHUWING:', 'yellow')} {message}")

    def print_success(self, message: str) -> None:
        """Print een succesmelding."""
        print(f"  {self._color('✓', 'green')} {message}")

    def print_info(self, message: str) -> None:
        """Print informatieve tekst."""
        print(f"  {self._color('ℹ', 'blue')} {message}")
