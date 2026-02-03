"""
Web scraper voor Aedes Carrière Nieuws.

Deze module haalt carrière nieuws artikelen op van de Aedes website.
"""

import hashlib
import json
import logging
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

AEDES_CARRIERE_URL = "https://aedes.nl/vereniging/carrierenieuws"

# User agent om blokkering te voorkomen
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


@dataclass
class CarriereNieuwsItem:
    """Representeert een carrière nieuws artikel."""

    titel: str
    url: str
    datum: Optional[str] = None
    beschrijving: Optional[str] = None
    organisatie: Optional[str] = None
    functie: Optional[str] = None

    @property
    def id(self) -> str:
        """Genereer een unieke ID voor dit item."""
        return hashlib.md5(self.url.encode()).hexdigest()

    def to_dict(self) -> dict:
        """Converteer naar dictionary."""
        result = asdict(self)
        result["id"] = self.id
        return result


class AedesCarriereScraper:
    """Scraper voor Aedes carrière nieuws pagina."""

    def __init__(self, cache_file: Optional[Path] = None):
        """
        Initialiseer de scraper.

        Args:
            cache_file: Pad naar bestand voor opslaan van bekende items.
        """
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.cache_file = cache_file or Path.home() / ".carriere_nieuws_cache.json"
        self._known_items: set[str] = set()
        self._load_cache()

    def _load_cache(self) -> None:
        """Laad bekende items uit cache bestand."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, "r") as f:
                    data = json.load(f)
                    self._known_items = set(data.get("known_ids", []))
                    logger.info(f"Cache geladen: {len(self._known_items)} bekende items")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Kon cache niet laden: {e}")
                self._known_items = set()

    def _save_cache(self) -> None:
        """Sla bekende items op in cache bestand."""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, "w") as f:
                json.dump({
                    "known_ids": list(self._known_items),
                    "last_updated": datetime.now().isoformat()
                }, f, indent=2)
            logger.info(f"Cache opgeslagen: {len(self._known_items)} items")
        except IOError as e:
            logger.error(f"Kon cache niet opslaan: {e}")

    def fetch_page(self) -> str:
        """
        Haal de carrière nieuws pagina op.

        Returns:
            HTML content van de pagina.

        Raises:
            requests.RequestException: Als de pagina niet opgehaald kan worden.
        """
        logger.info(f"Ophalen van {AEDES_CARRIERE_URL}")
        response = self.session.get(AEDES_CARRIERE_URL, timeout=30)
        response.raise_for_status()
        return response.text

    def parse_news_items(self, html: str) -> list[CarriereNieuwsItem]:
        """
        Parse carrière nieuws items uit HTML.

        Args:
            html: HTML content van de pagina.

        Returns:
            Lijst van gevonden nieuws items.
        """
        soup = BeautifulSoup(html, "html.parser")
        items = []

        # Zoek naar nieuws artikelen - verschillende mogelijke selectors
        # Aedes gebruikt vaak article tags of divs met specifieke classes
        article_selectors = [
            "article.news-item",
            "div.news-item",
            "div.carriere-item",
            "article.teaser",
            "div.teaser",
            "li.news-item",
            ".view-content .views-row",
            ".news-list article",
            ".content-list article",
            "article",
        ]

        articles = []
        for selector in article_selectors:
            articles = soup.select(selector)
            if articles:
                logger.debug(f"Gevonden met selector: {selector}")
                break

        if not articles:
            # Fallback: zoek alle links die naar carrière gerelateerde pagina's wijzen
            logger.warning("Geen artikelen gevonden met standaard selectors, gebruik fallback")
            articles = soup.find_all("a", href=lambda h: h and "carriere" in h.lower())

        for article in articles:
            try:
                item = self._parse_article(article, soup)
                if item:
                    items.append(item)
            except Exception as e:
                logger.warning(f"Kon artikel niet parsen: {e}")
                continue

        logger.info(f"Gevonden: {len(items)} carrière nieuws items")
        return items

    def _parse_article(self, article, soup: BeautifulSoup) -> Optional[CarriereNieuwsItem]:
        """Parse een enkel artikel element."""
        # Zoek titel en URL
        link = article.find("a") if article.name != "a" else article
        if not link:
            return None

        href = link.get("href", "")
        if not href:
            return None

        # Maak absolute URL
        if href.startswith("/"):
            url = f"https://aedes.nl{href}"
        elif not href.startswith("http"):
            url = f"https://aedes.nl/{href}"
        else:
            url = href

        # Titel
        titel = ""
        title_selectors = ["h2", "h3", "h4", ".title", ".heading"]
        for sel in title_selectors:
            title_elem = article.select_one(sel) if article.name != "a" else None
            if title_elem:
                titel = title_elem.get_text(strip=True)
                break

        if not titel:
            titel = link.get_text(strip=True)

        if not titel:
            return None

        # Datum
        datum = None
        date_selectors = ["time", ".date", ".datum", ".meta-date", "span.date"]
        for sel in date_selectors:
            date_elem = article.select_one(sel) if article.name != "a" else None
            if date_elem:
                datum = date_elem.get("datetime") or date_elem.get_text(strip=True)
                break

        # Beschrijving
        beschrijving = None
        desc_selectors = [".summary", ".description", ".intro", "p", ".teaser-text"]
        for sel in desc_selectors:
            desc_elem = article.select_one(sel) if article.name != "a" else None
            if desc_elem:
                beschrijving = desc_elem.get_text(strip=True)
                break

        # Organisatie/functie
        organisatie = None
        functie = None
        meta_selectors = [".organisation", ".organisatie", ".company"]
        for sel in meta_selectors:
            meta_elem = article.select_one(sel) if article.name != "a" else None
            if meta_elem:
                organisatie = meta_elem.get_text(strip=True)
                break

        return CarriereNieuwsItem(
            titel=titel,
            url=url,
            datum=datum,
            beschrijving=beschrijving,
            organisatie=organisatie,
            functie=functie,
        )

    def get_all_items(self) -> list[CarriereNieuwsItem]:
        """
        Haal alle carrière nieuws items op.

        Returns:
            Lijst van alle gevonden items.
        """
        html = self.fetch_page()
        return self.parse_news_items(html)

    def get_new_items(self) -> list[CarriereNieuwsItem]:
        """
        Haal alleen nieuwe (niet eerder geziene) items op.

        Returns:
            Lijst van nieuwe items.
        """
        all_items = self.get_all_items()
        new_items = [item for item in all_items if item.id not in self._known_items]

        # Update cache met alle huidige items
        for item in all_items:
            self._known_items.add(item.id)
        self._save_cache()

        logger.info(f"Nieuwe items: {len(new_items)} van {len(all_items)} totaal")
        return new_items

    def mark_as_seen(self, items: list[CarriereNieuwsItem]) -> None:
        """Markeer items als gezien."""
        for item in items:
            self._known_items.add(item.id)
        self._save_cache()

    def reset_cache(self) -> None:
        """Wis de cache van bekende items."""
        self._known_items = set()
        if self.cache_file.exists():
            self.cache_file.unlink()
        logger.info("Cache gewist")
