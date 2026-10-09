import json
from pathlib import Path

import pytest

from fip_calendar import coveragebadge
from fip_calendar.coveragebadge import badge_color, coverage_badge


def write_report(path: Path, percent: float) -> Path:
    path.write_text(json.dumps({"totals": {"percent_covered": percent}}), encoding="utf-8")
    return path


def test_coverage_badge_is_a_shields_endpoint_with_rounded_percent() -> None:
    assert coverage_badge(percent=93.6) == {
        "schemaVersion": 1,
        "label": "coverage",
        "message": "94%",
        "color": "brightgreen",
    }


def test_coverage_badge_rounds_down_below_half() -> None:
    assert coverage_badge(percent=79.4)["message"] == "79%"


@pytest.mark.parametrize(
    ("percent", "color"),
    [
        (100.0, "brightgreen"),
        (90.0, "brightgreen"),
        (89.9, "green"),
        (80.0, "green"),
        (79.9, "yellow"),
        (60.0, "yellow"),
        (59.9, "red"),
        (0.0, "red"),
    ],
)
def test_badge_color_follows_thresholds(percent: float, color: str) -> None:
    assert badge_color(percent) == color


def test_main_writes_badge_from_coverage_report(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    report = write_report(tmp_path / "coverage.json", percent=87.2)
    badge = tmp_path / "docs" / "coverage-badge.json"
    badge.parent.mkdir()
    monkeypatch.setattr(coveragebadge, "REPORT_PATH", report)
    monkeypatch.setattr(coveragebadge, "BADGE_PATH", badge)

    assert coveragebadge.main() == 0

    assert json.loads(badge.read_text(encoding="utf-8"))["message"] == "87%"


def test_main_fails_without_coverage_report(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(coveragebadge, "REPORT_PATH", tmp_path / "missing.json")
    monkeypatch.setattr(coveragebadge, "BADGE_PATH", tmp_path / "coverage-badge.json")

    with pytest.raises(FileNotFoundError):
        coveragebadge.main()

    assert not (tmp_path / "coverage-badge.json").exists()
