import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, MapPin, SlidersHorizontal, X, List, Map, ShieldCheck, Route,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { CATEGORIES } from '../data/categories.js'
import { getTrail } from '../data/trails.js'
import { vendorHygiene, vendorRating } from '../lib/hygiene.js'
import VendorMap from '../components/VendorMap.jsx'

const HYGIENE_OPTIONS = [
  { value: 0, label: 'Any score' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 4.7, label: '4.7+' },
]

export default function Explore() {
  const { vendors, loading, selectedArea, setSelectedArea, areas } = useApp()
  const [params, setParams] = useSearchParams()
  const [minHygiene, setMinHygiene] = useState(0)
  const [view, setView] = useState('list') // mobile map/list toggle
  const [selectedId, setSelectedId] = useState(null)

  // The URL is the single source of truth for search + category, so external
  // navigations (category cards, trail links, back button) are reflected
  // immediately — no effect needed to mirror them into local state.
  const q = params.get('q') || ''
  const category = params.get('category') || 'all'

  const trailId = params.get('trail')
  const trail = trailId ? getTrail(trailId) : null

  const applyParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    let list = [...vendors]
    if (trail) list = list.filter((v) => trail.vendorIds.includes(v.id))
    if (selectedArea && selectedArea !== 'Hyderabad') {
      list = list.filter((v) => v.area === selectedArea)
    }
    if (category !== 'all') list = list.filter((v) => v.category === category)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.specialty.toLowerCase().includes(s) ||
          v.area.toLowerCase().includes(s) ||
          v.dishes.some((d) => d.name.toLowerCase().includes(s)),
      )
    }
    if (minHygiene > 0) {
      list = list.filter((v) => (vendorHygiene(v) ?? 0) >= minHygiene)
    }
    return list
  }, [vendors, trail, selectedArea, category, q, minHygiene])

  const clearAll = () => {
    setMinHygiene(0)
    setSelectedArea('Hyderabad')
    setParams(new URLSearchParams(), { replace: true })
  }

  const hasFilters =
    q || category !== 'all' || minHygiene > 0 || selectedArea !== 'Hyderabad' || trail

  return (
    <div className="section py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Explore Street Food <span className="text-brand">Spots</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink/60">
            {loading ? 'Loading vendors…' : `${filtered.length} vendor${filtered.length === 1 ? '' : 's'} found`}
            {selectedArea !== 'Hyderabad' && ` in ${selectedArea}`}
          </p>
        </div>

        {/* Mobile view toggle */}
        <div className="flex rounded-full border border-line bg-white p-1 lg:hidden">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold ${
              view === 'list' ? 'bg-brand text-white' : 'text-ink/60'
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold ${
              view === 'map' ? 'bg-brand text-white' : 'text-ink/60'
            }`}
          >
            <Map className="h-3.5 w-3.5" /> Map
          </button>
        </div>
      </div>

      {trail && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/8 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-brand">
            <Route className="h-4 w-4" />
            Showing stops from <span className="underline">{trail.name}</span>
          </p>
          <button
            onClick={() => applyParam('trail', null)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink/60 hover:text-brand"
            aria-label="Clear trail filter"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* ---------- LEFT: filters + list ---------- */}
        <div className={view === 'map' ? 'hidden lg:block' : ''}>
          {/* Search */}
          <div className="card p-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3">
              <Search className="h-4 w-4 shrink-0 text-brand" />
              <input
                value={q}
                onChange={(e) => {
                  applyParam('q', e.target.value)
                }}
                placeholder="Search vendors, dishes, areas..."
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                aria-label="Search vendors"
              />
              {q && (
                <button onClick={() => applyParam('q', null)} aria-label="Clear search">
                  <X className="h-4 w-4 text-ink/40 hover:text-brand" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-ink/50 uppercase">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </div>

              {/* Area */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Area</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="input !py-2 text-sm font-semibold"
                >
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a === 'Hyderabad' ? 'All areas' : a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Food category</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => applyParam('category', null)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      category === 'all'
                        ? 'border-brand bg-brand text-white'
                        : 'border-line bg-white text-ink/60 hover:border-brand'
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => applyParam('category', c.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        category === c.id
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-ink/60 hover:border-brand'
                      }`}
                    >
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hygiene */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Minimum hygiene score</label>
                <div className="flex gap-1.5">
                  {HYGIENE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setMinHygiene(o.value)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
                        minHygiene === o.value
                          ? 'border-ok bg-okbg text-ok'
                          : 'border-line bg-white text-ink/60 hover:border-ok'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="w-full rounded-lg border border-line py-2 text-xs font-extrabold text-ink/60 hover:border-brand hover:text-brand"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Vendor list */}
          <div className="mt-4 space-y-4">
            {loading &&
              [0, 1, 2].map((i) => (
                <div key={i} className="card h-44 animate-pulse bg-white/70" />
              ))}

            {!loading && filtered.length === 0 && (
              <div className="card p-8 text-center">
                <MapPin className="mx-auto h-10 w-10 text-brand/40" />
                <p className="mt-3 text-sm font-extrabold">No vendors match these filters</p>
                <p className="mt-1 text-xs text-ink/55">Try another area or clear the filters.</p>
                <button onClick={clearAll} className="btn-primary mt-4 !py-2 text-sm">
                  Clear filters
                </button>
              </div>
            )}

            {!loading &&
              filtered.map((v) => (
                <div
                  key={v.id}
                  onMouseEnter={() => setSelectedId(v.id)}
                  className={`transition ${selectedId === v.id ? 'lg:scale-[1.01]' : ''}`}
                >
                  <Link to={`/vendor/${v.id}`} className="block">
                    <CompactRow vendor={v} active={selectedId === v.id} />
                  </Link>
                </div>
              ))}
          </div>
        </div>

        {/* ---------- RIGHT: map ---------- */}
        <div
          className={`${
            view === 'list' ? 'hidden lg:block' : ''
          } h-[65vh] overflow-hidden rounded-2xl border border-line shadow-sm lg:h-[calc(100vh-210px)]`}
        >
          <VendorMap vendors={filtered} />
        </div>
      </div>
    </div>
  )
}

/** Compact vendor row used in the Explore list. */
function CompactRow({ vendor, active }) {
  const hygiene = vendorHygiene(vendor)
  const rating = vendorRating(vendor)
  const [imgOk, setImgOk] = useState(true)

  return (
    <article
      className={`card flex gap-3 p-3 transition hover:shadow-md ${
        active ? 'border-brand/50 shadow-sm' : ''
      }`}
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-amber-50">
        {imgOk ? (
          <img
            src={vendor.image}
            alt={vendor.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl">
            {vendor.emoji}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold">{vendor.name}</h3>
            <p className="truncate text-[11px] font-bold text-brand">{vendor.specialty}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              vendor.openNow ? 'bg-okbg text-ok' : 'bg-line text-ink/50'
            }`}
          >
            {vendor.openNow ? 'Open' : 'Closed'}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink/55">
          <MapPin className="h-3 w-3 text-brand" /> {vendor.area} · {vendor.distanceKm} km
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <span className="flex items-center gap-1 text-xs font-extrabold">
            <span className="text-brand">★</span> {rating ?? '—'}
            <span className="font-medium text-ink/45">rating</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-okbg px-2 py-0.5 text-[11px] font-extrabold text-ok">
            <ShieldCheck className="h-3 w-3" /> {hygiene ?? '—'}
          </span>
          <span className="text-[11px] font-bold text-ink/60">
            ₹{vendor.priceMin}–{vendor.priceMax}
          </span>
        </div>
      </div>
    </article>
  )
}
