import json
import re
from pathlib import Path

from conftest import FIXTURE_TEAM_ALIASES

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures"


def test_fixture_team_aliases_match_all_fip_standings_teams() -> None:
    # frozen copy: the live standings are checked by the alias-check job of the workflow
    teams = set(json.loads((FIXTURES / "standings-teams.json").read_text(encoding="utf-8")))

    assert set(FIXTURE_TEAM_ALIASES.values()) == teams


def test_fixture_team_aliases_cover_all_first_round_fixture_teams() -> None:
    teams: set[str] = set()
    for mn in range(1, 7):
        html = (FIXTURES / f"playbasket-a1-m{mn}.html").read_text(encoding="utf-8")
        match = re.search(pattern=r"<title>(.+?) - (.+?) \d+-\d+ \[", string=html)
        assert match is not None
        teams.update(match.groups())

    assert set(FIXTURE_TEAM_ALIASES) == teams
