import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Footprints, ShieldCheck, MapPin, ArrowRight } from 'lucide-react'
import { TRAILS } from '../data/trails.js'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene, round1 } from '../lib/hygiene.js'
import SectionHeading from '../components/SectionHeading.jsx'

export default function Trails() {
  const { vendors } = useApp()
  const [imgOk, setImgOk] = useState({})

  return (
    <div className="section py-10">
      <SectionHeading
        sub="Curated walking routes that connect hygiene-rated street-food stops. Live scores are computed from community reviews."
      >
        Featured <span className="text-brand">Food Trails</span>
      </SectionHeading>

      <div className="space-y-8">
        {TRAILS.map((trail) => {
          const stops = trail.vendorIds
            .map((id) => vendors.find((v) => v.id === id))
            .filter(Boolean)
          const liveAvg =
            stops.length > 0
              ? round1(
                  stops.reduce((s, v) => s + (vendorHygiene(v) ?? 0), 0) / stops.length,
                )
              : null

          return (
            <article key={trail.id} className="card overflow-hidden">
              <div className="grid md:grid-cols-[340px_1fr]">
                {/* Photo */}
                <div className="relative min-h-52 bg-gradient-to-br from-orange-100 to-amber-50">
                  {imgOk[trail.id] === false ? (
                    <span className="flex h-full w-full items-center justify-center text-7xl">🗺️</span>
                  ) : (
                    <img
                      src={trail.image}
                      alt={trail.name}
                      loading="lazy"
                      onError={() => setImgOk((s) => ({ ...s, [trail.id]: false }))}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold">
                      <Footprints className="h-3 w-3 text-brand" /> {trail.stops} Stops
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold">
                      <Clock className="h-3 w-3 text-brand" /> {trail.duration}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold">{trail.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">
                        {trail.description}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-okbg px-3 py-1.5 text-xs font-extrabold text-ok">
                      <ShieldCheck className="h-4 w-4" />
                      {liveAvg ?? trail.avgHygiene} avg hygiene
                    </span>
                  </div>

                  <h3 className="mt-5 mb-2.5 text-xs font-extrabold tracking-wide text-ink/55 uppercase">
                    Stops on this trail
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {stops.map((v, i) => (
                      <li key={v.id}>
                        <Link
                          to={`/vendor/${v.id}`}
                          className="flex items-center gap-2.5 rounded-xl border border-line bg-cream px-3 py-2.5 transition hover:border-brand"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-extrabold">{v.name}</span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-ink/50">
                              <MapPin className="h-2.5 w-2.5 text-brand" /> {v.area}
                            </span>
                          </span>
                          <span className="text-[11px] font-extrabold text-ok">
                            {vendorHygiene(v) ?? '—'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to={`/explore?trail=${trail.id}`} className="btn-primary text-sm">
                      Explore Trail <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/review" className="btn-ghost text-sm">
                      Rate a Stop
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
