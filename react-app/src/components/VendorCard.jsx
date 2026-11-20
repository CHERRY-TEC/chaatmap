import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Heart, ArrowRight, BadgeCheck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene, vendorRating } from '../lib/hygiene.js'
import HygieneScore from './HygieneScore.jsx'
import RatingStars from './RatingStars.jsx'

/**
 * Premium vendor card — photo, open status, favourite heart, locality,
 * distance, rating, price range, circular hygiene score, honest FSSAI
 * badge (only when actually verified by an admin) and View Details.
 */
export default function VendorCard({ vendor }) {
  const { favorites, toggleFavorite } = useApp()
  const [imgOk, setImgOk] = useState(true)
  const hygiene = vendorHygiene(vendor)
  const rating = vendorRating(vendor)
  const fav = favorites.includes(vendor.id)

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(33,27,25,0.12)]">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50">
        {imgOk ? (
          <img
            src={vendor.image}
            alt={vendor.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl">
            {vendor.emoji}
          </span>
        )}

        {vendor.openNow && (
          <span className="absolute top-3 left-3 rounded-full bg-ok px-2.5 py-1 text-[11px] font-extrabold text-white shadow">
            Open Now
          </span>
        )}

        <button
          onClick={() => toggleFavorite(vendor.id)}
          aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow transition hover:scale-110 active:scale-90"
        >
          <Heart
            className={`h-4.5 w-4.5 ${fav ? 'fill-brand text-brand' : 'text-ink/50'}`}
            width={18}
            height={18}
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base leading-tight font-extrabold">{vendor.name}</h3>
            {vendor.fssaiVerified && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-okbg px-2 py-0.5 text-[10px] font-extrabold text-ok"
                title="FSSAI licence verified by ChaatMap admin"
              >
                <BadgeCheck className="h-3 w-3" /> FSSAI
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-bold text-brand">{vendor.specialty}</p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink/60">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand" />
            {vendor.area} · {vendor.distanceKm} km
          </span>
          <span className="rounded-full bg-cream px-2 py-0.5 font-bold text-ink/70">
            ₹{vendor.priceMin}–₹{vendor.priceMax}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <RatingStars value={rating ?? 0} size={14} />
          <HygieneScore score={hygiene} size={44} showLabel={false} />
        </div>

        <Link
          to={`/vendor/${vendor.id}`}
          className="btn-primary w-full !py-2 text-sm"
        >
          View Details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
