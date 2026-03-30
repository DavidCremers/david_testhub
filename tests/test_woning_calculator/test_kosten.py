"""Tests voor kosten calculator."""

import pytest

from woning_calculator.calculators.kosten import (
    bereken_kosten_koper,
    bereken_nhg_kosten,
    bereken_overdrachtsbelasting,
)
from woning_calculator.models.koper import KoperProfiel


class TestOverdrachtsbelasting:
    def test_standaard_2_procent(self):
        belasting = bereken_overdrachtsbelasting(400_000, starter=False)
        assert belasting == pytest.approx(8_000, abs=1)

    def test_starter_vrijstelling(self):
        belasting = bereken_overdrachtsbelasting(400_000, starter=True, leeftijd=28)
        assert belasting == 0.0

    def test_starter_boven_grens(self):
        belasting = bereken_overdrachtsbelasting(600_000, starter=True, leeftijd=28)
        assert belasting == pytest.approx(12_000, abs=1)

    def test_starter_te_oud(self):
        belasting = bereken_overdrachtsbelasting(400_000, starter=True, leeftijd=40)
        assert belasting == pytest.approx(8_000, abs=1)


class TestNHG:
    def test_nhg_kosten(self):
        kosten = bereken_nhg_kosten(400_000, nhg=True)
        assert kosten == pytest.approx(2_400, abs=1)

    def test_geen_nhg(self):
        assert bereken_nhg_kosten(400_000, nhg=False) == 0.0

    def test_boven_nhg_grens(self):
        assert bereken_nhg_kosten(500_000, nhg=True) == 0.0


class TestKostenKoper:
    def test_totaal_kosten(self):
        koper = KoperProfiel(bruto_jaarinkomen=60_000, leeftijd=30, starter=False)
        result = bereken_kosten_koper(350_000, koper, nhg=True)

        assert result.overdrachtsbelasting > 0
        assert result.notaris_leveringsakte > 0
        assert result.taxatiekosten > 0
        assert result.nhg_kosten > 0
        assert result.totaal_kosten_koper > 0

    def test_starter_geen_overdracht(self):
        koper = KoperProfiel(bruto_jaarinkomen=50_000, leeftijd=28, starter=True)
        result = bereken_kosten_koper(400_000, koper)

        assert result.overdrachtsbelasting == 0.0
