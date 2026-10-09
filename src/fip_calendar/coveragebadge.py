import json
import sys
from typing import Any

from fip_calendar.config import ROOT

# written by `pytest --cov --cov-report=json` in the workflow
REPORT_PATH = ROOT / "coverage.json"
# served by GitHub Pages and read by shields.io's endpoint badge; published, never committed
BADGE_PATH = ROOT / "docs" / "coverage-badge.json"
# lower bound of each color, highest first
COLOR_THRESHOLDS = ((90.0, "brightgreen"), (80.0, "green"), (60.0, "yellow"))
FALLBACK_COLOR = "red"


def badge_color(percent: float) -> str:
    for threshold, color in COLOR_THRESHOLDS:
        if percent >= threshold:
            return color
    return FALLBACK_COLOR


def coverage_badge(percent: float) -> dict[str, Any]:
    """Shields.io endpoint payload for a total line and branch coverage percentage."""
    # the color follows the number shown, or 79.5 would read "80%" in yellow
    shown = round(percent)
    return {
        "schemaVersion": 1,
        "label": "coverage",
        "message": f"{shown}%",
        "color": badge_color(shown),
    }


def main() -> int:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    percent = report["totals"]["percent_covered"]
    BADGE_PATH.write_text(json.dumps(coverage_badge(percent=percent)), encoding="utf-8")
    print(f"coverage badge: {percent:.1f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
