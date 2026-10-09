import pytest

from fip_calendar import boxscores, cli

# The playbasket.it pages in fixtures/ are Serie C 2026/27 games (copied from the sister
# project campionato-serie-c-26-27): the matching logic is tested against them with the alias
# table of that league, while config.PLAYBASKET_TEAM_ALIASES stays empty until the first DR2
# box score.
FIXTURE_TEAM_ALIASES: dict[str, str] = {
    "CMB Porto Torres": "C.M.B. PORTO TORRES",
    "Aurea Sassari": "FISIOKONS AUREA SASSARI",
    "Ferrini Quartu S.Elena": "BASKET FERRINI",
    "Scuola Basket Carbonia": "SCUOLA BASKET CARBONIA",
    "Sirbones Nuoro": "PALL. NUORO",
    "Sef Torres Sassari": "SEF TORRES",
    "Dinamo Academy": "POL. DINAMO",
    "Antonianum Quartu S.Elena": "BASKET ANTONIANUM",
    "Calasetta Basket": "CAMPING LA SALINA CALASETTA",
    "Olimpia Cagliari": "OLIMPIA CAGLIARI",
    "S. Orsola Sassari": "BASKET S. ORSOLA",
    "Cus Cagliari": "CUS CAGLIARI",
}


@pytest.fixture(autouse=True)
def fixture_team_aliases(monkeypatch: pytest.MonkeyPatch) -> None:
    """Point box score matching and the sync switch at the fixture league's aliases."""
    monkeypatch.setattr(
        boxscores,
        "TEAM_ALIASES",
        {name.casefold(): team.casefold() for name, team in FIXTURE_TEAM_ALIASES.items()},
    )
    monkeypatch.setattr(cli, "PLAYBASKET_TEAM_ALIASES", FIXTURE_TEAM_ALIASES)
