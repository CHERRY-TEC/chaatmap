# ChaatMap REST API

The API is tier 2 of ChaatMap's three-tier architecture:

```
React client  ──HTTP──>  Express API  ──SQL──>  SQLite (node:sqlite)
```

The browser app **degrades gracefully**: it probes `/api/health` on boot and
uses the API when available; otherwise it falls back to `localStorage`. This
means the single-file build (`index.html`) and GitHub Pages site keep working
with no backend, while a full stack deployment gets SQLite persistence and
the route/budget optimizers.

A machine-readable OpenAPI 3.1 specification lives in
[`openapi.yaml`](./openapi.yaml).

---

## Quick start

```bash
cd react-app
npm install
npm run server            # http://localhost:3001/api
```

Configuration (environment variables):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP listen port |
| `CHAATMAP_DB` | `data/chaatmap.db` | SQLite file (`:memory:` for a throwaway DB) |
| `CORS_ORIGINS` | localhost:5173, 5180, 4173, cherry-tec.github.io | Comma-separated CORS allow-list |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

`GET /api/health` is an unauthenticated liveness probe.

---

## Conventions

- All routes are prefixed with `/api`. All request and response bodies are JSON.
- Every response carries an `X-Request-Id` header. Send your own
  `[A-Za-z0-9_-]{1,64}` value in `X-Request-Id` to propagate a trace id.
- Mutations other than `/plan`, `/routes/optimize` and favourites require the
  `X-Chaatmap-User` header containing the caller's email. Admin role is
  **derived server-side** from the `admin@` prefix — a `role` field in the
  request body is ignored.
- Validation failures return `422` with
  `{ "error": "validation_failed", "errors": { field: message } }`.
  The validators in `src/lib/validation.js` are shared with the React forms.
- Bodies larger than 32 KB are rejected with `413`.
- Unknown routes return `404` with JSON. Errors never expose stack traces.

### Error codes

| Status | `error` | Meaning |
|---|---|---|
| 400 | `bad_json` | Malformed JSON body |
| 401 | `unauthenticated` | Missing `X-Chaatmap-User` on a protected route |
| 403 | `forbidden` | Non-admin attempted an admin action |
| 404 | `not_found` / `vendor_not_found` / `review_not_found` | Resource missing |
| 413 | `payload_too_large` | Body over 32 KB |
| 422 | `validation_failed` | Invalid input (see `errors`) |
| 500 | `internal_error` | Unexpected failure (logged with the request id) |

---

## Endpoints

### Health & stats

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | `{ status, time, requestId }` |
| GET | `/api/stats` | – | Aggregate counts from SQLite |

`GET /api/stats` response:

```json
{ "vendors": 8, "reviews": 24, "verified": 2, "areas": 6, "path": "data/chaatmap.db" }
```

### Vendors

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vendors` | – | List vendors with computed scores; supports filters |
| GET | `/api/vendors/:id` | – | One vendor with its reviews |

Filters for `GET /api/vendors` (query string):

| Param | Example | Behaviour |
|---|---|---|
| `category` | `dosa` | Exact category match; `all` disables |
| `area` | `Sindhi%20Colony` | Exact area match; `Hyderabad` disables |
| `q` | `pani%20pur` | Case-insensitive search across name, specialty, area and dish names |
| `minHygiene` | `4.7` | Keep vendors whose derived hygiene score is ≥ this |

Response for `GET /api/vendors`:

```json
{
  "count": 8,
  "vendors": [
    {
      "id": "mahalaxmi-chaat-center",
      "name": "Mahalaxmi Chaat Center",
      "category": "chaat",
      "specialty": "Pani puri & sev puri",
      "area": "Sindhi Colony",
      "lat": 17.4421,
      "lng": 78.4814,
      "priceMin": 30,
      "priceMax": 80,
      "openNow": true,
      "fssaiVerified": true,
      "reviews": [],
      "hygieneScore": 4.8,
      "rating": 4.7,
      "reviewCount": 3
    }
  ]
}
```

`hygieneScore` is always calculated from reviews with the weighted formula:

```
(0.40 × water) + (0.25 × covered) + (0.20 × gloves) + (0.15 × surroundings)
```

A vendor with no reviews returns `null` for `hygieneScore` and `rating` — the
API never fabricates a number.

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/vendors/:id/reviews` | user | Add a hygiene review; returns before/after score |
| DELETE | `/api/reviews/:id` | **admin** | Delete a review (`204`, no body) |

