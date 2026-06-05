# Projekt-Brief: `keyless-apis`

> Übergib dieses Dokument als ersten Auftrag an Claude Code im leeren Repo.
> Es enthält Ziel, Architektur, die offene Kernfrage (CORS-Prüfung) und eine Seed-Liste.

---

## 1. Was wir bauen

Einen **live-geprüften, maschinenlesbaren Katalog öffentlicher APIs, die (a) keinen API-Key brauchen und (b) CORS für Browser-Aufrufe erlauben.**

Der Unterschied zu bestehenden Listen (`public-apis`, `public-apis-no-auth-only`, diverse Blog-Listen): Die sind statisches Markdown mit toten Links und falschen/unklaren CORS-Angaben. **Unser Repo testet sich selbst per CI** und gibt den geprüften Stand als JSON aus.

**Der Graben gegen Kopien ist die Automatik, nicht die Daten.** Fokus liegt auf der selbst-testenden Pipeline + dem konsumierbaren `apis.json`.

### Nicht-Ziele (bewusst weglassen)
- Keine APIs mit Key/Login/OAuth (auch keine „kostenlosen" Tiers mit Key).
- Kein User-Account, kein Tracking, keine SaaS-Schicht.
- Keine Riesen-Breite à la public-apis um jeden Preis — lieber kuratiert + verlässlich.

---

## 2. Die technische Kernfrage (bitte zuerst klären)

**Wie testet man CORS zuverlässig automatisiert?** Das ist der eigentliche Wert und der knifflige Teil.

- Ein simpler Server-seitiger `fetch`/`curl` sagt **nichts** über CORS — CORS ist eine reine Browser-Policy. Ein Endpoint kann serverseitig 200 liefern und im Browser trotzdem an CORS scheitern.
- Optionen, die Claude Code abwägen und mir/uns empfehlen soll:
  1. **Headless-Browser** (Playwright/Puppeteer): echten `fetch()` aus einer Origin gegen den Endpoint feuern, prüfen ob er ohne CORS-Fehler durchkommt. Am ehesten „die Wahrheit", aber schwerer/langsamer in CI.
  2. **Header-Inspektion**: `Access-Control-Allow-Origin` etc. per Preflight/Response-Header auswerten. Schneller, aber Header ≠ garantiert funktionierender Browser-Call (Edge-Cases, Methoden, Credentials).
  3. **Hybrid**: Header-Check als schneller Vorfilter, Headless-Browser-Stichprobe zur Verifikation.
- **Auftrag an Claude Code:** kurz die Optionen real durchspielen (an 3–5 Seed-APIs), Trade-offs zeigen, eine Methode empfehlen und umsetzen. Lieber wenige Einträge *korrekt* als viele *behauptet*.

Zusätzlich pro Eintrag prüfen: **Uptime** (antwortet er?), **HTTPS**, **Auth=none** (Heuristik: kommt ohne Key ein sinnvoller 2xx?), **letzter Check-Zeitstempel**.

---

## 3. Architektur (Vorschlag, gern hinterfragen)

```
/data
  apis.json            # die kuratierte Quelle der Wahrheit (von Menschen gepflegt)
/results
  status.json          # generiert: pro API der letzte Prüf-Status (CI schreibt das)
/checker
  index.(ts|py)        # Checker: liest apis.json, prüft Uptime/HTTPS/CORS, schreibt status.json
/web                   # optional, Phase 2: statische Mini-UI mit Filter (CORS/Domäne/Status)
/.github/workflows
  check.yml            # GitHub Action: läuft wöchentlich + bei PRs, ruft den Checker auf
README.md              # Pitch + Badge + „so trägst du eine API bei"
CONTRIBUTING.md        # PR-Format für neue APIs
```

**Sprache:** Claude Code soll wählen und begründen. Tendenz: TypeScript/Node (wegen Playwright + npm-Ökosystem für CORS/Fetch) oder Python. Wichtig: in CI gut lauffähig.

### Datenschema `apis.json` (Entwurf — verfeinern)
```json
{
  "$schema": "./schema.json",
  "apis": [
    {
      "id": "open-meteo-forecast",
      "name": "Open-Meteo",
      "category": "Weather",
      "description": "Wettervorhersage, kein Key.",
      "test_url": "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m",
      "docs_url": "https://open-meteo.com/en/docs",
      "https": true,
      "auth": "none",
      "expects": { "status": 200, "content_type": "application/json" }
    }
  ]
}
```
Der Checker reichert das zu `status.json` an mit: `cors` (true/false/unknown + Methode), `up` (bool), `last_checked`, `response_ms`, `notes`.

### README muss enthalten
- Ein-Satz-Pitch: „Öffentliche APIs ohne Key, mit **bewiesener** CORS-Tauglichkeit — wöchentlich automatisch getestet."
- Live-Badge (Anteil grüner APIs) + Link zum `apis.json`.
- Tabelle wird **aus `status.json` generiert** (nicht von Hand gepflegt) → Spalten: Name, Kategorie, CORS, Status, zuletzt geprüft.
- „So trägst du eine API bei": ein PR mit einem Eintrag in `apis.json`, CI prüft ihn automatisch im PR (= Self-Service-Qualitätsgate, zieht Contributors).

---

## 4. Erste Schritte für Claude Code (in dieser Reihenfolge)

1. Repo-Grundgerüst + Sprache wählen/begründen, `apis.json`-Schema finalisieren.
2. **CORS-Prüfung evaluieren** (siehe §2): die Optionen an 3–5 Seed-APIs real durchspielen, eine empfehlen, umsetzen.
3. Checker schreiben: liest `apis.json`, prüft alle Seed-APIs, schreibt `results/status.json`.
4. Tabellen-Generator: `status.json` → README-Abschnitt (oder separate `STATUS.md`).
5. GitHub Action `check.yml`: wöchentlich (cron) + bei PRs; committet aktualisiertes `status.json`/Badge.
6. README + CONTRIBUTING mit dem Pitch oben.
7. (Phase 2) optionale statische Web-UI mit Filtern.

**Arbeitsweise:** Immer real ausführen, nicht blind schreiben. Lieber 20 Einträge verlässlich grün als 200 behauptet. Edge-Cases (Rate-Limit, Redirects, langsame APIs) sauber als `unknown` statt false behandeln.

---

## 5. Seed-Liste (Start-Kandidaten, keylos — im Checker verifizieren!)

> Diese sind nach meinem Stand keylos; **CORS/Uptime müssen vom Checker bewiesen werden**, nicht angenommen. Aussortieren, was durchfällt.

- **Open-Meteo** (Wetter) — `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m`
- **Open-Meteo Air Quality** — `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.5&longitude=13.4&hourly=pm10`
- **Nominatim / OSM** (Geocoding) — `https://nominatim.openstreetmap.org/search?q=berlin&format=json` (Achtung: Usage-Policy, Rate-Limit)
- **REST Countries** — `https://restcountries.com/v3.1/name/germany`
- **Frankfurter** (Wechselkurse) — `https://api.frankfurter.app/latest?from=EUR&to=USD`
- **Art Institute of Chicago** — `https://api.artic.edu/api/v1/artworks/search?q=monet`
- **PoetryDB** — `https://poetrydb.org/random/1`
- **Datamuse** — `https://api.datamuse.com/words?rel_rhy=test`
- **Open Trivia DB** — `https://opentdb.com/api.php?amount=3`
- **TheMealDB** (Test-Key „1") — `https://www.themealdb.com/api/json/v1/1/random.php`
- **TheCocktailDB** (Test-Key „1") — `https://www.thecocktaildb.com/api/json/v1/1/random.php`
- **Numbers API** — `http://numbersapi.com/42` (Achtung: HTTP! → HTTPS-Flag = false)
- **Bored API / Activity** — `https://bored-api.appbrewery.com/random`
- **Advice Slip** — `https://api.adviceslip.com/advice`
- **Cat Facts** — `https://catfact.ninja/fact`
- **Dog CEO** (Hundebilder) — `https://dog.ceo/api/breeds/image/random`
- **Genderize** — `https://api.genderize.io/?name=alex` (Free-Tier, ggf. Tageslimit)
- **Agify** — `https://api.agify.io/?name=alex`
- **Nationalize** — `https://api.nationalize.io/?name=alex`
- **USGS Earthquakes** — `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1`
- **Open Notify ISS Position** — `http://api.open-notify.org/iss-now.json` (HTTP + evtl. instabil → gut als Negativtest)
- **Nager.Date** (Feiertage) — `https://date.nager.at/api/v3/PublicHolidays/2026/DE`
- **Gutendex** (gemeinfreie Bücher) — `https://gutendex.com/books?search=verne`
- **Open Brewery DB** — `https://api.openbrewerydb.org/v1/breweries?by_city=berlin`
- **Fruityvice** — `https://www.fruityvice.com/api/fruit/banana`
- **Sunrise-Sunset** — `https://api.sunrise-sunset.org/json?lat=52.5&lng=13.4`
- **HTTP Cat** (Status-Bilder) — `https://http.cat/404`
- **Free Dictionary** — `https://api.dictionaryapi.dev/api/v2/entries/en/hello`
- **JSONPlaceholder** (Test-Daten) — `https://jsonplaceholder.typicode.com/todos/1`
- **Random User** — `https://randomuser.me/api/`

> Die Liste ist Startpunkt, kein Endzustand. Genau dieses „behauptet keylos/CORS, aber stimmt das heute noch?" ist das Problem, das das Repo löst — also durchmessen statt glauben.

---

## 6. Erfolg = Positionierung

Beim Launch (Show HN / r/webdev / r/selfhosted) ist die Botschaft nicht „noch eine Liste", sondern:
**„Die einzige Liste, die *beweist*, dass jeder Eintrag heute lebt und CORS wirklich kann — automatisch getestet."**
Ein gutes README mit Live-Badge + GIF des Checkers ist die halbe Miete.
