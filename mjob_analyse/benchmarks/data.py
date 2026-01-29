"""Benchmark data voor gangbare prijzen en cycli in woningonderhoud."""

from typing import Optional

from ..utils.logging import get_logger

logger = get_logger("benchmarks")


class BenchmarkData:
    """
    Bevat benchmark data voor woningonderhoud.

    Gebaseerd op gangbare prijzen en cycli in de Nederlandse woningcorporatiesector.
    Prijzen zijn indicatief en kunnen variëren per regio en marktomstandigheden.
    """

    # Gangbare eenheidsprijzen (€) per type ingreep
    # Bronnen: diverse MJOP-rapporten, Bouwkostenkompas, marktgemiddelden 2024
    PRIJZEN: dict[str, dict[str, float]] = {
        # Dak
        "dakpannen_vervangen": {"prijs": 85.0, "eenheid": "m²"},
        "dakpannen_reparatie": {"prijs": 45.0, "eenheid": "m²"},
        "dakbedekking_bitumen": {"prijs": 65.0, "eenheid": "m²"},
        "dakgoten_vervangen": {"prijs": 55.0, "eenheid": "m¹"},
        "dakgoten_schilderen": {"prijs": 12.0, "eenheid": "m¹"},
        "hemelwaterafvoer_vervangen": {"prijs": 85.0, "eenheid": "st"},
        "dakkapel_vervangen": {"prijs": 8500.0, "eenheid": "st"},
        "dakraam_vervangen": {"prijs": 1200.0, "eenheid": "st"},
        "loodwerk_vervangen": {"prijs": 95.0, "eenheid": "m¹"},
        "boeiboord_vervangen": {"prijs": 75.0, "eenheid": "m¹"},
        "boeiboord_schilderen": {"prijs": 15.0, "eenheid": "m¹"},

        # Gevel
        "voegwerk_herstellen": {"prijs": 35.0, "eenheid": "m²"},
        "voegwerk_volledig": {"prijs": 55.0, "eenheid": "m²"},
        "metselwerk_reparatie": {"prijs": 125.0, "eenheid": "m²"},
        "gevelreiniging": {"prijs": 8.0, "eenheid": "m²"},
        "gevelbeplating_vervangen": {"prijs": 95.0, "eenheid": "m²"},

        # Kozijnen
        "kozijn_hout_vervangen": {"prijs": 850.0, "eenheid": "st"},
        "kozijn_kunststof_vervangen": {"prijs": 750.0, "eenheid": "st"},
        "kozijn_aluminium_vervangen": {"prijs": 950.0, "eenheid": "st"},
        "draaikiepraam_vervangen": {"prijs": 450.0, "eenheid": "st"},
        "buitendeur_vervangen": {"prijs": 1250.0, "eenheid": "st"},
        "binnendeur_vervangen": {"prijs": 350.0, "eenheid": "st"},
        "hang_sluitwerk_vervangen": {"prijs": 125.0, "eenheid": "st"},

        # Glas
        "dubbel_glas_vervangen": {"prijs": 125.0, "eenheid": "m²"},
        "hr_plus_glas_vervangen": {"prijs": 165.0, "eenheid": "m²"},
        "triple_glas_vervangen": {"prijs": 225.0, "eenheid": "m²"},
        "glaskit_vervangen": {"prijs": 15.0, "eenheid": "m¹"},

        # Schilderwerk
        "buitenschilderwerk_kozijnen": {"prijs": 45.0, "eenheid": "m²"},
        "buitenschilderwerk_gevels": {"prijs": 25.0, "eenheid": "m²"},
        "binnenschilderwerk": {"prijs": 22.0, "eenheid": "m²"},
        "lakwerk_radiatoren": {"prijs": 35.0, "eenheid": "st"},

        # Keuken & Badkamer
        "keuken_vervangen": {"prijs": 6500.0, "eenheid": "st"},
        "keukenblok_basis": {"prijs": 4500.0, "eenheid": "st"},
        "badkamer_vervangen": {"prijs": 7500.0, "eenheid": "st"},
        "douche_vervangen": {"prijs": 2500.0, "eenheid": "st"},
        "toilet_vervangen": {"prijs": 850.0, "eenheid": "st"},
        "wastafel_vervangen": {"prijs": 450.0, "eenheid": "st"},

        # CV & Installaties
        "cv_ketel_vervangen": {"prijs": 3500.0, "eenheid": "st"},
        "warmtepomp_lucht": {"prijs": 8500.0, "eenheid": "st"},
        "warmtepomp_bodem": {"prijs": 15000.0, "eenheid": "st"},
        "radiatoren_vervangen": {"prijs": 350.0, "eenheid": "st"},
        "vloerverwarming": {"prijs": 85.0, "eenheid": "m²"},
        "thermostaat_vervangen": {"prijs": 250.0, "eenheid": "st"},

        # Ventilatie
        "mechanische_ventilatie": {"prijs": 2500.0, "eenheid": "st"},
        "wtw_unit": {"prijs": 4500.0, "eenheid": "st"},
        "afzuigkap_vervangen": {"prijs": 350.0, "eenheid": "st"},
        "ventilatieroosters": {"prijs": 85.0, "eenheid": "st"},

        # Elektra
        "groepenkast_vervangen": {"prijs": 1500.0, "eenheid": "st"},
        "elektrische_installatie": {"prijs": 4500.0, "eenheid": "VHE"},
        "stopcontact_vervangen": {"prijs": 65.0, "eenheid": "st"},
        "schakelaar_vervangen": {"prijs": 45.0, "eenheid": "st"},

        # Overig
        "lift_modernisering": {"prijs": 75000.0, "eenheid": "st"},
        "lift_onderhoud_jaar": {"prijs": 3500.0, "eenheid": "st"},
        "intercom_vervangen": {"prijs": 350.0, "eenheid": "st"},
        "brievenbus_vervangen": {"prijs": 125.0, "eenheid": "st"},
    }

    # Gangbare onderhoudscycli (jaren)
    CYCLI: dict[str, int] = {
        # Dak
        "dakpannen": 50,
        "dakbedekking_bitumen": 25,
        "dakgoten": 40,
        "hemelwaterafvoer": 40,
        "dakkapel": 40,
        "dakraam": 30,
        "loodwerk": 40,
        "boeiboord": 30,

        # Gevel
        "voegwerk": 40,
        "metselwerk": 60,
        "gevelbeplating": 35,

        # Kozijnen
        "kozijn_hout": 40,
        "kozijn_kunststof": 45,
        "kozijn_aluminium": 50,
        "buitendeur": 35,
        "binnendeur": 40,
        "hang_sluitwerk": 20,

        # Glas
        "beglazing": 40,
        "glaskit": 20,

        # Schilderwerk
        "buitenschilderwerk": 7,
        "binnenschilderwerk": 10,

        # Keuken & Badkamer
        "keuken": 25,
        "badkamer": 30,
        "toilet": 25,
        "wastafel": 25,

        # Installaties
        "cv_ketel": 18,
        "warmtepomp": 20,
        "radiatoren": 40,
        "thermostaat": 15,
        "mechanische_ventilatie": 20,
        "wtw": 20,
        "elektrische_installatie": 45,
        "groepenkast": 40,

        # Overig
        "lift": 25,
        "intercom": 20,
    }

    def __init__(self):
        """Initialiseer benchmark data."""
        self._custom_prijzen: dict[str, dict] = {}
        self._custom_cycli: dict[str, int] = {}

    def get_prijs(
        self, ingreep_type: str, default: Optional[float] = None
    ) -> Optional[float]:
        """
        Haal benchmark prijs op voor een ingreep type.

        Args:
            ingreep_type: Type ingreep (bijv. "dakpannen_vervangen")
            default: Standaard waarde als niet gevonden

        Returns:
            Benchmark prijs of default
        """
        # Check custom prijzen eerst
        if ingreep_type in self._custom_prijzen:
            return self._custom_prijzen[ingreep_type].get("prijs", default)

        # Check standaard prijzen
        if ingreep_type in self.PRIJZEN:
            return self.PRIJZEN[ingreep_type]["prijs"]

        # Fuzzy match op keyword
        ingreep_lower = ingreep_type.lower()
        for key, data in self.PRIJZEN.items():
            if key.replace("_", " ") in ingreep_lower or ingreep_lower in key:
                return data["prijs"]

        return default

    def get_cyclus(
        self, ingreep_type: str, default: Optional[int] = None
    ) -> Optional[int]:
        """
        Haal benchmark cyclus op voor een ingreep type.

        Args:
            ingreep_type: Type ingreep (bijv. "cv_ketel")
            default: Standaard waarde als niet gevonden

        Returns:
            Benchmark cyclus in jaren of default
        """
        # Check custom cycli eerst
        if ingreep_type in self._custom_cycli:
            return self._custom_cycli[ingreep_type]

        # Check standaard cycli
        if ingreep_type in self.CYCLI:
            return self.CYCLI[ingreep_type]

        # Fuzzy match
        ingreep_lower = ingreep_type.lower()
        for key, cyclus in self.CYCLI.items():
            if key.replace("_", " ") in ingreep_lower or ingreep_lower in key:
                return cyclus

        return default

    def add_custom_prijs(
        self, ingreep_type: str, prijs: float, eenheid: str = "st"
    ) -> None:
        """Voeg custom benchmark prijs toe."""
        self._custom_prijzen[ingreep_type] = {"prijs": prijs, "eenheid": eenheid}
        logger.info(f"Custom prijs toegevoegd: {ingreep_type} = €{prijs}")

    def add_custom_cyclus(self, ingreep_type: str, cyclus: int) -> None:
        """Voeg custom benchmark cyclus toe."""
        self._custom_cycli[ingreep_type] = cyclus
        logger.info(f"Custom cyclus toegevoegd: {ingreep_type} = {cyclus} jaar")

    def get_all_prijzen(self) -> dict[str, dict]:
        """Haal alle benchmark prijzen op."""
        result = self.PRIJZEN.copy()
        result.update(self._custom_prijzen)
        return result

    def get_all_cycli(self) -> dict[str, int]:
        """Haal alle benchmark cycli op."""
        result = self.CYCLI.copy()
        result.update(self._custom_cycli)
        return result

    def find_matching_benchmark(
        self, maatregel: str, element: Optional[str] = None
    ) -> dict:
        """
        Zoek matching benchmark voor een maatregel.

        Args:
            maatregel: Maatregel omschrijving
            element: Optionele element omschrijving

        Returns:
            Dictionary met gevonden benchmark info
        """
        combined = maatregel.lower()
        if element:
            combined += " " + element.lower()

        result = {
            "prijs": None,
            "cyclus": None,
            "prijs_match": None,
            "cyclus_match": None,
        }

        # Zoek prijs match
        for key, data in self.PRIJZEN.items():
            keywords = key.replace("_", " ").split()
            if all(kw in combined for kw in keywords):
                result["prijs"] = data["prijs"]
                result["prijs_match"] = key
                break

        # Zoek cyclus match
        for key, cyclus in self.CYCLI.items():
            keywords = key.replace("_", " ").split()
            if all(kw in combined for kw in keywords):
                result["cyclus"] = cyclus
                result["cyclus_match"] = key
                break

        return result

    def get_category_averages(self) -> dict[str, dict]:
        """
        Bereken gemiddelde prijzen en cycli per categorie.

        Returns:
            Dictionary met gemiddelden per categorie
        """
        categories = {
            "dak": ["dakpan", "dakbed", "dakgoot", "hemelwater", "dakkapel", "lood", "boei"],
            "gevel": ["voeg", "metsel", "gevel"],
            "kozijn": ["kozijn", "deur", "hang", "sluit"],
            "glas": ["glas", "begla"],
            "schilderwerk": ["schilder", "lak"],
            "keuken_badkamer": ["keuken", "badkamer", "toilet", "wastafel", "douche"],
            "installaties": ["cv", "ketel", "warmte", "radiator", "ventilat", "elektr"],
        }

        result = {}
        for cat, keywords in categories.items():
            prijzen = []
            cycli = []

            for key, data in self.PRIJZEN.items():
                if any(kw in key for kw in keywords):
                    prijzen.append(data["prijs"])

            for key, cyclus in self.CYCLI.items():
                if any(kw in key for kw in keywords):
                    cycli.append(cyclus)

            result[cat] = {
                "gem_prijs": sum(prijzen) / len(prijzen) if prijzen else None,
                "gem_cyclus": sum(cycli) / len(cycli) if cycli else None,
                "aantal_items": len(prijzen),
            }

        return result