`POST` body (all criteria required, each an integer 0–5):

```json
{
  "author": "Aarav Reddy",
  "stars": 5,
  "water": 5,
  "covered": 4,
  "gloves": 4,
  "surroundings": 5,
  "comment": "Clean counter and fresh pani."
}
```

`201` response:

```json
{
  "review": {
    "id": "rmmabc123",
    "vendorId": "mahalaxmi-chaat-center",
    "author": "Aarav Reddy",
    "stars": 5,
    "water": 5, "covered": 4, "gloves": 4, "surroundings": 5,
    "comment": "Clean counter and fresh pani.",
    "date": "2026-11-20"
  },
  "vendor": { "...": "vendor with the new review attached" },
  "hygiene": { "before": 4.8, "after": 4.9, "changed": true }
}
```

> `0` is a valid rating. Omitting a criterion yields `422` — "unset" is not
> treated as zero. Unknown fields (`role`, `fssaiVerified`, `id`) are ignored.

### FSSAI verification (admin only)

| Method | Path | Auth | Description |
|---|---|---|---|
| PATCH | `/api/vendors/:id/fssai` | **admin** | Set the verification flag |

```json
{ "verified": true }
```

→ `{ "id": "mahalaxmi-chaat-center", "fssaiVerified": true }`

This is the **only** code path that can set an FSSAI badge. The UI never
grants one automatically, so there is no fake verification.

### Favourites

| Method | Path | Description |
|---|---|---|
| GET | `/api/favorites` | List favourited vendor ids |
| POST | `/api/favorites/:id` | Add (idempotent), returns `201` + updated list |
| DELETE | `/api/favorites/:id` | Remove, returns updated list |

### Itinerary & routing (optimization algorithms)

| Method | Path | Description |
|---|---|---|
| POST | `/api/plan` | Budget-constrained day plan |
| POST | `/api/routes/optimize` | Shortest walking order for a set of stops |

`/api/plan` body:

```json
{ "budget": 500, "maxStops": 4, "startId": "mahalaxmi-chaat-center" }
```

`budget` must be 0–100000; `maxStops` an integer 1–20. The planner uses
**greedy value-per-rupee selection + randomized local search** (a knapsack
variant), then orders the picked stops with **nearest-neighbour + 2-opt**
route optimization.

`/api/routes/optimize` body:

```json
{ "stops": [{ "id": "a", "lat": 17.4, "lng": 78.4 }, { "id": "b", "lat": 17.5, "lng": 78.5 }], "startIndex": 0 }
```

→ `{ "order": [0, 1], "stops": [...], "distanceKm": 14.2, "improvements": 0, "algorithm": "nearest-neighbour+2-opt" }`

Coordinates without a valid numeric `lat`/`lng` are ignored; fewer than two
valid stops yields `422`.

---

## Logging

Every request produces one JSON log line:

```json
{"time":"2026-11-20T16:26:48.891Z","level":"info","msg":"request","id":"trace-123","method":"GET","path":"/api/vendors","status":200,"ms":3.2}
```

Domain events (`review.created`, `review.deleted`, `fssai.updated`) are logged
with the same request id, so a write can be traced end-to-end.

---

## Tests

The full suite (245 tests) exercises the API over real HTTP against an
in-memory SQLite database:

```bash
npm test          # all tests (vitest)
npm run test:coverage
```

See [`README.md`](../README.md) for the full development setup.
