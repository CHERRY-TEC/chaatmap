import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Footprints, Heart, ArrowRight, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene, round1 } from '../lib/hygiene.js'

/** Featured trail card — photo header, meta chips, description, explore button. */
export default function TrailCard({ trail }) {
  const { favorites, toggleFavorite, vendors } = useApp()
  const [imgOk, setImgOk] = useState(true)
  const fav = favorites.includes(trail.id)

  // Live average hygiene across the trail's stops (falls back to design value)
  const stops = trail.vendorIds.map((id) => vendors.find((v) => v.id === id)).filter(Boolean)
  const liveAvg =
    stops.length > 0
      ? round1(stops.reduce((s, v) => s + (vendorHygiene(v) ?? 0), 0) / stops.length)
      : trail.avgHygiene

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(33,27,25,0.12)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50">
        {imgOk ? (
          <img
            src={trail.image}
            alt={trail.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl">🗺️</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold">
            <Footprints className="h-3 w-3 text-brand" /> {trail.stops} Stops
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold">
            <Clock className="h-3 w-3 text-brand" /> {trail.duration}
          </span>
        </div>
        <button
          onClick={() => toggleFavorite(trail.id)}
          aria-label="Save trail"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow transition hover:scale-110 active:scale-90"
        >
          <Heart className={fav ? 'fill-brand text-brand' : 'text-ink/50'} width={18} height={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold">{trail.name}</h3>
          <span className="flex items-center gap-1 rounded-full bg-okbg px-2 py-1 text-[11px] font-extrabold text-ok">
            <ShieldCheck className="h-3 w-3" /> {liveAvg} avg hygiene
          </span>
        </div>
        <p className="text-xs leading-relaxed text-ink/60">{trail.description}</p>
        <Link
          to={`/explore?trail=${trail.id}`}
          className="btn-primary mt-auto w-full !py-2 text-sm"
        >
          Explore Trail <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
