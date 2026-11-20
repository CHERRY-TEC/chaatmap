import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Clock, BadgeCheck, ShieldCheck, Star, Camera,
  IndianRupee, ExternalLink, Pencil, Heart,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import {
  vendorHygiene, vendorRating, factorBreakdown, round1, WEIGHTS,
} from '../lib/hygiene.js'
import HygieneScore from '../components/HygieneScore.jsx'
import RatingStars from '../components/RatingStars.jsx'
import VendorMap from '../components/VendorMap.jsx'

const CRITERIA_LABELS = {
  water: 'Clean / RO Water Used',
  covered: 'Covered Food Display',
  gloves: 'Gloves / Headgear Usage',
  surroundings: 'Surroundings Cleanliness',
}

export default function VendorDetails() {
  const { id } = useParams()
  const { vendors, favorites, toggleFavorite, loading } = useApp()
  const navigate = useNavigate()
  const [coverOk, setCoverOk] = useState(true)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const vendor = vendors.find((v) => v.id === id)

  if (loading) {
    return (
      <div className="section py-10">
        <div className="h-72 animate-pulse rounded-3xl bg-white/70" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/70" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="section py-24 text-center">
        <h1 className="text-2xl font-extrabold">Vendor not found</h1>
        <Link to="/explore" className="btn-primary mt-5">Back to Explore</Link>
      </div>
    )
  }

  const hygiene = vendorHygiene(vendor)
  const rating = vendorRating(vendor)
  const breakdown = factorBreakdown(vendor)
  const fav = favorites.includes(vendor.id)
  const reviews = vendor.reviews
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4)
  const photos = [
    vendor.image,
    '/images/hero-2.jpg',
    '/images/cat-chaat.jpg',
    '/images/cat-panipuri.jpg',
  ]

  return (
    <div className="section py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1.5 text-sm font-bold text-ink/60 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Cover */}
      <div className="relative h-64 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 sm:h-80">
        {coverOk ? (
          <img
            src={vendor.image}
            alt={vendor.name}
            onError={() => setCoverOk(false)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-8xl">
            {vendor.emoji}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <button
          onClick={() => toggleFavorite(vendor.id)}
          aria-label="Save vendor"
          className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-110 active:scale-90"
        >
          <Heart className={fav ? 'fill-brand text-brand' : 'text-ink/50'} width={20} height={20} />
        </button>
        <div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-end justify-between gap-3 text-white">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {vendor.openNow && (
                <span className="rounded-full bg-ok px-3 py-1 text-[11px] font-extrabold">
                  Open Now
                </span>
              )}
              {vendor.fssaiVerified && (
                <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-ok">
                  <BadgeCheck className="h-3.5 w-3.5" /> FSSAI Verified
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{vendor.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {vendor.area} · {vendor.distanceKm} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {vendor.hours}
              </span>
              <span className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" /> ₹{vendor.priceMin}–₹{vendor.priceMax}
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/95 px-4 py-3 text-ink shadow-xl">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-2xl leading-none font-extrabold text-brand">
                  {rating ?? '—'}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-ink/50 uppercase">Rating</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <HygieneScore score={hygiene} size={54} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------- MAIN ---------- */}
        <div className="space-y-6">
          {/* About + dishes */}
          <div className="card p-5">
            <h2 className="text-lg font-extrabold">About this vendor</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">{vendor.description}</p>
            <p className="mt-3 text-xs font-bold text-brand">{vendor.specialty}</p>

            <h3 className="mt-5 mb-3 text-sm font-extrabold tracking-wide text-ink/70 uppercase">
              Signature Dishes
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {vendor.dishes.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream px-3.5 py-2.5"
                >
                  <span className="text-sm font-bold">{d.name}</span>
                  <span className="flex items-center text-sm font-extrabold text-brand">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {d.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Community photographs */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold">
              <Camera className="h-5 w-5 text-brand" /> Community Photographs
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((src, i) => (
                <PhotoThumb key={i} src={src} alt={`${vendor.name} photo ${i + 1}`} />
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Star className="h-5 w-5 fill-brand text-brand" /> Reviews
                <span className="text-sm font-bold text-ink/45">({reviews.length})</span>
              </h2>
              <RatingStars value={rating ?? 0} size={15} />
            </div>

            <ul className="mt-4 space-y-3">
              {visibleReviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-line bg-cream p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                        {r.author[0]}
                      </span>
                      <div>
                        <p className="text-sm font-extrabold">{r.author}</p>
                        <p className="text-[11px] font-semibold text-ink/45">{r.date}</p>
                      </div>
                    </div>
                    <RatingStars value={r.stars} size={13} />
                  </div>
                  {r.comment && (
                    <p className="mt-2.5 text-sm leading-relaxed text-ink/65">{r.comment}</p>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                      <span
                        key={key}
                        className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink/55"
                        title={label}
                      >
                        {label.split(' ')[0]} {r[key]}/5
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            {reviews.length > 4 && (
              <button
                onClick={() => setShowAllReviews((v) => !v)}
                className="mt-4 w-full rounded-xl border border-line py-2.5 text-sm font-extrabold text-ink/60 hover:border-brand hover:text-brand"
              >
                {showAllReviews ? 'Show less' : `View all ${reviews.length} reviews`}
              </button>
            )}
          </div>
        </div>

        {/* ---------- SIDEBAR ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Hygiene breakdown */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <HygieneScore score={hygiene} size={72} />
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-extrabold">
                  <ShieldCheck className="h-4 w-4 text-ok" /> Hygiene Score
                </h3>
                <p className="mt-1 text-[11px] leading-snug text-ink/55">
                  Weighted from {reviews.length} community review{reviews.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {Object.entries(breakdown).map(([key, avg]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-ink/70">{CRITERIA_LABELS[key]}</span>
                    <span className="text-ink/50">
                      {avg !== null ? `${round1(avg)}/5` : '—'} · {Math.round(WEIGHTS[key] * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-okbg">
                    <div
                      className="h-full rounded-full bg-ok transition-all duration-700"
                      style={{ width: `${((avg ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* FSSAI status — honest */}
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl px-3.5 py-3 text-xs font-bold ${
                vendor.fssaiVerified ? 'bg-okbg text-ok' : 'bg-cream text-ink/55'
              }`}
            >
              <BadgeCheck className="h-4 w-4 shrink-0" />
              {vendor.fssaiVerified
                ? 'FSSAI licence verified by ChaatMap admin'
                : 'FSSAI not verified yet — no badge shown'}
            </div>

            <Link to={`/review/${vendor.id}`} className="btn-primary mt-4 w-full">
              <Pencil className="h-4 w-4" /> Submit Hygiene Review
            </Link>
            <a
              href={`https://www.openstreetmap.org/directions?to=${vendor.lat}%2C${vendor.lng}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost mt-2.5 w-full text-sm"
            >
              <ExternalLink className="h-4 w-4" /> Get Directions
            </a>
          </div>

          {/* Mini map */}
          <div className="card overflow-hidden">
            <div className="h-52 w-full">
              <VendorMap vendors={[vendor]} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PhotoThumb({ src, alt }) {
  const [ok, setOk] = useState(true)
  return (
    <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-amber-50">
      {ok ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setOk(false)}
          className="h-full w-full object-cover transition hover:scale-105"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-3xl">🍽️</span>
      )}
    </div>
  )
}
