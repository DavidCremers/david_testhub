"""Tests voor hypotheek calculator."""

import pytest

from woning_calculator.calculators.hypotheek import (
    bereken_hypotheek,
    bereken_maximale_hypotheek,
)
from woning_calculator.models.hypotheek import HypotheekParams, HypotheekType
from woning_calculator.models.koper import KoperProfiel


class TestAnnuiteit:
    def test_basis_annuiteit(self):
        params = HypotheekParams(
            hoofdsom=400_000,
            rente_percentage=4.0,
            looptijd_jaren=30,
            type=HypotheekType.ANNUITEIT,
        )
        result = bereken_hypotheek(params)

        assert result.maandlast_bruto > 0
        assert result.totaal_rente > 0
        assert len(result.maand_schema) == 360  # 30 jaar * 12 maanden
        assert result.maand_schema[-1].restschuld == pytest.approx(0, abs=1)

    def test_annuiteit_maandlast_stabiel(self):
        params = HypotheekParams(
            hoofdsom=300_000,
            rente_percentage=3.5,
            looptijd_jaren=30,
            type=HypotheekType.ANNUITEIT,
        )
        result = bereken_hypotheek(params)

        # Annuiteit: maandlast is constant (rente + aflossing)
        for m in result.maand_schema:
            assert m.totaal_betaling == pytest.approx(result.maandlast_bruto, abs=0.02)

    def test_nul_rente(self):
        params = HypotheekParams(
            hoofdsom=360_000,
            rente_percentage=0.0,
            looptijd_jaren=30,
            type=HypotheekType.ANNUITEIT,
        )
        result = bereken_hypotheek(params)

        assert result.maandlast_bruto == pytest.approx(1000.0, abs=0.01)
        assert result.totaal_rente == 0.0


class TestLineair:
    def test_basis_lineair(self):
        params = HypotheekParams(
            hoofdsom=360_000,
            rente_percentage=4.0,
            looptijd_jaren=30,
            type=HypotheekType.LINEAIR,
        )
        result = bereken_hypotheek(params)

        assert result.maandlast_bruto > 0
        assert len(result.maand_schema) == 360
        assert result.maand_schema[-1].restschuld == pytest.approx(0, abs=1)

    def test_lineair_aflossing_constant(self):
        params = HypotheekParams(
            hoofdsom=360_000,
            rente_percentage=3.0,
            looptijd_jaren=30,
            type=HypotheekType.LINEAIR,
        )
        result = bereken_hypotheek(params)

        # Lineair: aflossing is constant
        verwachte_aflossing = 360_000 / 360
        for m in result.maand_schema:
            assert m.aflossing == pytest.approx(verwachte_aflossing, abs=0.02)

    def test_lineair_dalende_maandlast(self):
        params = HypotheekParams(
            hoofdsom=300_000,
            rente_percentage=4.0,
            looptijd_jaren=30,
            type=HypotheekType.LINEAIR,
        )
        result = bereken_hypotheek(params)

        # Eerste maandlast > laatste maandlast
        assert result.maand_schema[0].totaal_betaling > result.maand_schema[-1].totaal_betaling


class TestMaximaleHypotheek:
    def test_basis_max(self):
        koper = KoperProfiel(bruto_jaarinkomen=60_000, leeftijd=30)
        max_hyp = bereken_maximale_hypotheek(koper, 4.0)
        assert max_hyp > 0
        assert max_hyp < 1_000_000  # redelijke bovengrens

    def test_hoger_inkomen_hogere_hypotheek(self):
        koper_laag = KoperProfiel(bruto_jaarinkomen=40_000, leeftijd=30)
        koper_hoog = KoperProfiel(bruto_jaarinkomen=80_000, leeftijd=30)
        max_laag = bereken_maximale_hypotheek(koper_laag, 4.0)
        max_hoog = bereken_maximale_hypotheek(koper_hoog, 4.0)
        assert max_hoog > max_laag

    def test_nhg_begrenst(self):
        koper = KoperProfiel(bruto_jaarinkomen=100_000, leeftijd=30)
        max_hyp = bereken_maximale_hypotheek(koper, 3.0, nhg=True)
        assert max_hyp <= 450_000

    def test_studieschuld_verlaagt(self):
        koper_geen = KoperProfiel(bruto_jaarinkomen=60_000, leeftijd=30, studieschuld=0)
        koper_studie = KoperProfiel(bruto_jaarinkomen=60_000, leeftijd=30, studieschuld=30_000)
        max_geen = bereken_maximale_hypotheek(koper_geen, 4.0)
        max_studie = bereken_maximale_hypotheek(koper_studie, 4.0)
        assert max_studie < max_geen
