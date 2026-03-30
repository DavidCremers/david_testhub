"""Tests voor belasting calculator."""

import pytest

from woning_calculator.calculators.belasting import (
    bereken_eigenwoningforfait,
    bereken_renteaftrek,
)
from woning_calculator.calculators.hypotheek import bereken_hypotheek
from woning_calculator.models.hypotheek import HypotheekParams, HypotheekType


class TestEigenwoningforfait:
    def test_basis_ewf(self):
        ewf = bereken_eigenwoningforfait(400_000)
        assert ewf == pytest.approx(1_400, abs=10)

    def test_nul_woz(self):
        assert bereken_eigenwoningforfait(0) == 0.0

    def test_hoge_woz(self):
        ewf = bereken_eigenwoningforfait(2_000_000)
        assert ewf > bereken_eigenwoningforfait(400_000)


class TestRenteaftrek:
    def test_renteaftrek_positief(self):
        params = HypotheekParams(
            hoofdsom=400_000,
            rente_percentage=4.0,
            looptijd_jaren=30,
            type=HypotheekType.ANNUITEIT,
        )
        hyp_result = bereken_hypotheek(params)
        bel_result = bereken_renteaftrek(hyp_result, woz_waarde=400_000, bruto_inkomen=60_000)

        assert bel_result.belasting_voordeel_jaar > 0
        assert bel_result.belasting_voordeel_maand > 0
        assert bel_result.netto_woonlasten_maand < hyp_result.maandlast_bruto
