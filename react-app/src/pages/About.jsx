import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Users, Heart, ArrowRight, Scale, Camera, Route,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene, round1 } from '../lib/hygiene.js'
import { CATEGORIES } from '../data/categories.js'
import SectionHeading from '../components/SectionHeading.jsx'

const VALUES = [
  { Icon: ShieldCheck, title: 'Transparent Hygiene', text: 'Every score is computed from four weighted criteria rated by real visitors — never hidden or paid for.' },
  { Icon: Users, title: 'Community First', text: 'Reviews and photographs come from local food lovers who actually eat at these stalls.' },
  { Icon: Scale, title: 'Honest Badges', text: 'FSSAI badges appear only after an admin verifies the licence. No fake verification, ever.' },
  { Icon: Route, title: 'Curated Trails', text: 'Food walks that connect the best hygiene-rated stops into one delicious route.' },
]

export default function About() {
  const { vendors, loading } = useApp()

  const totalReviews = vendors.reduce((s, v) => s + v.reviews.length, 0)
  const avgHygiene =
    vendors.length > 0
      ? round1(
          vendors.reduce((s, v) => s + (vendorHygiene(v) ?? 0), 0) / vendors.length,
        )
      : '—'
  const areas = new Set(vendors.map((v) => v.area)).size

  const stats = [
    { value: loading ? '…' : vendors.length, label: 'Verified vendors' },
    { value: loading ? '…' : totalReviews, label: 'Hygiene reviews' },
    { value: loading ? '…' : avgHygiene, label: 'Avg hygiene score' },
    { value: loading ? '…' : areas, label: 'Areas covered' },
  ]

  return (
    <div className="py-10">
      {/* Hero */}
      <div className="section">
        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 sm:p-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/8 px-3 py-1 text-[11px] font-extrabold tracking-wide text-brand uppercase">
                <Heart className="h-3 w-3" /> About ChaatMap
              </span>
              <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
                Street food we love, made <span className="text-brand">safer</span> together.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-ink/65">
                ChaatMap helps you discover authentic Indian street food and evaluate vendor
                hygiene before you take the first bite. Locals rate four objective criteria,
                our weighted formula turns that into a transparent hygiene score, and every
                vendor page shows exactly how the number was reached.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/explore" className="btn-primary">
                  Explore Vendors <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/review" className="btn-ghost">
                  Submit a Review
                </Link>
              </div>
            </div>
            <div className="relative min-h-64 bg-gradient-to-br from-orange-100 to-amber-50">
              <AboutImage />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="section mt-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-3xl font-extrabold text-brand">{s.value}</p>
              <p className="mt-1 text-xs font-bold text-ink/55">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="section mt-12">
        <SectionHeading accent="We Stand For">What</SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {VALUES.map(({ Icon, title, text }) => (
            <div key={title} className="card p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10">
                <Icon className="h-5 w-5 text-brand" />
              </span>
              <h3 className="mt-3 text-sm font-extrabold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How scoring works */}
      <div className="section mt-12">
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">How the hygiene score works</h2>
          <p className="mt-2 max-w-3xl text-sm text-ink/60">
            Visitors rate four criteria from 0 to 5. We average each criterion across all
            reviews and apply fixed weights:
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl bg-ink px-5 py-4">
            <code className="text-sm font-bold whitespace-nowrap text-brand">
              Score = (0.40 × Water) + (0.25 × Covered Food) + (0.20 × Gloves) + (0.15 × Surroundings)
            </code>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ['40%', 'Clean / RO Water'],
              ['25%', 'Covered Display'],
              ['20%', 'Gloves / Headgear'],
              ['15%', 'Surroundings'],
            ].map(([w, l]) => (
              <div key={l} className="rounded-xl border border-line bg-cream px-4 py-3 text-center">
                <p className="text-lg font-extrabold text-brand">{w}</p>
                <p className="text-[11px] font-bold text-ink/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories strip */}
      <div className="section mt-12">
        <SectionHeading
          action={
            <Link to="/categories" className="text-sm font-extrabold text-brand hover:underline">
              All categories →
            </Link>
          }
        >
          Explore by <span className="text-brand">Craving</span>
        </SectionHeading>
        <div className="flex flex-wrap gap-2.5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/explore?category=${c.id}`}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold transition hover:border-brand hover:text-brand"
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="section mt-12">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-ink px-6 py-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-xl font-extrabold">Know a great hygienic stall?</h2>
            <p className="mt-1.5 text-sm text-white/60">
              Tell the community — submit a hygiene review in under a minute.
            </p>
          </div>
          <Link to="/review" className="btn-primary shrink-0">
            <Camera className="h-4 w-4" /> Share Your Experience
          </Link>
        </div>
      </div>
    </div>
  )
}

function AboutImage() {
  const [ok, setOk] = useState(true)
  return ok ? (
    <img
      src="/images/about-1.jpg"
      alt="Indian street food vendor at work"
      onError={() => setOk(false)}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-7xl">🍛</span>
  )
}
