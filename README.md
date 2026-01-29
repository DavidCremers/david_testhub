# MJOB Analyse Tool

Een Python CLI-tool voor het vergelijken van onderhoudsdata tussen twee MJOB/MJOP-systemen (zoals Plato, Vastware, Planon, O-Prognose, IBIS) voor woningcorporaties.

## Functionaliteit

### Data Inlezen
- Ondersteunt Excel (.xlsx) en CSV bestanden
- Automatische detectie van systeemtype (Vastware, Plato, O-Prognose, IBIS)
- Configureerbare kolom-mappings per systeem

### Ingreep Matching
- Automatische classificatie naar bouwdeel en activiteitstype
- Fuzzy text matching met confidence scores
- Exacte, fuzzy en classificatie-gebaseerde matching

### Analyses

| Analyse | Beschrijving |
|---------|-------------|
| **Prijsanalyse** | Vergelijk eenheidsprijzen, identificeer uitschieters (>15% afwijking) |
| **Cyclusanalyse** | Vergelijk onderhoudsfrequenties, bereken financieel effect |
| **Completheidsanalyse** | Identificeer ontbrekende ingrepen, check kritische gaps |
| **Hoeveelhedenanalyse** | Vergelijk volumes per bouwdeel/element |
| **Financiële analyse** | Totaalkosten over horizon, cashflow-profielen |

### Output
- **Terminal**: Overzichtelijke samenvatting met actiepunten
- **Excel**: Meerdere tabbladen met detail en samenvattingen
- **HTML**: Visueel rapport met grafieken voor klanten

## Installatie

```bash
# Clone repository
git clone <repository-url>
cd mjob_analyse

# Installeer dependencies
pip install -r requirements.txt

# Of installeer als package
pip install -e .
```

### Vereisten
- Python 3.10+
- pandas, openpyxl, typer, pyyaml

## Gebruik

### Basis vergelijking
```bash
python mjob_analyse.py vergelijk plato_export.xlsx vastware_export.xlsx
```

### Met configuratie
```bash
python mjob_analyse.py vergelijk plato_export.xlsx vastware_export.xlsx \
    --config waardwonen.yaml \
    --naam-a "Plato" \
    --naam-b "Vastware"
```

### Specifieke analyse
```bash
# Alleen prijsanalyse
python mjob_analyse.py vergelijk data_a.xlsx data_b.xlsx --analyse prijzen

# Alleen financieel
python mjob_analyse.py vergelijk data_a.xlsx data_b.xlsx --analyse financieel
```

### Export opties
```bash
# Excel naar specifieke locatie
python mjob_analyse.py vergelijk data_a.xlsx data_b.xlsx -o ./output/rapport.xlsx

# HTML rapport
python mjob_analyse.py vergelijk data_a.xlsx data_b.xlsx --html ./rapport.html
```

### Preview bestand
```bash
# Bekijk structuur van een export
python mjob_analyse.py preview export.xlsx

# Specifieke sheet
python mjob_analyse.py preview export.xlsx --sheet "Data"
```

### Benchmark data bekijken
```bash
python mjob_analyse.py benchmark --prijzen
python mjob_analyse.py benchmark --cycli
```

## Configuratie

Maak een YAML configuratiebestand voor projectspecifieke instellingen:

```yaml
# config_klant.yaml
analyse:
  horizon_jaren: 60
  inflatie_percentage: 2.0
  start_jaar: 2024

drempels:
  prijs_afwijking_percentage: 15.0
  cyclus_afwijking_jaren: 3
  match_confidence_minimum: 0.6

kolom_mappings:
  custom_systeem:
    maatregel: "Omschrijving ingreep"
    hoeveelheid: "Aantal"
    eenheidsprijs: "Prijs"
    cyclus: "Interval"
```

Zie `examples/config_voorbeeld.yaml` voor een volledig voorbeeld.

## Ondersteunde Systemen

| Systeem | Automatische detectie | Kolom mapping |
|---------|----------------------|---------------|
| Vastware | ✓ | ✓ |
| Plato | ✓ | ✓ |
| O-Prognose | ✓ | ✓ |
| IBIS | ✓ | ✓ |
| Custom | - | Via config |

## Benchmark Data

De tool bevat benchmark data voor gangbare prijzen en cycli in woningonderhoud:

- **Dakwerk**: dakpannen, goten, loodwerk
- **Gevels**: voegwerk, metselwerk, beplating
- **Kozijnen**: hout, kunststof, aluminium
- **Installaties**: CV, ventilatie, elektra
- **Sanitair**: keuken, badkamer, toilet

## Projectstructuur

```
mjob_analyse/
├── cli.py              # CLI interface
├── config/             # Configuratie beheer
├── data/               # Data laden en normaliseren
├── matching/           # Classificatie en matching
├── analysis/           # Analyse modules
├── output/             # Export naar Excel/HTML
├── benchmarks/         # Benchmark data
└── utils/              # Hulpfuncties
```

## Voorbeelden

### Test met voorbeelddata
```bash
# Genereer testdata
python examples/genereer_testdata.py

# Voer analyse uit
python mjob_analyse.py vergelijk \
    examples/vastware_export_voorbeeld.xlsx \
    examples/plato_export_voorbeeld.xlsx \
    --naam-a "Vastware" \
    --naam-b "Plato" \
    -o analyse_test.xlsx
```

## Ontwikkeling

```bash
# Installeer development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Code formatting
black mjob_analyse/
ruff check mjob_analyse/

# Type checking
mypy mjob_analyse/
```

## Licentie

MIT License

## Contact

Finance Ideas - Consultancy voor woningcorporaties
