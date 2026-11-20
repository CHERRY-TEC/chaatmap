# ChaatMap — Street Food Discovery Platform

Premium Indian street-food discovery platform: find authentic vendors, check
**transparent hygiene scores**, submit four-factor hygiene reviews, explore an
interactive map and walk curated food trails.

Brand: **ChaatMap** · Tagline: *Discover the Best Chaat & Street Food Near You!*

---

## Quick start (after unzipping)

**Option A — just view it (no install):**
double-click **`index.html`** in the zip root. Everything (CSS, JS, all 22
images) is inlined in that one file — it opens in any browser straight from
disk. Only the map tiles and Manrope font need internet; it degrades
gracefully without them.

**Option B — run the source:**

```bash
cd chaatmap/react-app
npm install        # first time only (downloads React, Vite, Tailwind, Leaflet)
npm run dev        # → http://localhost:5173
```

> Note: `node_modules/` and `dist/` are excluded from the zip on purpose —
> `npm install` and `npm run build` recreate them.

Other commands:

```bash
npm run build      # production build → dist/
npm run build:single   # regenerate the one-file chaatmap/index.html
npm run preview    # serve the production build
node scripts/smoke.mjs   # headless browser test (needs dev server running)
node scripts/smoke-file.mjs # verify the single-file build over file://
```

> Note: the dev server may currently be running on **http://localhost:5180**.

---

## Tech stack

| Concern      | Choice                                          |
| ------------ | ----------------------------------------------- |
| Framework    | React 19 + Vite                                 |
| Styling      | Tailwind CSS v4 (`@theme` brand tokens)         |
| Routing      | React Router v7 (`BrowserRouter`)               |
| Icons        | Lucide React (+ inline SVG brand icons)         |
| Maps         | Leaflet + React Leaflet (OpenStreetMap tiles)   |
| State        | Context API + `useState` / `useEffect`          |
| Persistence  | `localStorage` (all mutations survive refresh)  |

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

**Honest FSSAI:** a verified badge appears only when an admin toggles it in the
dashboard — there is no fake verification anywhere.

---

## Key interactions (all working)

- Search from navbar/hero → Explore with query pre-applied (URL params)
- Category cards → Explore with category selected
- Trail cards → Explore showing only trail stops (clearable banner)
- Area selector (navbar + filters) filters vendors live
- Hygiene minimum filter (Any / 4.0+ / 4.5+ / 4.7+)
- Favourite hearts (vendor + trail) persist across refresh
- Interactive map: orange pins, popups with View Details, auto-fit bounds
- Mobile: hamburger menu, map/list toggle, no horizontal overflow (tested 390 px)
- Demo auth: any email/password; `admin@…` gets the Admin dashboard

---

## Project structure

```
chaatmap/
├── react-app/
│   ├── public/images/          # 22 real food photos (Wikimedia Commons)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, VendorCard, CategoryCard,
│   │   │                       # TrailCard, VendorMap, HygieneScore, RatingStars…
│   │   ├── context/AppContext.jsx   # global store + localStorage persistence
│   │   ├── data/               # vendors, categories, trails (seed data)
│   │   ├── lib/hygiene.js      # weighted score + rating calculations
│   │   └── pages/              # 10 pages + 404
│   └── scripts/
│       ├── smoke.mjs           # headless Chrome smoke test
│       └── shots/              # test screenshots
└── scripts/                    # image-fetch helpers
```

---

## Remaining integrations (not included)

- **Backend/database** — the app uses a seed dataset + localStorage; the data
  layer is isolated in `AppContext` + `src/data`, so swapping in a REST API
  (Node/Express) means replacing the three action functions
  (`addHygieneReview`, `deleteReview`, `toggleFssai`) with `fetch` calls.
- **Real auth** — sign-in is demo/local; wire `signIn()` to your API.
- **Vendor photo uploads** — community photos currently use the bundled gallery.
- **FSSAI API check** — verification is admin-driven by design.
