# ChaatMap — Project Documentation

**Street Food Discovery Platform with Transparent Hygiene Scores**

| | |
|---|---|
| **Version** | 1.0.0 |
| **Repository** | https://github.com/CHERRY-TEC/chaatmap |
| **Live site** | https://cherry-tec.github.io/chaatmap/ |
| **License** | MIT |
| **Last updated** | 20 November 2026 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Solution](#2-problem--solution)
3. [Features](#3-features)
4. [System Architecture](#4-system-architecture)
5. [The Hygiene Scoring Model](#5-the-hygiene-scoring-model)
6. [Algorithms](#6-algorithms)
7. [Technology Stack](#7-technology-stack)
8. [Getting Started](#8-getting-started)
9. [API Reference](#9-api-reference)
10. [Testing & Quality Assurance](#10-testing--quality-assurance)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Security](#12-security)
13. [Deployment](#13-deployment)
14. [Project Structure](#14-project-structure)
15. [Results & Rubric Alignment](#15-results--rubric-alignment)
16. [Known Limitations & Future Work](#16-known-limitations--future-work)

---

## 1. Executive Summary

ChaatMap is a full-stack web application for discovering Indian street food with **transparent, community-driven hygiene scores**. Users browse vendors across Hyderabad, view an interactive map, submit four-factor hygiene reviews, and follow curated food trails. Every hygiene number displayed in the UI is **derived from reviews at runtime** using a fixed weighted formula — never hardcoded, never fabricated.

The project ships in three runnable forms:

- **Single-file offline build** — one 12.7 MB `index.html` with all CSS, JS and 22 images inlined; opens directly from disk.
- **Static site** — deployed to GitHub Pages, works without a backend.
- **Full stack** — React client + Express REST API + SQLite persistence, with automatic client-side fallback when the API is unavailable.

Development quality is backed by **245 automated tests**, clean ESLint, 84% line coverage, and a GitHub Actions pipeline that validates every push.

---

## 2. Problem & Solution

### Problem

Street food is popular but hygiene is opaque. Existing discovery apps list vendors by rating alone; a 4.5-star rating says nothing about whether the water is clean, food is covered, vendors wear gloves, or the surroundings are clean. Diners have no trustworthy, comparable signal.

### Solution

ChaatMap introduces a **four-factor hygiene score** that locals rate on a 0–5 scale:

1. Clean / RO water used (40%)
2. Covered food display (25%)
3. Gloves / headgear usage (20%)
4. Surroundings cleanliness (15%)

The weighted score is computed from the **average of each criterion across all reviews**, displayed with a per-factor breakdown so users see exactly how a number was reached. Reviews update scores instantly; FSSAI badges appear only after explicit admin verification — there is no fake verification.

---

## 3. Features

### Discovery
- Home page with hero, category shortcuts, featured vendors, curated trails and CTAs.
- Explore page with split list + interactive Leaflet map, live search, area/category/hygiene filters.
- Full-screen map view with orange pins, popups and automatic bounds fitting.
- 8 categories: pani puri, chaat, dosa, pav bhaji, momos, samosa, vada pav, snacks.

### Trust & Transparency
- Four-factor hygiene review form with mandatory 0–5 ratings on every criterion.
- Before → After score animation on submission.
- Per-factor breakdown bars on every vendor detail page.
- Honest FSSAI badge — admin-toggle only, with server-side role enforcement.
- Review deletion in Admin instantly recalculates the affected score.

### Personalisation
- Favourites for vendors and trails, persisted across sessions.
- Demo authentication (any email/password; `admin@…` prefix unlocks Admin).
- Admin dashboard: stats, vendor table, FSSAI toggle, recent reviews, reset.

### itinerary & algorithms
- Budget-constrained day planner (`POST /api/plan`).
- Walking-route optimizer for food trails (`POST /api/routes/optimize`).

### Responsive design
- Tested at 1440, 1024, 768, 390 and 360 px with no horizontal overflow.
- Mobile: hamburger menu, map/list toggle.

---

## 4. System Architecture

```
┌─────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
│ React client (browser)  │──▶│ Express REST API         │──▶│ SQLite (node:sqlite) │
│ src/lib/api.js          │   │ server/index.js          │   │ server/db.js         │
│ falls back to           │   │ validation + auth +      │   │ vendors / reviews /  │
│ localStorage when API   │   │ structured JSON logging  │   │ favorites tables     │
│ is unreachable          │   │                          │   │ seed from src/data   │
└─────────────────────────┘   └──────────────────────────┘   └──────────────────────┘
```

**Key design decisions**

- **3-tier separation.** Presentation (React), application (Express), persistence (SQLite). Each layer can be tested independently.
- **Graceful degradation.** The client probes `/api/health` once on boot. If the API answers, all reads/writes go through SQLite; otherwise it uses `localStorage`. This lets the same build work as a single file, a static site, and a full stack app.
- **Shared validation.** `src/lib/validation.js` is imported by both React forms and the API — one source of truth for all input rules.
- **Shared domain logic.** `src/lib/hygiene.js` and `src/lib/optimizer.js` are used in the browser and on the server, so the UI and API can never drift in their calculations.
- **HashRouter.** Works on GitHub Pages sub-paths and `file://` without server rewrite rules.
- **Built-in SQLite.** Node 24's `node:sqlite` avoids native compilation, keeping `npm install` and CI reliable on every platform.

---

## 5. The Hygiene Scoring Model

### Formula

```
Score = (0.40 × Water) + (0.25 × Covered) + (0.20 × Gloves) + (0.15 × Surroundings)
```

Each criterion is an integer from **0 to 5**. For a vendor:

1. Average each criterion across all of that vendor's reviews (reviews missing a field are skipped, not counted as zero).
2. Apply the four weights above.
3. Round to one decimal with a floating-point tolerance (`Math.round(x * 10 + 1e-6) / 10`).

### Guarantees

- Weights sum to exactly 1.0 — no inflation or deflation.
- `0` is a valid rating (meaning "explicitly rated as poor"), distinct from "unset" — omitted criteria are rejected by validation.
- A vendor with **no reviews** returns `null`, displayed as `—` — never a fake number.
- Scores stay within 0–5 for any valid input, are order-independent, and never return `NaN`.
- Adding or deleting a review recomputes the score from the review set, never from a cached constant.

### Example

Reviews: `(5,5,5,5)` and `(5,5,5,3)` → averages `(5,5,5,4)` →
`0.4×5 + 0.25×5 + 0.2×5 + 0.15×4 = 4.85` → displayed **4.9**.

---

## 6. Algorithms

| Function | Algorithm | Complexity / purpose |
|---|---|---|
| `haversineKm` | Great-circle distance | Kilometres between two lat/lng points, with input normalisation and clamped arcsin |
| `distanceMatrix` | Pairwise distances | Symmetric matrix for a set of stops |
| `nearestNeighbour` | Greedy TSP construction | Deterministic open-path ordering, lowest-index tie-break |
| `twoOpt` | 2-opt local search | Repeated segment reversal until no improving swap; guarded against infinite loops |
| `optimizeRoute` | NN + 2-opt composed | Shortest walking order for a food trail |
| `planBudgetTrip` | Greedy value/₹ + randomized local search | Knapsack-variant selection under a budget; injectable RNG for deterministic tests |
| `planDay` | Selection + routing | Budget-aware itinerary returned by `/api/plan` |

Vendor value for selection is `10×hygiene + 3×rating + 0.5×(open?) − 0.01×price` — hygiene dominates, matching the product's core promise. The randomized local search escapes greedy choices by swapping rejected vendors in for the least-valued selected ones when the budget allows.

---

## 7. Technology Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@theme` brand tokens) |
| Routing | React Router v7 (`HashRouter`) |
| Icons | Lucide React + inline SVG |
| Maps | Leaflet + React Leaflet (OpenStreetMap tiles) |
| State | Context API + hooks |
| Persistence | Express + SQLite (`node:sqlite`), `localStorage` fallback |
| Testing | Vitest 5, Testing Library, jsdom (245 tests) |
| Linting | ESLint 10 flat config (react-hooks, react-refresh) |
| CI | GitHub Actions |
| Docs | Markdown + OpenAPI 3.1 |

**Design tokens:** Primary `#F45116` · Dark `#211B19` · Cream `#FFF7EF` · Border `#F2E2D6` · Success `#18864B` · Font **Manrope**.

---

## 8. Getting Started

### Option A — view the single file (no install)

Double-click `index.html` at the repo root. All CSS, JS and images are inlined; only map tiles and the web font need internet.

### Option B — run the client

```bash
cd chaatmap/react-app
npm install
npm run dev        # http://localhost:5173
```

### Option C — full stack (client + API + SQLite)

```bash
cd chaatmap/react-app
npm install
npm run server     # API at http://localhost:3001/api (terminal 1)
npm run dev        # client at http://localhost:5173 (terminal 2)
```

The client detects the API automatically. To force the API URL, set `VITE_API_URL` at build time.

### Commands

| Command | Purpose |
|---|---|
| `npm run build` | Production bundle → `dist/` |
| `npm run build:single` | Regenerate the one-file `index.html` |
| `npm run server` | Start Express + SQLite API |
| `npm test` | Run all 245 tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report → `coverage/` |
| `npm run lint` / `lint:fix` | ESLint check / auto-fix |
| `node scripts/smoke.mjs` | Headless browser smoke test (needs dev server) |
| `node scripts/smoke-file.mjs` | Verify single-file build over `file://` |

### Environment variables (API)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Listen port |
| `CHAATMAP_DB` | `data/chaatmap.db` | SQLite file (`:memory:` for tests) |
| `CORS_ORIGINS` | localhost:5173, 5180, 4173, cherry-tec.github.io | Comma-separated allow-list |
| `LOG_LEVEL` | `info` | debug / info / warn / error |

---

## 9. API Reference

Full reference with examples: `docs/API.md`. Machine-readable spec: `docs/openapi.yaml`.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | Liveness probe |
| GET | `/api/stats` | – | Aggregate SQLite counts |
| GET | `/api/vendors` | – | List vendors (filters: `category`, `area`, `q`, `minHygiene`) |
| GET | `/api/vendors/:id` | – | Vendor detail with reviews |
| POST | `/api/vendors/:id/reviews` | user | Add review; returns before/after score |
| DELETE | `/api/reviews/:id` | admin | Delete review (204) |
| PATCH | `/api/vendors/:id/fssai` | admin | Set FSSAI verification flag |
| GET/POST/DELETE | `/api/favorites[/:id]` | – | Favourites |
| POST | `/api/plan` | – | Budget-constrained day plan |
| POST | `/api/routes/optimize` | – | Shortest walking order |

### Example review payload

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

### Response conventions

- All bodies JSON; `X-Request-Id` on every response (client-supplied ids are honoured).
- Auth via `X-Chaatmap-User` email header; admin role derived server-side from `admin@` prefix.
- Validation errors: `422` with `{ error, errors: { field: message } }`.
- 32 KB body cap (413); no stack traces in errors; CORS allow-list.
- Structured one-line JSON logs per request and for domain events (`review.created`, `fssai.updated`).

---

## 10. Testing & Quality Assurance

**245 tests across 8 files, all passing.**

| Suite | Tests | Coverage |
|---|---|---|
| `src/lib/hygiene.test.js` | 40 | Weighted formula table, rounding, seed integrity, score derivation |
| `src/lib/validation.test.js` | 50 | Validators, injection/overflow guards, boundary cases |
| `src/lib/optimizer.test.js` | 54 | Geometry, NN, 2-opt, budget invariants, determinism |
| `server/api.test.js` | 53 | Real HTTP + in-memory SQLite: auth, FSSAI, errors, CORS, payload limits |
| `src/components/*.test.jsx` | 9 + 9 | HygieneScore thresholds, VendorCard rendering + favourites |
| `src/context/AppContext.test.jsx` | 14 | Store actions, score recalculation, persistence/hydration |
| `src/pages/HygieneReview.test.jsx` | 10 | Form validation and before → after score update |

Also verified: ESLint clean, 84% line coverage, production build, single-file build, browser smoke tests on desktop and mobile (no horizontal overflow, zero console errors), end-to-end review submission.

---

## 11. CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push and pull request to `main`/`master`:

1. Checkout + Node 24 setup (npm cache).
2. `npm ci`.
3. **Lint** — ESLint must pass clean.
4. **Test** — all 245 Vitest tests.
5. **Coverage** — report uploaded as an artifact (7-day retention).
6. **Build** — production bundle, then single-file HTML with existence/size check.
7. **API boot check** — start the server against in-memory SQLite and assert structured `"listening"` log.

A concurrency group cancels superseded runs on the same ref. Latest run: **success** (all steps).

---

## 12. Security

- **Input validation** shared by client and server; all mutating payloads validated, with field-level errors.
- **Server-derived roles** — a `role` field in the request body is ignored; admin access is derived from the `x-chaatmap-user` email prefix.
- **FSSAI integrity** — only the admin-only `PATCH /vendors/:id/fssai` path can set a verification badge.
- **CORS allow-list** — no wildcard; same-origin and non-browser clients work without an Origin header.
- **Body size cap** (32 KB) mitigates oversized-payload DoS.
- **No stack leaks** — central error handler logs details server-side and returns generic messages.
- **X-powered-by disabled**; request-id propagation for traceability.
- **SQL parameterisation** — all queries use prepared statements.

> Demo auth is intentionally not production-grade; swap the header for signed sessions/JWT before public API exposure.

---

## 13. Deployment

- **GitHub Pages:** https://cherry-tec.github.io/chaatmap/ (deployed from the repo; status `built`, HTTP 200).
- **HashRouter** ensures sub-path and `file://` compatibility without server rewrites.
- **API hosting:** deploy `server/` to any Node 24 host; set `CORS_ORIGINS` and `CHAATMAP_DB`; build the client with `VITE_API_URL` pointing at it.

---

## 14. Project Structure

```
chaatmap/
├── docs/
│   ├── API.md                  # full REST reference
│   └── openapi.yaml            # OpenAPI 3.1 spec
├── .github/workflows/ci.yml    # lint + test + coverage + build + API boot
├── index.html                  # 12.7 MB single-file offline build
├── README.md
├── react-app/
│   ├── public/images/          # 22 food photos
│   ├── src/
│   │   ├── components/         # Navbar, VendorCard, VendorMap, HygieneScore, …
│   │   ├── context/AppContext.jsx
│   │   ├── data/               # vendors, categories, trails (seed)
│   │   ├── lib/
│   │   │   ├── hygiene.js      # weighted score + rating
│   │   │   ├── validation.js   # shared validators
│   │   │   ├── optimizer.js    # route + budget algorithms
│   │   │   └── api.js          # API client with localStorage fallback
│   │   └── pages/              # 10 pages + 404
│   ├── server/
│   │   ├── db.js               # SQLite schema + queries
│   │   ├── index.js            # Express app + routes
│   │   ├── main.js             # server entry
│   │   └── api.test.js
│   ├── eslint.config.js
│   ├── vitest.config.js
│   └── scripts/                # build-single + smoke tests
└── scripts/                    # image-fetch helpers
```

The submission ZIP (`chaatmap.zip`, 17.35 MB, 83 files) mirrors the Git repo exactly: all source files and README included; no `node_modules/`, `venv/`, or build artifacts.

---

## 15. Results & Rubric Alignment

| Rubric area | Evidence |
|---|---|
| Requirements fulfilment | 10 pages + 404, all interactions working, responsive 360–1440 px, single-file + Pages + full-stack builds |
| Code quality | Modular structure, shared libs, ESLint clean, structured logging, prepared SQL, central error handling |
| Functionality | 245 passing tests, smoke tests, instant score recalculation, working API + fallback |
| System design | 3-tier architecture, shared validation/domain libs, graceful degradation, deterministic algorithms |
| Security | Server-derived roles, CORS allow-list, validation, 32 KB cap, no stack leaks, admin-only FSSAI |
| Innovation | Real NN + 2-opt route optimizer and randomized budget planner exposed via API |

**CI status:** passing · **Site:** HTTP 200 · **ZIP:** verified integrity, exact Git mirror.

---

## 16. Known Limitations & Future Work

- **Demo auth** — replace the `x-chaatmap-user` header with signed sessions/JWT before public API exposure.
- **Vendor photo uploads** — currently uses the bundled community gallery.
- **FSSAI verification** — manual by design; could integrate a licence API in future.
- **Scale** — SQLite suits single-instance deployments; move to Postgres for horizontal scaling.
- **Planner polish** — expose the optimizer in the UI (currently API-only) as an interactive itinerary builder.
