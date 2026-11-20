# ChaatMap — Street Food Discovery Platform

Premium Indian street-food discovery platform: find authentic vendors, check
**transparent hygiene scores**, submit four-factor hygiene reviews, explore an
interactive map and walk curated food trails.

Brand: **ChaatMap** · Tagline: *Discover the Best Chaat & Street Food Near You!*

---

## Quick start (after unzipping)

**Option A — just view it (no install):**
double-click **`index.html`** in the repo root. Everything (CSS, JS, all 22
images) is inlined in that one file — it opens in any browser straight from
disk. Only the map tiles and Manrope font need internet; it degrades
gracefully without them. The app uses `localStorage` in this mode.

**Option B — run the source:**

```bash
cd chaatmap/react-app
npm install        # first time only
npm run dev        # → http://localhost:5173
```

**Option C — full stack (React + REST API + SQLite):**

```bash
cd chaatmap/react-app
npm install
npm run server     # → API at http://localhost:3001/api (SQLite persisted)
npm run dev        # in a second terminal — the client uses the API when it is up
```

The browser client probes `/api/health` on boot. When the API answers it uses
SQLite for reads and writes; otherwise it falls back to `localStorage`. Both
paths work with identical UI behaviour.

> Note: `node_modules/`, `dist/` and `coverage/` are excluded from the zip on
> purpose — `npm install`, `npm run build` and `npm run test:coverage` recreate them.

### All commands

```bash
npm run build          # production bundle → dist/
npm run build:single   # regenerate the one-file ../index.html (12.7 MB)
npm run preview        # serve the production build
npm run server         # Express API + SQLite (node:sqlite, no native build)
npm test               # 245 Vitest tests (libs, React, API over real HTTP)
npm run test:watch     # watch mode
npm run test:coverage  # coverage report → coverage/
npm run lint           # ESLint
npm run lint:fix       # auto-fix where safe
node scripts/smoke.mjs        # headless browser test (needs dev server)
node scripts/smoke-file.mjs   # verify the single-file build over file://
```

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@theme` brand tokens) |
| Routing | React Router v7 (`HashRouter` — works on GitHub Pages and `file://`) |
| Icons | Lucide React (+ inline SVG brand icons) |
| Maps | Leaflet + React Leaflet (OpenStreetMap tiles) |
| State | Context API + `useState` / `useEffect` |
| Persistence | REST API + SQLite (`node:sqlite`) with `localStorage` fallback |
| Testing | Vitest 5 + Testing Library + jsdom (245 tests) |
| Linting | ESLint 10 (flat config, react-hooks + react-refresh) |
| CI | GitHub Actions (lint → test → coverage → build → API smoke) |

Design system: Primary `#F45116` · Dark `#211B19` · Cream `#FFF7EF` ·
Border `#F2E2D6` · Success `#18864B` · Font **Manrope**.

---

## Pages (all routes implemented)

| # | Page | Route |
|---|------|-------|
| 1 | Home (hero, categories, vendors, why, trails, CTA) | `/` |
| 2 | Explore — split list + interactive map, filters | `/explore` |
| 3 | Food Categories | `/categories` |
| 4 | Vendor Details (dishes, photos, reviews, breakdown) | `/vendor/:id` |
| 5 | Interactive Map (full map + side list) | `/map` |
| 6 | Submit Hygiene Review | `/review` and `/review/:id` |
| 7 | Food Trails | `/trails` |
| 8 | About | `/about` |
| 9 | Sign In / Registration | `/auth` |
| 10 | Admin Dashboard | `/admin` |

Plus a styled 404 (`*`).

---

## Hygiene score — real calculation

Every displayed score is **derived from reviews**, never hardcoded:

```
Score = (0.40 × Water) + (0.25 × Covered Food) + (0.20 × Gloves) + (0.15 × Surroundings)
```

- Criteria are rated 0–5 (`src/lib/hygiene.js`).
- Vendor score = weighted formula applied to the **average of each criterion**
  across all reviews; customer rating = mean of star ratings.
- Submitting a review recalculates instantly (success screen shows before → after).
- Deleting a review in Admin recalculates too.
- `0` is a valid score; a vendor with no reviews shows `—`, never a fake number.

**Honest FSSAI:** a verified badge appears only when an admin toggles it in the
dashboard or calls `PATCH /api/vendors/:id/fssai` — there is no fake
verification anywhere.

---

## Architecture (3 tiers)

```
┌─────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
│ React client (browser)  │──▶│ Express REST API         │──▶│ SQLite (node:sqlite) │
│ src/lib/api.js          │   │ server/index.js          │   │ server/db.js         │
│ falls back to           │   │ validation + auth +      │   │ vendors/reviews/     │
│ localStorage when API   │   │ structured JSON logging  │   │ favorites tables     │
│ is unreachable          │   │                          │   │ seed from src/data   │
└─────────────────────────┘   └──────────────────────────┘   └──────────────────────┘
```

