from pathlib import Path
from typing import Final, Literal

ROOT = Path(__file__).resolve().parents[2]
CALENDAR_PATH = ROOT / "data" / "calendario-comunicato.json"
OUTPUT_PATH = ROOT / "docs" / "data.json"

FIP_RESULTS_URL = "https://fip.it/risultati/"
# Divisione Regionale 2 Sardegna 2026/27, Girone Sud A, read from the fip.it/risultati menu
FIP_QUERY = {
    "group": "campionati-regionali",
    "regione_codice": "SA",
    "comitato_codice": "RSA",
    "sesso": "M",
    "codice_campionato": "PM",
    "codice_fase": "1",
    "codice_girone": "85793",
}
# Printable report of one round (results, referees, standings), the "Scarica giornata" button
FIP_ROUND_PDF_URL = "https://backend.fip.it/api/v1/giornata.pdf"
FIRST_HALF_CODE = 1  # fip.it uses codice_ar=1 for andata, 0 for ritorno
SECOND_HALF_CODE = 0
# FIP writes this date for a game whose date is not set yet (docs/page-rules.js DATE_TBD)
FIP_DATE_TBD = "2027-06-30"

USER_AGENT = "campionato-promozione-26-27 calendar sync (personal project)"
REQUEST_TIMEOUT_S = 30
REQUEST_DELAY_S = 1.0

PAGE_URL = "https://andreabonn.github.io/campionato-promozione-26-27/"
ICS_PATH = ROOT / "docs" / "calendario.ics"

FIP_SARDEGNA_POSTS_URL = "https://sardegna.fip.it/wp-json/wp/v2/posts"
# Full-text searches that may surface the 2026/27 format; titles are filtered afterwards
NOTICE_SEARCH_TERMS = ("formula", "playoff", "playout")
# WordPress category "CAMPIONATI REGIONALI": FIP Sardegna has no DR2 category, titles are filtered
NOTICE_CATEGORY_ID = 47
# Post type of the official comunicati. Other regional committees publish Giudice Sportivo
# decisions there; Sardegna had none at all on 2026-10-02 (X-WP-Total: 0)
FIP_SARDEGNA_COMUNICATI_URL = "https://sardegna.fip.it/wp-json/wp/v2/comunicato"
# Posts before the first 2026/27 regional calendar (23/09/2026) belong to the previous season
NOTICE_SINCE = "2026-09-23T00:00:00"
NOTICE_SEARCH_LIMIT = 20
# Last successful sync; not committed, published with the Pages artifact on every run
STATUS_PATH = ROOT / "docs" / "status.json"

# Club crests, copied from fip.it into the repository so the page never hotlinks FIP
LOGOS_DIR = ROOT / "docs" / "logos"
# fip.it serves crests from its Rails backend; any other host in an <img> is ignored
LOGO_SOURCE_PREFIX = "https://backend.fip.it/"
# FIP crests are A4 page scans of up to 2 MB; anything far larger is not a crest
LOGO_MAX_BYTES = 8_000_000
# shown at 24-40 CSS px: 128 px stays sharp on 3x screens
LOGO_MAX_SIDE_PX = 128

PLAYBASKET_MATCH_URL = "https://www.playbasket.it/sardegna/match.php"
# Not verified yet: "DR2" is the league code on playbasket.it/sardegna, the other values are
# the Serie C ones. Check them on the first Assemini Black box score before filling the aliases
PLAYBASKET_QUERY = {
    "lt": "2",
    "lr": "SA",
    "lp": "CA",
    "lc": "DR2",
    "lg": "1",
    "season": "2027",
    "lf": "M",
}
# third-party site: 5 s between pages, still under 5 minutes for a full 40-page run
PLAYBASKET_DELAY_S = 5.0
BOXSCORE_RETRY_DAYS = 14
PLAYBASKET_MATCHES_PER_ROUND = 6
PLAYBASKET_MAX_PAGES_PER_RUN = 40
# Playbasket gtt uses 1/2 for andata/ritorno; FIP codice_ar uses 1/0.
PLAYBASKET_FIRST_HALF = 1
PLAYBASKET_SECOND_HALF = 2
# Keep boxscores separate so they can load after the calendar's first render.
BOXSCORES_PATH = ROOT / "docs" / "boxscores.json"
# a Literal, not str: a mistyped status would silently stop the 14-day retry rules
BoxscoreStatus = Literal["complete", "partial", "incomplete", "unmatched"]
BOXSCORE_STATUS_COMPLETE: Final[BoxscoreStatus] = "complete"
BOXSCORE_STATUS_PARTIAL: Final[BoxscoreStatus] = "partial"
BOXSCORE_STATUS_INCOMPLETE: Final[BoxscoreStatus] = "incomplete"
BOXSCORE_STATUS_UNMATCHED: Final[BoxscoreStatus] = "unmatched"

# Playbasket name -> FIP name. Empty until the first DR2 box score shows how playbasket.it
# spells the teams: while empty, the sync skips playbasket.it entirely
PLAYBASKET_TEAM_ALIASES: dict[str, str] = {}
