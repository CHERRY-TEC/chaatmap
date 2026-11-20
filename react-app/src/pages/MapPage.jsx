import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene, vendorRating } from '../lib/hygiene.js'
import VendorMap from '../components/VendorMap.jsx'

/** Full interactive map page — markers + a side strip of visible vendors. */
export default function MapPage() {
  const { vendors, loading } = useApp()
  const [hoverId, setHoverId] = useState(null)

  return (
    <div className="section py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Interactive <span className="text-brand">Map</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink/60">
            Every hygiene-rated vendor across Hyderabad — tap a pin for details.
          </p>
        </div>
        <Link to="/explore" className="btn-ghost text-sm">
          Open Split View
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="h-[60vh] overflow-hidden rounded-2xl border border-line shadow-sm lg:h-[calc(100vh-220px)]">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-white text-sm font-bold text-ink/50">
              Loading map…
            </div>
          ) : (
            <VendorMap vendors={vendors} />
          )}
        </div>

        <aside className="no-scrollbar max-h-[60vh] space-y-3 overflow-y-auto lg:max-h-[calc(100vh-220px)]">
          {vendors.map((v) => {
            const hygiene = vendorHygiene(v)
            const rating = vendorRating(v)
            return (
              <Link
                key={v.id}
                to={`/vendor/${v.id}`}
                onMouseEnter={() => setHoverId(v.id)}
                onMouseLeave={() => setHoverId(null)}
                className={`card block p-3.5 transition hover:border-brand/50 ${
                  hoverId === v.id ? 'border-brand/50 shadow-md' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-extrabold">{v.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      v.openNow ? 'bg-okbg text-ok' : 'bg-line text-ink/50'
                    }`}
                  >
                    {v.openNow ? 'Open' : 'Closed'}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink/55">
                  <MapPin className="h-3 w-3 text-brand" /> {v.area} · {v.distanceKm} km
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs font-extrabold">
                  <span className="flex items-center gap-1 text-brand">
                    <Star className="h-3.5 w-3.5 fill-brand" /> {rating ?? '—'}
                  </span>
                  <span className="flex items-center gap-1 text-ok">
                    <ShieldCheck className="h-3.5 w-3.5" /> {hygiene ?? '—'} hygiene
                  </span>
                  <span className="ml-auto text-ink/55">
                    ₹{v.priceMin}–{v.priceMax}
                  </span>
                </div>
              </Link>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
