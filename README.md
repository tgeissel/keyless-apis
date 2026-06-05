# keyless-apis

A catalog of public APIs that require no API key and support CORS for browser use. Every entry is automatically tested weekly — uptime, HTTPS, and a real browser `fetch()` for CORS.

<!-- BADGE:START -->
![API Status](https://img.shields.io/badge/APIs-100%25%20live-brightgreen)  ![Last Check](https://img.shields.io/badge/last%20check-2026--06--05-blue)
<!-- BADGE:END -->

Machine-readable: [`data/apis.json`](data/apis.json) · [`results/status.json`](results/status.json)

## API Status

<!-- STATUS:START -->
*Last generated: 2026-06-05T11:32:11.993Z — 32/32 APIs live, 32 CORS-verified*

| Name | Category | CORS | Status | Last Checked |
|------|----------|------|:------:|:------------:|
| [Open-Meteo](https://open-meteo.com/en/docs) | Weather | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Weather | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Nominatim OSM](https://nominatim.org/release-docs/latest/api/Search/) | Geo | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [REST Countries](https://restcountries.com/) | Geo | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Frankfurter](https://www.frankfurter.app/docs) | Finance | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Art Institute Chicago](https://api.artic.edu/docs/) | Art | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [PoetryDB](https://poetrydb.org/) | Literature | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Datamuse](https://www.datamuse.com/api/) | Language | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Open Trivia DB](https://opentdb.com/api_config.php) | Trivia | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [TheMealDB](https://www.themealdb.com/api.php) | Food | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [TheCocktailDB](https://www.thecocktaildb.com/api.php) | Food | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Advice Slip](https://api.adviceslip.com/) | Fun | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Cat Facts](https://catfact.ninja/) | Animals | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Dog CEO](https://dog.ceo/dog-api/) | Animals | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Genderize](https://genderize.io/) | Social | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Agify](https://agify.io/) | Social | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Nationalize](https://nationalize.io/) | Social | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [USGS Earthquakes](https://earthquake.usgs.gov/fdsnws/event/1/) | Science | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [ISS Position](http://open-notify.org/) | Science | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Nager.Date](https://date.nager.at/) | Calendar | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Open Brewery DB](https://www.openbrewerydb.org/) | Food | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Sunrise Sunset](https://sunrise-sunset.org/api) | Science | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Free Dictionary](https://dictionaryapi.dev/) | Language | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [JSONPlaceholder](https://jsonplaceholder.typicode.com/) | Dev | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Random User](https://randomuser.me/) | Dev | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Open Library](https://openlibrary.org/developers/api) | Books | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [GitHub Zen](https://docs.github.com/en/rest) | Dev | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [wttr.in](https://wttr.in/:help) | Weather | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Open Food Facts](https://world.openfoodfacts.org/data) | Food | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Jikan](https://jikan.moe/) | Entertainment | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [Zippopotam](https://www.zippopotam.us/) | Geo | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
| [ip-api](https://ip-api.com/docs) | Network | ✅ Yes *(header)* | 🟢 | 2026-06-05 |
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
