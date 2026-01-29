"""HTML rapport module voor visuele rapportage."""

from pathlib import Path
from typing import Any, Optional
from datetime import datetime

import pandas as pd

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("output.html")


class HtmlRapport:
    """
    Genereert een visueel HTML rapport met grafieken.

    Geschikt voor delen met klanten.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de HTML rapport generator.

        Args:
            config: Configuratie
        """
        self.config = config

    def generate(
        self,
        analysis_results: dict,
        output_path: Path,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
        titel: str = "MJOB Analyse Rapport",
    ) -> Path:
        """
        Genereer een HTML rapport.

        Args:
            analysis_results: Dictionary met analyseresultaten
            output_path: Pad voor output bestand
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem
            titel: Rapport titel

        Returns:
            Pad naar gegenereerd bestand
        """
        logger.info(f"Start HTML rapport generatie: {output_path}")

        html_content = self._build_html(analysis_results, name_a, name_b, titel)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        logger.info(f"HTML rapport gegenereerd: {output_path}")
        return output_path

    def _build_html(
        self, results: dict, name_a: str, name_b: str, titel: str
    ) -> str:
        """Bouw de volledige HTML content."""
        return f"""<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{titel}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        {self._get_css()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>{titel}</h1>
            <p class="subtitle">Vergelijking: {name_a} vs {name_b}</p>
            <p class="date">Gegenereerd: {datetime.now().strftime('%d-%m-%Y %H:%M')}</p>
        </header>

        {self._build_summary_section(results, name_a, name_b)}
        {self._build_financial_section(results, name_a, name_b)}
        {self._build_price_section(results, name_a, name_b)}
        {self._build_cycle_section(results, name_a, name_b)}
        {self._build_completeness_section(results, name_a, name_b)}
        {self._build_action_items(results, name_a, name_b)}

        <footer>
            <p>Rapport gegenereerd met MJOB Analyse Tool</p>
        </footer>
    </div>

    <script>
        {self._get_chart_js(results, name_a, name_b)}
    </script>
</body>
</html>"""

    def _get_css(self) -> str:
        """Retourneer CSS styling."""
        return """
        :root {
            --primary-color: #1F4E79;
            --secondary-color: #2E75B6;
            --success-color: #70AD47;
            --warning-color: #FFC000;
            --danger-color: #C00000;
            --light-bg: #F5F7FA;
            --border-color: #E0E0E0;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: var(--light-bg);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: var(--primary-color);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 20px;
        }

        h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .date {
            font-size: 0.9em;
            opacity: 0.7;
            margin-top: 10px;
        }

        section {
            background: white;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        h2 {
            color: var(--primary-color);
            border-bottom: 2px solid var(--secondary-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .metric-card {
            background: var(--light-bg);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }

        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: var(--primary-color);
        }

        .metric-label {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }

        .metric-card.warning .metric-value {
            color: var(--warning-color);
        }

        .metric-card.danger .metric-value {
            color: var(--danger-color);
        }

        .metric-card.success .metric-value {
            color: var(--success-color);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        th {
            background: var(--primary-color);
            color: white;
        }

        tr:hover {
            background: var(--light-bg);
        }

        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }

        .action-item {
            display: flex;
            align-items: flex-start;
            padding: 15px;
            background: #FFF3CD;
            border-left: 4px solid var(--warning-color);
            margin-bottom: 10px;
            border-radius: 0 4px 4px 0;
        }

        .action-item.critical {
            background: #F8D7DA;
            border-color: var(--danger-color);
        }

        .action-icon {
            font-size: 1.5em;
            margin-right: 15px;
        }

        footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
        }

        @media print {
            .container {
                max-width: none;
            }
            section {
                break-inside: avoid;
            }
        }
        """

    def _build_summary_section(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw samenvatting sectie."""
        html = '<section id="summary"><h2>Samenvatting</h2>'
        html += '<div class="metrics-grid">'

        # Match kwaliteit
        if "match_quality" in results:
            mq = results["match_quality"]
            html += self._metric_card(
                mq.get("totaal_matches", 0), "Gematchte Ingrepen"
            )
            conf = mq.get("gemiddelde_confidence", 0)
            html += self._metric_card(
                f"{conf:.0%}",
                "Match Confidence",
                "success" if conf >= 0.8 else "warning" if conf >= 0.6 else "danger",
            )

        # Financieel
        if "financieel" in results:
            fin = results["financieel"]
            if "verschil_totaal" in fin:
                verschil = fin["verschil_totaal"]
                html += self._metric_card(
                    f"€{verschil['absoluut']:,.0f}",
                    "Totaal Verschil",
                    "warning" if abs(verschil["absoluut"]) > 100000 else "",
                )

        # Uitschieters
        if "prijs" in results:
            prijs = results["prijs"]
            stats = prijs.get("statistieken", {})
            uitschieters = stats.get("aantal_uitschieters", 0)
            html += self._metric_card(
                uitschieters,
                "Prijsuitschieters",
                "warning" if uitschieters > 10 else "",
            )

        html += "</div></section>"
        return html

    def _build_financial_section(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw financiële sectie."""
        if "financieel" not in results:
            return ""

        fin = results["financieel"]
        html = '<section id="financial"><h2>Financiële Vergelijking</h2>'
        html += '<div class="metrics-grid">'

        for key in [f"totaal_{name_a}", f"totaal_{name_b}"]:
            if key in fin:
                totaal = fin[key]
                html += self._metric_card(
                    f"€{totaal.get('totaal_over_horizon', 0):,.0f}",
                    f"Totaal {totaal.get('naam', key)}",
                )

        html += "</div>"

        # Cashflow grafiek
        html += '<div class="chart-container"><canvas id="cashflowChart"></canvas></div>'

        # Breakdown tabel
        if f"breakdown_{name_a}" in fin:
            html += "<h3>Kosten per Bouwdeel</h3>"
            html += self._build_breakdown_table(fin, name_a, name_b)

        html += "</section>"
        return html

    def _build_price_section(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw prijsanalyse sectie."""
        if "prijs" not in results:
            return ""

        prijs = results["prijs"]
        html = '<section id="price"><h2>Prijsanalyse</h2>'

        stats = prijs.get("statistieken", {})
        html += '<div class="metrics-grid">'
        html += self._metric_card(
            stats.get("aantal_vergelijkingen", 0), "Vergeleken"
        )
        html += self._metric_card(
            f"{stats.get('gemiddeld_verschil_percentage', 0):+.1f}%",
            "Gem. Verschil",
        )
        html += self._metric_card(
            stats.get("aantal_uitschieters", 0),
            "Uitschieters (>15%)",
            "warning" if stats.get("aantal_uitschieters", 0) > 0 else "",
        )
        html += "</div>"

        # Top afwijkingen tabel
        top = prijs.get("top_afwijkingen", [])
        if top:
            html += "<h3>Top 10 Prijsafwijkingen</h3>"
            html += "<table><thead><tr>"
            html += "<th>Maatregel</th><th>Bouwdeel</th>"
            html += f"<th>Prijs {name_a}</th><th>Prijs {name_b}</th>"
            html += "<th>Verschil</th></tr></thead><tbody>"

            for item in top[:10]:
                verschil_class = (
                    "danger"
                    if abs(item.get("verschil_percentage", 0)) > 25
                    else "warning"
                )
                html += f"""<tr>
                    <td>{item.get('maatregel', '')[:50]}</td>
                    <td>{item.get('bouwdeel', '-')}</td>
                    <td>€{item.get('prijs_a', 0):,.2f}</td>
                    <td>€{item.get('prijs_b', 0):,.2f}</td>
                    <td class="{verschil_class}">{item.get('verschil_percentage', 0):+.1f}%</td>
                </tr>"""

            html += "</tbody></table>"

        html += "</section>"
        return html

    def _build_cycle_section(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw cyclusanalyse sectie."""
        if "cyclus" not in results:
            return ""

        cyclus = results["cyclus"]
        html = '<section id="cycle"><h2>Cyclusanalyse</h2>'

        stats = cyclus.get("statistieken", {})
        html += '<div class="metrics-grid">'
        html += self._metric_card(
            f"{stats.get('gemiddeld_verschil_jaren', 0):+.1f} jaar",
            "Gem. Cyclusverschil",
        )
        html += self._metric_card(
            f"€{stats.get('totaal_financieel_effect', 0):,.0f}",
            f"Effect over {stats.get('horizon_jaren', 60)} jaar",
            "warning" if abs(stats.get("totaal_financieel_effect", 0)) > 50000 else "",
        )
        html += "</div>"

        html += "</section>"
        return html

    def _build_completeness_section(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw completheidsanalyse sectie."""
        if "compleetheid" not in results:
            return ""

        compl = results["compleetheid"]
        html = '<section id="completeness"><h2>Compleetheidsanalyse</h2>'

        stats = compl.get("statistieken", {})
        html += '<div class="metrics-grid">'

        for key, value in stats.items():
            if "ongematchd" in key:
                label = key.replace("_", " ").title()
                html += self._metric_card(
                    value, label, "warning" if value > 0 else ""
                )

        html += "</div></section>"
        return html

    def _build_action_items(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw actiepunten sectie."""
        html = '<section id="actions"><h2>Actiepunten</h2>'

        items = []

        # Genereer actiepunten
        if "prijs" in results:
            prijs = results["prijs"]
            uitschieters = prijs.get("statistieken", {}).get("aantal_uitschieters", 0)
            if uitschieters > 0:
                items.append({
                    "icon": "⚠️",
                    "text": f"Controleer {uitschieters} prijsuitschieters op juistheid",
                    "critical": uitschieters > 20,
                })

        if "compleetheid" in results:
            for key, gaps in results["compleetheid"].items():
                if key.startswith("kritische_gaps") and gaps:
                    systeem = key.replace("kritische_gaps_", "")
                    total = sum(len(v) for v in gaps.values())
                    items.append({
                        "icon": "❗",
                        "text": f"{total} kritische ingrepen ontbreken in {systeem}",
                        "critical": True,
                    })

        if items:
            for item in items:
                critical_class = "critical" if item.get("critical") else ""
                html += f"""
                <div class="action-item {critical_class}">
                    <span class="action-icon">{item['icon']}</span>
                    <span>{item['text']}</span>
                </div>"""
        else:
            html += '<p>✅ Geen kritische actiepunten geïdentificeerd.</p>'

        html += "</section>"
        return html

    def _metric_card(
        self, value: Any, label: str, status: str = ""
    ) -> str:
        """Genereer een metric card."""
        return f"""
        <div class="metric-card {status}">
            <div class="metric-value">{value}</div>
            <div class="metric-label">{label}</div>
        </div>"""

    def _build_breakdown_table(
        self, fin: dict, name_a: str, name_b: str
    ) -> str:
        """Bouw breakdown tabel."""
        html = "<table><thead><tr>"
        html += f"<th>Bouwdeel</th><th>{name_a}</th><th>{name_b}</th><th>Verschil</th>"
        html += "</tr></thead><tbody>"

        bd_a = fin.get(f"breakdown_{name_a}", {})
        bd_b = fin.get(f"breakdown_{name_b}", {})

        all_bouwdelen = set(bd_a.keys()) | set(bd_b.keys())

        for bouwdeel in sorted(all_bouwdelen):
            val_a = bd_a.get(bouwdeel, {}).get("totaal_over_horizon", 0)
            val_b = bd_b.get(bouwdeel, {}).get("totaal_over_horizon", 0)
            verschil = val_a - val_b

            html += f"""<tr>
                <td>{bouwdeel}</td>
                <td>€{val_a:,.0f}</td>
                <td>€{val_b:,.0f}</td>
                <td>€{verschil:+,.0f}</td>
            </tr>"""

        html += "</tbody></table>"
        return html

    def _get_chart_js(
        self, results: dict, name_a: str, name_b: str
    ) -> str:
        """Genereer Chart.js code voor grafieken."""
        js = ""

        if "financieel" in results:
            fin = results["financieel"]
            cf = fin.get("cashflow_vergelijking")

            if cf is not None and not cf.empty:
                jaren = cf["Jaar"].tolist()
                kosten_a = cf.get(f"Kosten_{name_a}", []).tolist()
                kosten_b = cf.get(f"Kosten_{name_b}", []).tolist()

                js += f"""
                const ctx = document.getElementById('cashflowChart').getContext('2d');
                new Chart(ctx, {{
                    type: 'line',
                    data: {{
                        labels: {jaren},
                        datasets: [{{
                            label: '{name_a}',
                            data: {kosten_a},
                            borderColor: '#1F4E79',
                            backgroundColor: 'rgba(31, 78, 121, 0.1)',
                            fill: true
                        }}, {{
                            label: '{name_b}',
                            data: {kosten_b},
                            borderColor: '#70AD47',
                            backgroundColor: 'rgba(112, 173, 71, 0.1)',
                            fill: true
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {{
                            title: {{
                                display: true,
                                text: 'Jaarlijkse Cashflow Vergelijking'
                            }}
                        }},
                        scales: {{
                            y: {{
                                beginAtZero: true,
                                ticks: {{
                                    callback: function(value) {{
                                        return '€' + value.toLocaleString();
                                    }}
                                }}
                            }}
                        }}
                    }}
                }});
                """

        return js
