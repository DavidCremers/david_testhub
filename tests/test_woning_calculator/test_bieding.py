"""Tests voor bieding calculator."""

from woning_calculator.calculators.bieding import bereken_bieding, schat_marktwaarde
from woning_calculator.models.woning import EnergyLabel, Woning


def _maak_woning(**kwargs) -> Woning:
    defaults = dict(
        vraagprijs=400_000,
        stad="Utrecht",
        postcode="3500AA",
        woonoppervlakte=80,
        bouwjaar=2000,
        aantal_kamers=4,
    )
    defaults.update(kwargs)
    return Woning(**defaults)


class TestMarktwaarde:
    def test_basis_schatting(self):
        woning = _maak_woning()
        waarde = schat_marktwaarde(woning)
        assert waarde > 0

    def test_beter_label_hogere_waarde(self):
        woning_a = _maak_woning(energielabel=EnergyLabel.A)
        woning_g = _maak_woning(energielabel=EnergyLabel.G)
        assert schat_marktwaarde(woning_a) > schat_marktwaarde(woning_g)


class TestBieding:
    def test_bieding_resultaat(self):
        woning = _maak_woning()
        result = bereken_bieding(woning)

        assert result.advies_bieding_laag <= result.advies_bieding_midden
        assert result.advies_bieding_midden <= result.advies_bieding_hoog
        assert result.vraagprijs == 400_000
        assert len(result.factoren) > 0

    def test_overbied_override(self):
        woning = _maak_woning()
        result_0 = bereken_bieding(woning, overbied_pct_override=0.0)
        result_10 = bereken_bieding(woning, overbied_pct_override=10.0)
        assert result_10.advies_bieding_midden > result_0.advies_bieding_midden