Shared code: `src/lib/validation.js` is imported by both React forms and the
API, so client and server enforce identical rules. `src/lib/optimizer.js`
provides the route/budget algorithms to both the browser and `POST /api/plan`.

Full API reference: [`docs/API.md`](docs/API.md) · OpenAPI 3.1 spec:
[`docs/openapi.yaml`](docs/openapi.yaml).

### Algorithms (innovation)

| Function | Algorithm | Use |
|---|---|---|
| `optimizeRoute` | Greedy nearest-neighbour + 2-opt local search | Shortest walking order for a food trail |
| `planBudgetTrip` | Greedy value/₹ fill + randomized local search (knapsack variant) | Pick vendors under a budget |
| `planDay` | Both of the above composed | Budget-aware itinerary endpoint |

---

## Key interactions (all working)

- Search from navbar/hero → Explore with query pre-applied (URL params)
- Category cards → Explore with category selected
- Trail cards → Explore showing only trail stops (clearable banner)
- Area selector (navbar + filters) filters vendors live
- Hygiene minimum filter (Any / 4.0+ / 4.5+ / 4.7+)
- Favourite hearts (vendor + trail) persist across refresh
- Interactive map: orange pins, popups with View Details, auto-fit bounds
- Mobile: hamburger menu, map/list toggle, no horizontal overflow (tested 360/390 px)
- Demo auth: any email/password; `admin@…` gets the Admin dashboard
  (role is derived server-side in the API — never trusted from the body)

---

## Testing & CI

245 tests across 8 files, all passing:

| Suite | What it covers |
|---|---|
| `src/lib/hygiene.test.js` | Weighted formula table, rounding, seed-data integrity, score derivation |
| `src/lib/validation.test.js` | Input validation edge cases, injection/overflow guards |
| `src/lib/optimizer.test.js` | Haversine geometry, nearest-neighbour, 2-opt, budget planner invariants |
| `server/api.test.js` | 53 API tests over real HTTP with in-memory SQLite (auth, FSSAI, errors, CORS, payload limits) |
| `src/components/*.test.jsx` | HygieneScore thresholds, VendorCard rendering + favourites |
| `src/context/AppContext.test.jsx` | Store actions, score recalculation, persistence/hydration |
| `src/pages/HygieneReview.test.jsx` | Form validation and before → after score update |

ESLint runs clean. GitHub Actions (`.github/workflows/ci.yml`) runs on every
push/PR: lint → test → coverage → production build → single-file build →
API boot check.

---

## Project structure

```
chaatmap/
├── docs/
│   ├── API.md                   # full REST reference
│   └── openapi.yaml             # OpenAPI 3.1 specification
├── .github/workflows/ci.yml     # lint + test + build pipeline
├── index.html                   # 12.7 MB single-file offline build
├── react-app/
│   ├── public/images/           # 22 real food photos (Wikimedia Commons)
│   ├── src/
│   │   ├── components/          # Navbar, VendorCard, VendorMap, HygieneScore…
│   │   ├── context/AppContext.jsx
│   │   ├── data/                # vendors, categories, trails (seed data)
│   │   ├── lib/
│   │   │   ├── hygiene.js       # weighted score + rating calculations
│   │   │   ├── validation.js    # shared client/server validators
│   │   │   ├── optimizer.js     # route + budget algorithms
│   │   │   └── api.js           # API client with localStorage fallback
│   │   └── pages/               # 10 pages + 404
│   ├── server/
│   │   ├── db.js                # SQLite schema, seed, queries
│   │   ├── index.js             # Express app + middleware + routes
│   │   ├── main.js              # server entry point
│   │   └── api.test.js          # API integration tests
│   ├── eslint.config.js
│   ├── vitest.config.js
│   └── scripts/                 # build-single + smoke tests
└── scripts/                     # image-fetch helpers
```

---

## Deployment

Live site: **https://cherry-tec.github.io/chaatmap/** (GitHub Pages)
Source: **https://github.com/CHERRY-TEC/chaatmap**

The client uses `HashRouter`, so it works both at a Pages sub-path and from
`file://` with no server rewrite rules. To run the API in production, deploy
`server/` to any Node 24 host, set `CORS_ORIGINS` and `CHAATMAP_DB`, and point
`VITE_API_URL` at it when building the client.

---

## Known limitations

- **Demo auth** — sign-in is local and the `x-chaatmap-user` header is not a
  real session. Swap in a signed session/JWT before exposing the API publicly.
- **Vendor photo uploads** — community photos currently use the bundled gallery.
- **FSSAI verification is manual by design** — no external licence API check.
