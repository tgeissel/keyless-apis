# keyless-apis

A catalog of public APIs that require no API key and support CORS for browser use. Every entry is automatically tested weekly — uptime, HTTPS, and a real browser `fetch()` for CORS.

<!-- BADGE:START -->
![API Status](https://img.shields.io/badge/APIs-0%25%20live-red)  ![Last Check](https://img.shields.io/badge/last%20check-2026--06--05-blue)
<!-- BADGE:END -->

Machine-readable: [`data/apis.json`](data/apis.json) · [`results/status.json`](results/status.json)

## API Status

<!-- STATUS:START -->
*Last generated: 2026-06-05T11:31:38.421Z — 0/1 APIs live, 0 CORS-verified*

| Name | Category | CORS | Status | Last Checked |
|------|----------|------|:------:|:------------:|
| NASA APOD |  | ❓ Unknown *(unknown)* | 🔴 | 2026-06-05 |
<!-- STATUS:END -->

## Usage

```bash
# Install dependencies
npm install
npx playwright install chromium

# Run full check (header inspect + Playwright CORS verify)
npm run check

# Fast check (header-only, no browser launch)
npm run check:header-only

# Check specific APIs only
npm run check -- --only-ids=open-meteo-forecast,rest-countries

# Regenerate README status table from latest results
npm run generate-readme
```

## How CORS is tested

CORS is browser-only — a server-side curl tells you nothing. Two steps:

1. **Header check**: OPTIONS preflight with `Origin: http://localhost`. If `Access-Control-Allow-Origin: *` comes back, done.
2. **Playwright verify**: For ambiguous cases, a headless Chromium runs a real `fetch()` and catches CORS errors.

Timeouts are stored as `unknown`, not `false`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). One PR = one entry in `data/apis.json`. CI checks it automatically.

## License

MIT
