**English** | [Italiano](./SECURITY.it.md)

# Security

## Supported Versions

The project has no numbered releases. Security fixes are applied to the latest commit on `main`, which is also the version published on GitHub Pages.

## Reporting a Vulnerability

To report a vulnerability, use [GitHub Security Advisories](https://github.com/AndreaBonn/campionato-promozione-26-27/security/advisories/new), not a public issue.

Please include:

- description of the problem;
- steps to reproduce it;
- expected and observed behavior;
- what an attacker could achieve.

Response timeline:

- acknowledgment within 72 hours;
- fix for critical issues within 30 days;
- coordinated public disclosure after the fix.

## Attack Surface

The page is static and has no login, forms, cookies or client-side secrets. The only external input is the data read from fip.it, from the FIP Sardegna WordPress API and, once enabled, from playbasket.it, during the sync on GitHub Actions.

## Security Measures Implemented

- **HTML escaping**: text coming from fip.it goes through the `esc` function before being inserted with `innerHTML` (`docs/page-rules.js:19`).
- **External link filter**: FIP Sardegna notices are accepted only if their link starts with `https://sardegna.fip.it/`, because the page uses it as an `href` (`src/fip_calendar/notices.py:52`).
- **Crest download limits**: crests are downloaded only from `https://backend.fip.it/`, the final URL after redirects is checked again, bodies over 8 MB are refused (`src/fip_calendar/fetch.py:67`), and Pillow decompression bombs are caught (`src/fip_calendar/logos.py:103`).
- **Minimal workflow permissions**: `contents: read` by default, `contents: write` only for the sync job, `pages: write` and `id-token: write` only for the deploy (`.github/workflows/sync-fip.yml`).
- **Actions pinned to SHA** and checkout with `persist-credentials: false` (`.github/workflows/sync-fip.yml`).
- **Locked dependencies**: `uv.lock` is versioned and installed in CI with `uv sync --frozen`.

There is no Content-Security-Policy on the page and no automated dependency scanning (Dependabot or similar).

## Out of Scope

- Errors or delays in the data published by FIP.
- Self-XSS, i.e. attacks that require the victim to paste code into their own console.
- Already disclosed vulnerabilities in third-party dependencies: report them to their maintainers.
- Availability of GitHub Pages and GitHub Actions.

---

[Back to README](./README.md)
