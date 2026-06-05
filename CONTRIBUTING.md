# Contributing to keyless-apis

Thanks for adding an API! The rule is simple: **one PR = one entry in `data/apis.json`**.

CI runs the checker on your entry automatically — if it fails, the PR fails. This keeps the catalog honest.

## Requirements for a new entry

An API qualifies if it meets **all three**:

1. **No API key** — works without any authentication, forever. Free-tier keys that expire or require signup don't count.
2. **CORS-enabled** — a real browser `fetch()` works without errors. Our CI verifies this with Playwright/Chromium.
3. **Publicly accessible** — no login, no IP restriction, no approval required.

**Preferred:** HTTPS (`https: true`). HTTP-only APIs are accepted but flagged.

## JSON schema

Add your entry to the `apis` array in `data/apis.json`:

```json
{
  "id": "my-api-name",
  "name": "My API",
  "category": "Category",
  "description": "One sentence — what it does, any caveats (rate limits, etc.)",
  "test_url": "https://api.example.com/endpoint?param=value",
  "docs_url": "https://example.com/docs",
  "https": true,
  "auth": "none",
  "expects": {
    "status": 200,
    "content_type": "application/json"
  }
}
```

### Field reference

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Kebab-case, unique. E.g. `open-meteo-forecast` |
| `name` | string | Human-readable name |
| `category` | string | One of: Weather, Geo, Finance, Art, Literature, Language, Trivia, Food, Fun, Animals, Social, Science, Calendar, Books, Dev — or a new one |
| `description` | string | One sentence. Mention rate limits or caveats. |
| `test_url` | string | Full URL the checker will call. Should return a stable response. |
| `docs_url` | string | Link to official docs |
| `https` | boolean | `true` for HTTPS, `false` for HTTP-only |
| `auth` | string | Always `"none"` |
| `expects.status` | integer | Expected HTTP status code (usually `200`) |
| `expects.content_type` | string | Expected Content-Type (e.g. `application/json`, `image/jpeg`) |

## Test locally before submitting

```bash
npm install
npx playwright install chromium

# Test only your new entry
npm run check -- --only-ids=your-api-id
```

Expected output shows `🟢 ✅ CORS [playwright]` for a passing entry.

## PR checklist

- [ ] Entry added to `data/apis.json` (valid JSON, no trailing commas)
- [ ] `id` is unique (check existing entries)
- [ ] `test_url` returns a stable, sensible response without a key
- [ ] `description` mentions any rate limits or caveats
- [ ] Local test passes: `npm run check -- --only-ids=your-id`

## Edge cases

- **Rate-limited APIs** (e.g. Nominatim: 1 req/s): mention in description, CI will serialize them
- **HTTP-only**: set `"https": false` — they're accepted but documented as such
- **Test keys** (e.g. TheMealDB key `"1"`): accepted — these are publicly documented test keys, not real auth
- **Unstable APIs**: mention in description; if they fail CI consistently they'll be removed
