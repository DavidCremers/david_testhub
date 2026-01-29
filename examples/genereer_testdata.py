#!/usr/bin/env python3
"""
Script om testdata te genereren voor MJOB Analyse.

Genereert twee Excel bestanden met voorbeelddata die gebruikt kunnen worden
om de tool te testen.
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Zorg dat output directory bestaat
output_dir = Path(__file__).parent
output_dir.mkdir(exist_ok=True)


def genereer_vastware_export(n_ingrepen: int = 100) -> pd.DataFrame:
    """Genereer een Vastware-achtige export."""
    np.random.seed(42)

    # Bouwdelen en elementen
    bouwdelen = {
        "Dak": ["Dakpannen", "Dakgoten", "Boeiboorden", "Dakramen"],
        "Gevel": ["Voegwerk", "Metselwerk", "Gevelbeplating"],
        "Kozijnen": ["Kozijnen hout", "Kozijnen kunststof", "Buitendeuren"],
        "Installaties": ["CV-ketel", "Ventilatie", "Elektrische installatie"],
        "Keuken/Badkamer": ["Keuken", "Badkamer", "Toilet"],
    }

    maatregelen = {
        "Dakpannen": [("Vervangen dakpannen", 85, "m²", 50)],
        "Dakgoten": [("Vervangen dakgoten", 55, "m¹", 40)],
        "Boeiboorden": [("Vervangen boeiboorden", 75, "m¹", 30), ("Schilderen boeiboorden", 15, "m¹", 7)],
        "Dakramen": [("Vervangen dakramen", 1200, "st", 30)],
        "Voegwerk": [("Herstellen voegwerk", 35, "m²", 40)],
        "Metselwerk": [("Reparatie metselwerk", 125, "m²", 60)],
        "Gevelbeplating": [("Vervangen gevelbeplating", 95, "m²", 35)],
        "Kozijnen hout": [("Vervangen houten kozijnen", 850, "st", 40), ("Schilderen kozijnen", 45, "m²", 7)],
        "Kozijnen kunststof": [("Vervangen kunststof kozijnen", 750, "st", 45)],
        "Buitendeuren": [("Vervangen buitendeuren", 1250, "st", 35)],
        "CV-ketel": [("Vervangen CV-ketel", 3500, "st", 18)],
        "Ventilatie": [("Vervangen mechanische ventilatie", 2500, "st", 20)],
        "Elektrische installatie": [("Vervangen elektrische installatie", 4500, "VHE", 45)],
        "Keuken": [("Vervangen keuken", 6500, "st", 25)],
        "Badkamer": [("Vervangen badkamer", 7500, "st", 30)],
        "Toilet": [("Vervangen toilet", 850, "st", 25)],
    }

    records = []
    complexen = [f"C{i:03d}" for i in range(1, 11)]

    for _ in range(n_ingrepen):
        complex_id = np.random.choice(complexen)
        bouwdeel = np.random.choice(list(bouwdelen.keys()))
        element = np.random.choice(bouwdelen[bouwdeel])

        if element in maatregelen:
            maatregel_info = maatregelen[element][np.random.randint(len(maatregelen[element]))]
            maatregel, prijs, eenheid, cyclus = maatregel_info

            # Voeg wat variatie toe aan prijzen (±10%)
            prijs_var = prijs * (1 + np.random.uniform(-0.1, 0.1))

            # Variatie in hoeveelheden
            if eenheid == "m²":
                hoeveelheid = np.random.randint(50, 500)
            elif eenheid == "m¹":
                hoeveelheid = np.random.randint(20, 200)
            elif eenheid == "VHE":
                hoeveelheid = np.random.randint(10, 100)
            else:
                hoeveelheid = np.random.randint(1, 20)

            records.append({
                "Complex": complex_id,
                "Complex Omschrijving": f"Complex {complex_id}",
                "Plaatsaanduiding": "",
                "Element": element[:3].upper(),
                "Element Omschrijving": element,
                "Maatregel omschrijving": maatregel,
                "Hoeveelheid": hoeveelheid,
                "Eenheid": eenheid,
                "Eenheidsprijs": round(prijs_var, 2),
                "CVO Element": element[:3].upper(),
                "Bouwjaar Element": np.random.randint(1970, 2010),
                "Bouwjaar Object": np.random.randint(1960, 2000),
                "Cyclus": cyclus,
                "C.Factor": 1.0,
                "Eerste jaar": 2024 + np.random.randint(0, cyclus),
                "Laatste jaar": 2084,
                "Prioriteitnummer": np.random.randint(1, 5),
                "Totaal Jaren": 60,
            })

    return pd.DataFrame(records)


def genereer_plato_export(n_ingrepen: int = 100) -> pd.DataFrame:
    """Genereer een Plato-achtige export met vergelijkbare maar afwijkende data."""
    np.random.seed(123)  # Andere seed voor variatie

    # Vergelijkbare structuur maar andere kolomnamen en iets andere waarden
    bouwdelen = {
        "Dak": ["Dakpannen", "Dakgoten", "Boeiboorden", "Dakramen"],
        "Gevel": ["Voegwerk", "Metselwerk", "Gevelbeplating"],
        "Kozijnen": ["Kozijnen hout", "Kozijnen kunststof", "Buitendeuren"],
        "Installaties": ["CV-ketel", "Ventilatie", "Elektrische installatie"],
        "Keuken/Badkamer": ["Keuken", "Badkamer", "Toilet"],
    }

    maatregelen = {
        "Dakpannen": [("Dakpannen vervangen", 90, "m²", 45)],  # Iets hogere prijs, kortere cyclus
        "Dakgoten": [("Dakgoten vervangen", 52, "m¹", 40)],
        "Boeiboorden": [("Boeiboorden vervangen", 80, "m¹", 35), ("Boeiboorden schilderen", 14, "m¹", 6)],
        "Dakramen": [("Dakramen vervangen", 1350, "st", 28)],
        "Voegwerk": [("Voegwerk herstellen", 38, "m²", 35)],
        "Metselwerk": [("Metselwerk reparatie", 130, "m²", 55)],
        "Gevelbeplating": [("Gevelbeplating vervangen", 100, "m²", 30)],
        "Kozijnen hout": [("Houten kozijnen vervangen", 900, "st", 35), ("Kozijnen schilderen buiten", 48, "m²", 6)],
        "Kozijnen kunststof": [("Kunststof kozijnen vervangen", 800, "st", 50)],
        "Buitendeuren": [("Buitendeuren vervangen", 1300, "st", 30)],
        "CV-ketel": [("CV-ketel vervangen", 3800, "st", 15)],
        "Ventilatie": [("Mechanische ventilatie vervangen", 2800, "st", 18)],
        "Elektrische installatie": [("Elektrische installatie vervangen", 4200, "VHE", 40)],
        "Keuken": [("Keuken vervangen", 7000, "st", 22)],
        "Badkamer": [("Badkamer vervangen", 8000, "st", 28)],
        "Toilet": [("Toilet vervangen", 900, "st", 22)],
    }

    records = []
    complexen = [f"C{i:03d}" for i in range(1, 11)]

    for _ in range(n_ingrepen):
        complex_id = np.random.choice(complexen)
        bouwdeel = np.random.choice(list(bouwdelen.keys()))
        element = np.random.choice(bouwdelen[bouwdeel])

        if element in maatregelen:
            maatregel_info = maatregelen[element][np.random.randint(len(maatregelen[element]))]
            maatregel, prijs, eenheid, cyclus = maatregel_info

            # Voeg variatie toe
            prijs_var = prijs * (1 + np.random.uniform(-0.1, 0.1))

            if eenheid == "m²":
                hoeveelheid = np.random.randint(45, 480)
            elif eenheid == "m¹":
                hoeveelheid = np.random.randint(18, 190)
            elif eenheid == "VHE":
                hoeveelheid = np.random.randint(10, 100)
            else:
                hoeveelheid = np.random.randint(1, 18)

            records.append({
                "Complexnummer": complex_id,
                "Complexnaam": f"Complex {complex_id}",
                "Elementcode": element[:3].upper(),
                "Elementomschrijving": element,
                "Maatregel": maatregel,
                "Hoeveelheid": hoeveelheid,
                "Eenheid": eenheid,
                "Eenheidsprijs": round(prijs_var, 2),
                "Cyclus": cyclus,
                "Startjaar": 2024 + np.random.randint(0, cyclus),
                "Bouwjaar": np.random.randint(1965, 2005),
            })

    return pd.DataFrame(records)


def main():
    print("Genereren testdata...")

    # Genereer Vastware export
    df_vastware = genereer_vastware_export(150)
    vastware_path = output_dir / "vastware_export_voorbeeld.xlsx"
    df_vastware.to_excel(vastware_path, index=False)
    print(f"✓ Vastware export: {vastware_path} ({len(df_vastware)} rijen)")

    # Genereer Plato export
    df_plato = genereer_plato_export(130)
    plato_path = output_dir / "plato_export_voorbeeld.xlsx"
    df_plato.to_excel(plato_path, index=False)
    print(f"✓ Plato export: {plato_path} ({len(df_plato)} rijen)")

    print("\nTestdata gegenereerd! Gebruik de tool met:")
    print(f"  python mjob_analyse.py vergelijk {vastware_path} {plato_path}")


if __name__ == "__main__":
    main()
