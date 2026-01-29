"""Data loader voor Excel en CSV bestanden."""

from pathlib import Path
from typing import Optional

import pandas as pd

from ..utils.logging import get_logger

logger = get_logger("data.loader")


class DataLoader:
    """
    Laadt onderhoudsdata uit Excel en CSV bestanden.

    Ondersteunt automatische detectie van bestandstype en sheet selectie.
    """

    SUPPORTED_EXTENSIONS = {".xlsx", ".xls", ".csv"}

    def __init__(self):
        """Initialiseer de DataLoader."""
        self._last_loaded_path: Optional[Path] = None
        self._sheet_names: list[str] = []

    def load(
        self,
        file_path: Path,
        sheet_name: Optional[str] = None,
        encoding: str = "utf-8",
    ) -> pd.DataFrame:
        """
        Laad data uit een bestand.

        Args:
            file_path: Pad naar het bestand
            sheet_name: Optionele sheet naam voor Excel bestanden
            encoding: Encoding voor CSV bestanden

        Returns:
            DataFrame met de geladen data

        Raises:
            FileNotFoundError: Als het bestand niet bestaat
            ValueError: Als het bestandstype niet ondersteund wordt
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"Bestand niet gevonden: {file_path}")

        extension = file_path.suffix.lower()
        if extension not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Bestandstype '{extension}' niet ondersteund. "
                f"Ondersteunde types: {', '.join(self.SUPPORTED_EXTENSIONS)}"
            )

        logger.info(f"Laden bestand: {file_path}")

        if extension == ".csv":
            df = self._load_csv(file_path, encoding)
        else:
            df = self._load_excel(file_path, sheet_name)

        self._last_loaded_path = file_path

        logger.info(f"Geladen: {len(df)} rijen, {len(df.columns)} kolommen")
        logger.debug(f"Kolommen: {list(df.columns)}")

        return df

    def _load_csv(self, file_path: Path, encoding: str) -> pd.DataFrame:
        """
        Laad CSV bestand met automatische delimiter detectie.

        Args:
            file_path: Pad naar CSV bestand
            encoding: Bestandsencoding

        Returns:
            DataFrame met data
        """
        # Probeer verschillende delimiters
        delimiters = [",", ";", "\t", "|"]

        for delimiter in delimiters:
            try:
                df = pd.read_csv(
                    file_path,
                    delimiter=delimiter,
                    encoding=encoding,
                    low_memory=False,
                )
                # Check of we meer dan 1 kolom hebben
                if len(df.columns) > 1:
                    logger.debug(f"CSV delimiter gedetecteerd: '{delimiter}'")
                    return df
            except Exception:
                continue

        # Fallback: gebruik standaard pandas detectie
        try:
            return pd.read_csv(file_path, encoding=encoding, low_memory=False)
        except UnicodeDecodeError:
            # Probeer alternatieve encoding
            logger.warning(f"UTF-8 encoding mislukt, probeer latin-1")
            return pd.read_csv(file_path, encoding="latin-1", low_memory=False)

    def _load_excel(
        self, file_path: Path, sheet_name: Optional[str]
    ) -> pd.DataFrame:
        """
        Laad Excel bestand.

        Args:
            file_path: Pad naar Excel bestand
            sheet_name: Optionele sheet naam

        Returns:
            DataFrame met data
        """
        # Haal sheet namen op
        xlsx = pd.ExcelFile(file_path)
        self._sheet_names = xlsx.sheet_names

        if sheet_name:
            if sheet_name not in self._sheet_names:
                raise ValueError(
                    f"Sheet '{sheet_name}' niet gevonden. "
                    f"Beschikbare sheets: {', '.join(self._sheet_names)}"
                )
            logger.info(f"Laden sheet: {sheet_name}")
            return pd.read_excel(xlsx, sheet_name=sheet_name)

        # Gebruik eerste sheet of detecteer data sheet
        selected_sheet = self._detect_data_sheet(xlsx)
        logger.info(f"Auto-selectie sheet: {selected_sheet}")
        return pd.read_excel(xlsx, sheet_name=selected_sheet)

    def _detect_data_sheet(self, xlsx: pd.ExcelFile) -> str:
        """
        Detecteer welke sheet de hoofddata bevat.

        Kiest de sheet met de meeste rijen.

        Args:
            xlsx: ExcelFile object

        Returns:
            Naam van de geselecteerde sheet
        """
        if len(xlsx.sheet_names) == 1:
            return xlsx.sheet_names[0]

        max_rows = 0
        best_sheet = xlsx.sheet_names[0]

        for sheet in xlsx.sheet_names:
            try:
                df = pd.read_excel(xlsx, sheet_name=sheet, nrows=0)
                # Tel rijen (max 1000 voor snelheid)
                df_sample = pd.read_excel(xlsx, sheet_name=sheet)
                row_count = len(df_sample)

                if row_count > max_rows:
                    max_rows = row_count
                    best_sheet = sheet
            except Exception:
                continue

        return best_sheet

    def get_sheet_names(self, file_path: Path) -> list[str]:
        """
        Haal sheet namen op uit een Excel bestand.

        Args:
            file_path: Pad naar Excel bestand

        Returns:
            Lijst met sheet namen
        """
        if file_path.suffix.lower() == ".csv":
            return []

        xlsx = pd.ExcelFile(file_path)
        return xlsx.sheet_names

    def detect_system_type(self, df: pd.DataFrame) -> Optional[str]:
        """
        Probeer het bronsysteem te detecteren op basis van kolomnamen.

        Args:
            df: DataFrame om te analyseren

        Returns:
            Gedetecteerd systeemtype of None
        """
        columns = set(col.lower().strip() for col in df.columns)

        # Vastware detectie
        vastware_indicators = {"complex", "element omschrijving", "maatregel omschrijving", "cvo element"}
        if len(vastware_indicators & columns) >= 3:
            logger.info("Systeemtype gedetecteerd: Vastware")
            return "vastware"

        # Plato detectie
        plato_indicators = {"complexnummer", "elementcode", "elementomschrijving", "maatregel"}
        if len(plato_indicators & columns) >= 3:
            logger.info("Systeemtype gedetecteerd: Plato")
            return "plato"

        # O-Prognose detectie
        oprognose_indicators = {"activiteit", "interval", "element"}
        if len(oprognose_indicators & columns) >= 2:
            logger.info("Systeemtype gedetecteerd: O-Prognose")
            return "oprognose"

        # IBIS detectie
        ibis_indicators = {"complexnr", "elementnr", "eerste uitvoering"}
        if len(ibis_indicators & columns) >= 2:
            logger.info("Systeemtype gedetecteerd: IBIS")
            return "ibis"

        logger.warning("Kon systeemtype niet automatisch detecteren")
        return None

    def preview(self, df: pd.DataFrame, n_rows: int = 5) -> str:
        """
        Maak een tekstuele preview van de data.

        Args:
            df: DataFrame om te previeuwen
            n_rows: Aantal rijen in preview

        Returns:
            Geformatteerde preview string
        """
        lines = [
            f"Kolommen ({len(df.columns)}):",
            ", ".join(df.columns[:20]),
            "" if len(df.columns) <= 20 else f"... en {len(df.columns) - 20} meer",
            "",
            f"Eerste {n_rows} rijen:",
            df.head(n_rows).to_string(),
            "",
            f"Totaal: {len(df)} rijen",
        ]
        return "\n".join(lines)
