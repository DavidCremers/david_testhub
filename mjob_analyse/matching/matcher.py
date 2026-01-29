"""Fuzzy matching van ingrepen tussen twee datasets."""

from dataclasses import dataclass
from typing import Optional

import pandas as pd
import numpy as np
from difflib import SequenceMatcher

from ..config.settings import Config
from ..utils.logging import get_logger

logger = get_logger("matching.matcher")


@dataclass
class Match:
    """Representeert een match tussen twee ingrepen."""

    index_a: int
    index_b: int
    confidence: float
    match_type: str  # "exact", "fuzzy", "classification"
    details: dict


class IngreepMatcher:
    """
    Matcht vergelijkbare ingrepen tussen twee datasets.

    Combineert exacte matching, fuzzy text matching en classificatie matching.
    """

    def __init__(self, config: Config):
        """
        Initialiseer de matcher.

        Args:
            config: Configuratie met matching parameters
        """
        self.config = config
        self.min_confidence = config.drempels.match_confidence_minimum

    def match_datasets(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        name_a: str = "Systeem A",
        name_b: str = "Systeem B",
    ) -> tuple[pd.DataFrame, list[int], list[int]]:
        """
        Match ingrepen tussen twee datasets.

        Args:
            df_a: Eerste dataset
            df_b: Tweede dataset
            name_a: Naam van eerste systeem
            name_b: Naam van tweede systeem

        Returns:
            Tuple van:
            - DataFrame met gematchte ingrepen
            - Lijst met indices van niet-gematchte ingrepen in A
            - Lijst met indices van niet-gematchte ingrepen in B
        """
        logger.info(f"Start matching: {len(df_a)} vs {len(df_b)} ingrepen")

        matches: list[Match] = []
        matched_b_indices: set[int] = set()

        # Fase 1: Exacte matches op maatregel + element
        exact_matches, matched_b_exact = self._find_exact_matches(df_a, df_b)
        matches.extend(exact_matches)
        matched_b_indices.update(matched_b_exact)
        logger.info(f"Exacte matches: {len(exact_matches)}")

        # Fase 2: Fuzzy matches voor niet-gematchte ingrepen
        unmatched_a = [i for i in df_a.index if i not in [m.index_a for m in matches]]
        unmatched_b = [i for i in df_b.index if i not in matched_b_indices]

        fuzzy_matches, matched_b_fuzzy = self._find_fuzzy_matches(
            df_a.loc[unmatched_a], df_b.loc[unmatched_b]
        )
        matches.extend(fuzzy_matches)
        matched_b_indices.update(matched_b_fuzzy)
        logger.info(f"Fuzzy matches: {len(fuzzy_matches)}")

        # Fase 3: Classification-based matches
        unmatched_a = [i for i in df_a.index if i not in [m.index_a for m in matches]]
        unmatched_b = [i for i in df_b.index if i not in matched_b_indices]

        class_matches, matched_b_class = self._find_classification_matches(
            df_a.loc[unmatched_a] if unmatched_a else pd.DataFrame(),
            df_b.loc[unmatched_b] if unmatched_b else pd.DataFrame(),
        )
        matches.extend(class_matches)
        matched_b_indices.update(matched_b_class)
        logger.info(f"Classificatie matches: {len(class_matches)}")

        # Bouw resultaat DataFrame
        result_df = self._build_match_dataframe(df_a, df_b, matches, name_a, name_b)

        # Bepaal niet-gematchte indices
        matched_a_indices = {m.index_a for m in matches}
        unmatched_a_final = [i for i in df_a.index if i not in matched_a_indices]
        unmatched_b_final = [i for i in df_b.index if i not in matched_b_indices]

        logger.info(
            f"Matching voltooid: {len(matches)} matches, "
            f"{len(unmatched_a_final)} ongematchd in A, "
            f"{len(unmatched_b_final)} ongematchd in B"
        )

        return result_df, unmatched_a_final, unmatched_b_final

    def _find_exact_matches(
        self, df_a: pd.DataFrame, df_b: pd.DataFrame
    ) -> tuple[list[Match], set[int]]:
        """Vind exacte matches op basis van maatregel en element."""
        matches = []
        matched_b = set()

        for idx_a in df_a.index:
            maatregel_a = self._get_match_text(df_a.loc[idx_a])
            if not maatregel_a:
                continue

            for idx_b in df_b.index:
                if idx_b in matched_b:
                    continue

                maatregel_b = self._get_match_text(df_b.loc[idx_b])
                if not maatregel_b:
                    continue

                # Exacte match (case-insensitive)
                if maatregel_a.lower().strip() == maatregel_b.lower().strip():
                    matches.append(
                        Match(
                            index_a=idx_a,
                            index_b=idx_b,
                            confidence=1.0,
                            match_type="exact",
                            details={"matched_text": maatregel_a},
                        )
                    )
                    matched_b.add(idx_b)
                    break

        return matches, matched_b

    def _find_fuzzy_matches(
        self, df_a: pd.DataFrame, df_b: pd.DataFrame
    ) -> tuple[list[Match], set[int]]:
        """Vind fuzzy matches op basis van tekst similariteit."""
        matches = []
        matched_b = set()

        if df_a.empty or df_b.empty:
            return matches, matched_b

        for idx_a in df_a.index:
            text_a = self._get_match_text(df_a.loc[idx_a])
            if not text_a:
                continue

            best_match: Optional[Match] = None
            best_score = self.min_confidence

            for idx_b in df_b.index:
                if idx_b in matched_b:
                    continue

                text_b = self._get_match_text(df_b.loc[idx_b])
                if not text_b:
                    continue

                # Bereken similariteit
                score = self._calculate_similarity(text_a, text_b)

                # Bonus voor zelfde bouwdeel
                if self._same_classification(df_a.loc[idx_a], df_b.loc[idx_b]):
                    score = min(1.0, score + 0.1)

                if score > best_score:
                    best_score = score
                    best_match = Match(
                        index_a=idx_a,
                        index_b=idx_b,
                        confidence=score,
                        match_type="fuzzy",
                        details={
                            "text_a": text_a,
                            "text_b": text_b,
                        },
                    )

            if best_match:
                matches.append(best_match)
                matched_b.add(best_match.index_b)

        return matches, matched_b

    def _find_classification_matches(
        self, df_a: pd.DataFrame, df_b: pd.DataFrame
    ) -> tuple[list[Match], set[int]]:
        """Match op basis van classificatie (bouwdeel + activiteit)."""
        matches = []
        matched_b = set()

        if df_a.empty or df_b.empty:
            return matches, matched_b

        if "Bouwdeel" not in df_a.columns or "Bouwdeel" not in df_b.columns:
            return matches, matched_b

        for idx_a in df_a.index:
            bouwdeel_a = df_a.loc[idx_a].get("Bouwdeel")
            activiteit_a = df_a.loc[idx_a].get("Activiteitstype")

            if pd.isna(bouwdeel_a):
                continue

            best_match: Optional[Match] = None
            best_score = 0.5  # Lagere drempel voor classificatie matches

            for idx_b in df_b.index:
                if idx_b in matched_b:
                    continue

                bouwdeel_b = df_b.loc[idx_b].get("Bouwdeel")
                activiteit_b = df_b.loc[idx_b].get("Activiteitstype")

                if pd.isna(bouwdeel_b):
                    continue

                # Score berekening
                score = 0.0
                if bouwdeel_a == bouwdeel_b:
                    score += 0.4
                if activiteit_a == activiteit_b and pd.notna(activiteit_a):
                    score += 0.3

                # Extra punten voor vergelijkbare eenheid
                eenheid_a = df_a.loc[idx_a].get("Eenheid")
                eenheid_b = df_b.loc[idx_b].get("Eenheid")
                if pd.notna(eenheid_a) and pd.notna(eenheid_b):
                    if str(eenheid_a).lower() == str(eenheid_b).lower():
                        score += 0.2

                if score > best_score:
                    best_score = score
                    best_match = Match(
                        index_a=idx_a,
                        index_b=idx_b,
                        confidence=min(0.7, score),  # Cap bij 0.7 voor class matches
                        match_type="classification",
                        details={
                            "bouwdeel": bouwdeel_a,
                            "activiteit": activiteit_a,
                        },
                    )

            if best_match:
                matches.append(best_match)
                matched_b.add(best_match.index_b)

        return matches, matched_b

    def _get_match_text(self, row: pd.Series) -> str:
        """Haal de tekst voor matching uit een rij."""
        parts = []

        for col in ["Maatregel", "Element Omschrijving", "Element"]:
            if col in row.index and pd.notna(row[col]):
                parts.append(str(row[col]))

        return " ".join(parts)

    def _calculate_similarity(self, text_a: str, text_b: str) -> float:
        """Bereken similariteit tussen twee teksten."""
        # Normaliseer teksten
        a = text_a.lower().strip()
        b = text_b.lower().strip()

        # Gebruik SequenceMatcher voor fuzzy matching
        ratio = SequenceMatcher(None, a, b).ratio()

        # Bonus voor gedeelde belangrijke woorden
        words_a = set(a.split())
        words_b = set(b.split())
        common_words = words_a & words_b

        # Filter stopwoorden
        stopwoorden = {"de", "het", "een", "en", "van", "in", "op", "te", "voor", "met"}
        meaningful_common = common_words - stopwoorden

        if meaningful_common:
            word_bonus = min(0.2, len(meaningful_common) * 0.05)
            ratio = min(1.0, ratio + word_bonus)

        return ratio

    def _same_classification(self, row_a: pd.Series, row_b: pd.Series) -> bool:
        """Check of twee rijen dezelfde classificatie hebben."""
        bouwdeel_a = row_a.get("Bouwdeel")
        bouwdeel_b = row_b.get("Bouwdeel")

        if pd.notna(bouwdeel_a) and pd.notna(bouwdeel_b):
            return bouwdeel_a == bouwdeel_b
        return False

    def _build_match_dataframe(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        matches: list[Match],
        name_a: str,
        name_b: str,
    ) -> pd.DataFrame:
        """Bouw een DataFrame met alle gematchte ingrepen."""
        records = []

        for match in matches:
            row_a = df_a.loc[match.index_a]
            row_b = df_b.loc[match.index_b]

            record = {
                "Match_Confidence": match.confidence,
                "Match_Type": match.match_type,
                f"Maatregel_{name_a}": row_a.get("Maatregel"),
                f"Maatregel_{name_b}": row_b.get("Maatregel"),
                f"Element_{name_a}": row_a.get("Element Omschrijving"),
                f"Element_{name_b}": row_b.get("Element Omschrijving"),
                "Bouwdeel": row_a.get("Bouwdeel") or row_b.get("Bouwdeel"),
                "Activiteitstype": row_a.get("Activiteitstype")
                or row_b.get("Activiteitstype"),
                f"Hoeveelheid_{name_a}": row_a.get("Hoeveelheid"),
                f"Hoeveelheid_{name_b}": row_b.get("Hoeveelheid"),
                f"Eenheid_{name_a}": row_a.get("Eenheid"),
                f"Eenheid_{name_b}": row_b.get("Eenheid"),
                f"Eenheidsprijs_{name_a}": row_a.get("Eenheidsprijs"),
                f"Eenheidsprijs_{name_b}": row_b.get("Eenheidsprijs"),
                f"Cyclus_{name_a}": row_a.get("Cyclus"),
                f"Cyclus_{name_b}": row_b.get("Cyclus"),
                f"Totaalkosten_{name_a}": row_a.get("Totaalkosten"),
                f"Totaalkosten_{name_b}": row_b.get("Totaalkosten"),
                f"Index_{name_a}": match.index_a,
                f"Index_{name_b}": match.index_b,
            }
            records.append(record)

        return pd.DataFrame(records)

    def calculate_match_quality(self, match_df: pd.DataFrame) -> dict:
        """
        Bereken kwaliteitsmetrics voor de matching.

        Args:
            match_df: DataFrame met matches

        Returns:
            Dictionary met kwaliteitsmetrics
        """
        if match_df.empty:
            return {
                "totaal_matches": 0,
                "gemiddelde_confidence": 0,
                "exact_matches": 0,
                "fuzzy_matches": 0,
                "classification_matches": 0,
            }

        return {
            "totaal_matches": len(match_df),
            "gemiddelde_confidence": float(match_df["Match_Confidence"].mean()),
            "exact_matches": int((match_df["Match_Type"] == "exact").sum()),
            "fuzzy_matches": int((match_df["Match_Type"] == "fuzzy").sum()),
            "classification_matches": int(
                (match_df["Match_Type"] == "classification").sum()
            ),
            "hoge_confidence": int((match_df["Match_Confidence"] >= 0.8).sum()),
            "lage_confidence": int((match_df["Match_Confidence"] < 0.6).sum()),
        }
