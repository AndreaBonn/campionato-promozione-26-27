from typing import Any

import pytest

from fip_calendar.notices import (
    KIND_COMUNICATO,
    KIND_FORMULA,
    KIND_LEAGUE,
    merge_notices,
    select_notices,
)

SINCE = "2026-09-23T00:00:00"


def post(title: str, date: str = "2026-10-20T10:00:00", slug: str = "x") -> dict[str, Any]:
    return {"date": date, "title": {"rendered": title}, "link": f"https://sardegna.fip.it/{slug}/"}


def test_select_notices_keeps_recent_formula_post_for_dr2() -> None:
    posts = [post("Divisione Regionale 2: la formula dei playoff 2026/27", slug="formula")]

    notices = select_notices(posts=posts, since=SINCE)

    assert notices == [
        {
            "date": "2026-10-20",
            "title": "Divisione Regionale 2: la formula dei playoff 2026/27",
            "link": "https://sardegna.fip.it/formula/",
            "kind": "formula",
        }
    ]


def test_select_notices_accepts_regional_championships_wording() -> None:
    notices = select_notices(posts=[post("LA FORMULA DEI CAMPIONATI REGIONALI")], since=SINCE)

    assert len(notices) == 1


def test_select_notices_drops_posts_without_competition_keyword() -> None:
    posts = [post("B Interregionale, si parte! Play by play e boxscore su FIP Stats")]

    assert select_notices(posts=posts, since=SINCE) == []


def test_select_notices_drops_posts_before_the_season_calendar() -> None:
    old = post("Playoff e Playout DR2, primo turno", date="2026-03-15T21:25:15")

    assert select_notices(posts=[old], since=SINCE) == []


def test_select_notices_unescapes_html_and_dedupes_links() -> None:
    posts = [
        post("DR2: formula &#8220;playoff&#8221;", slug="a"),
        post("DR2: formula &#8220;playoff&#8221;", slug="a"),
    ]

    notices = select_notices(posts=posts, since=SINCE)

    assert [n["title"] for n in notices] == ["DR2: formula “playoff”"]


def test_select_notices_sorts_newest_first() -> None:
    posts = [
        post("DR2 playout", date="2026-11-01T10:00:00", slug="old"),
        post("DR2 playoff", date="2027-03-01T10:00:00", slug="new"),
    ]

    notices = select_notices(posts=posts, since=SINCE)

    assert [n["link"] for n in notices] == [
        "https://sardegna.fip.it/new/",
        "https://sardegna.fip.it/old/",
    ]


def test_select_notices_drops_playoff_posts_of_other_championships() -> None:
    posts = [post("Serie A2 Femminile: la formula dei playoff")]

    assert select_notices(posts=posts, since=SINCE) == []


def test_select_notices_drops_links_outside_fip_sardegna() -> None:
    posts = [
        {
            "date": "2026-10-20T10:00:00",
            "title": {"rendered": "DR2 formula"},
            "link": "javascript:alert(1)",
        }
    ]

    assert select_notices(posts=posts, since=SINCE) == []


def test_select_notices_post_published_exactly_at_since_is_kept() -> None:
    posts = [post("DR2: formula", date=SINCE)]

    assert len(select_notices(posts=posts, since=SINCE)) == 1


def test_select_notices_accepts_hyphenated_play_off_wording() -> None:
    posts = [post("Divisione Regionale 2, date dei play-off")]

    assert len(select_notices(posts=posts, since=SINCE)) == 1


@pytest.mark.parametrize(
    "link",
    [
        "https://sardegna.fip.it.example.com/formula/",
        "http://sardegna.fip.it/formula/",
        "https://fip.it/formula/",
    ],
)
def test_select_notices_drops_lookalike_and_insecure_links(link: str) -> None:
    posts = [{"date": "2026-10-20T10:00:00", "title": {"rendered": "DR2 formula"}, "link": link}]

    assert select_notices(posts=posts, since=SINCE) == []


def test_select_notices_no_posts_returns_empty() -> None:
    assert select_notices(posts=[], since=SINCE) == []


def test_select_notices_league_category_keeps_dr2_title_without_topic_word() -> None:
    posts = [post("Basket, Divisione Regionale 2: ecco le 12 protagoniste", slug="protagoniste")]

    notices = select_notices(posts=posts, since=SINCE, kind=KIND_LEAGUE)

    assert [(n["link"], n["kind"]) for n in notices] == [
        ("https://sardegna.fip.it/protagoniste/", "dr2")
    ]


def test_select_notices_league_category_keeps_posts_naming_assemini() -> None:
    posts = [post("DR2 Sud. Assemini vince la finale contro Sinnai (87-57)")]
    other = [post("Assemini Black, prima vittoria stagionale", slug="black")]

    assert len(select_notices(posts=posts, since=SINCE, kind=KIND_LEAGUE)) == 1
    assert len(select_notices(posts=other, since=SINCE, kind=KIND_LEAGUE)) == 1


def test_select_notices_league_category_drops_posts_of_other_championships() -> None:
    # the "CAMPIONATI REGIONALI" category files every regional league, not only the DR2
    posts = [post("Il Serramanna batte il Cus Cagliari anche in gara 2 e vola in DR1")]

    assert select_notices(posts=posts, since=SINCE, kind=KIND_LEAGUE) == []


def test_select_notices_league_category_still_drops_old_and_offsite_posts() -> None:
    old = post("DR2, la finale", date="2026-05-10T19:15:30")
    offsite = {**post("DR2, la finale"), "link": "https://example.com/finale/"}

    assert select_notices(posts=[old, offsite], since=SINCE, kind=KIND_LEAGUE) == []


def test_select_notices_comunicato_keeps_dr2_judge_decision() -> None:
    title = "N. 12 del 10/10/2026 &#8211; giudice sportivo &#8211; dr2"
    posts = [post(title, slug="comunicato/n-12")]

    notices = select_notices(posts=posts, since=SINCE, kind=KIND_COMUNICATO)

    assert [(n["title"], n["kind"]) for n in notices] == [
        ("N. 12 del 10/10/2026 – giudice sportivo – dr2", "comunicato")
    ]


def test_select_notices_comunicato_of_other_championship_is_dropped() -> None:
    posts = [post("N. 13 del 10/10/2026 – giudice sportivo – u17 f reg")]

    assert select_notices(posts=posts, since=SINCE, kind=KIND_COMUNICATO) == []


def test_merge_notices_dedupes_by_link_keeping_the_first_source() -> None:
    formula = select_notices(posts=[post("DR2: formula playoff", slug="f")], since=SINCE)
    league = select_notices(
        posts=[post("DR2: formula playoff", slug="f")], since=SINCE, kind=KIND_LEAGUE
    )

    merged = merge_notices(formula, league)

    assert [(n["link"], n["kind"]) for n in merged] == [
        ("https://sardegna.fip.it/f/", KIND_FORMULA)
    ]


def test_merge_notices_sorts_all_sources_newest_first() -> None:
    older = select_notices(
        posts=[post("DR2: formula", date="2026-10-01T10:00:00", slug="old")], since=SINCE
    )
    newer = select_notices(
        posts=[post("N. 1 – giudice sportivo – dr2", date="2026-11-01T10:00:00", slug="new")],
        since=SINCE,
        kind=KIND_COMUNICATO,
    )

    assert [n["link"] for n in merge_notices(older, newer)] == [
        "https://sardegna.fip.it/new/",
        "https://sardegna.fip.it/old/",
    ]


def test_merge_notices_no_sources_returns_empty() -> None:
    assert merge_notices() == []
