import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, Sparkles, ShieldCheck, Users, Heart, ArrowRight,
  Footprints, Clock, CheckCircle2,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { CATEGORIES } from '../data/categories.js'
import { TRAILS } from '../data/trails.js'
import CategoryCard from '../components/CategoryCard.jsx'
import VendorCard from '../components/VendorCard.jsx'
import TrailCard from '../components/TrailCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'

const POPULAR = ['Pani Puri', 'Dosa', 'Chaat', 'Pav Bhaji', 'Momos']

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: 'Hygiene First',
    text: 'Discover vendors using objective hygiene information.',
  },
  {
    Icon: Users,
    title: 'Community Powered',
    text: 'Reviews and photographs from local food lovers.',
  },
  {
    Icon: MapPin,
    title: 'Local Food Discovery',
    text: 'Find authentic street food in your locality.',
  },
  {
    Icon: Heart,
    title: 'Trusted Food Trails',
    text: 'Explore curated routes featuring hygiene-rated vendors.',
  },
]

const STEPS = [
  { title: 'Discover', text: 'Find nearby street-food vendors.' },
  { title: 'Check Hygiene', text: 'Review transparent hygiene scores.' },
  { title: 'Share Your Experience', text: 'Help the community.' },
]

// The four headline vendors from the design reference
const FEATURED_IDS = [
  'mahalaxmi-chaat-center',
  'sri-sai-dosa-corner',
  'hyderabad-mirchi-bajji',
  'pav-bhaji-house',
]

function FoodImage({ src, alt, className, fallback = '🍽️' }) {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <span className={`${className} flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-5xl`}>
        {fallback}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setOk(false)}
      className={className}
      loading="lazy"
    />
  )
}

export default function Home() {
  const { vendors, selectedArea, areas, setSelectedArea, loading } = useApp()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const featured = FEATURED_IDS.map((id) => vendors.find((v) => v.id === id)).filter(Boolean)

  const onSearch = (e) => {
    e.preventDefault()
    navigate(`/explore?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="overflow-hidden">
        <div className="section grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/8 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-brand uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              India’s Street Food Discovery Platform
            </span>

            <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
              Discover the Best{' '}
              <span className="text-brand">Chaat &amp; Street Food</span>{' '}
              Near You!
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/60">
              Explore authentic local street food, discover trusted vendors and enjoy your
              favourite delicacies with confidence.
            </p>

            {/* Search */}
            <form
              onSubmit={onSearch}
              className="mt-7 flex flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_12px_40px_rgba(33,27,25,0.08)] sm:flex-row sm:rounded-full"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-4.5 w-4.5 shrink-0 text-brand" width={18} height={18} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search Pani Puri, Dosa, Momos..."
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink/40"
                  aria-label="Search food"
                />
              </div>
              <div className="hidden w-px bg-line sm:block" />
              <div className="flex items-center gap-2 px-3">
                <MapPin className="h-4.5 shrink-0 text-brand" width={18} height={18} />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm font-semibold outline-none sm:w-36"
                  aria-label="Choose your area"
                >
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a === 'Hyderabad' ? 'Choose your area' : a}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary sm:shrink-0">Search</button>
            </form>

            {/* Popular chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-ink/50">Popular:</span>
              {POPULAR.map((p) => (
                <button
                  key={p}
                  onClick={() => navigate(`/explore?q=${encodeURIComponent(p)}`)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink/70 transition hover:border-brand hover:text-brand"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Right — photo composition + floating hygiene card */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <FoodImage
                src="/images/hero-1.jpg"
                alt="Freshly assembled pani puri at a street stall"
                className="col-span-2 h-56 w-full rounded-3xl object-cover shadow-[0_18px_50px_rgba(33,27,25,0.18)] sm:h-72"
                fallback="🫗"
              />
              <FoodImage
                src="/images/hero-2.jpg"
                alt="Bhel puri chaat plate"
                className="h-36 w-full rounded-2xl object-cover shadow-lg sm:h-44"
                fallback="🥘"
              />
              <FoodImage
                src="/images/cat-dosa.jpg"
                alt="Crisp masala dosa"
                className="h-36 w-full rounded-2xl object-cover shadow-lg sm:h-44"
                fallback="🌯"
              />
            </div>

            {/* Floating hygiene card */}
            <div className="absolute -top-4 right-2 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_16px_44px_rgba(33,27,25,0.16)] sm:right-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-okbg">
                <ShieldCheck className="h-6 w-6 text-ok" />
              </span>
              <div>
                <p className="text-lg leading-none font-extrabold text-ok">4.9 / 5</p>
                <p className="mt-1 text-[11px] font-bold text-ink/60">Hygiene Score</p>
                <span className="mt-1.5 inline-block rounded-full bg-ok px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">
                  Community Trusted
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="section py-10">
        <SectionHeading
          action={
            <Link to="/categories" className="text-sm font-extrabold text-brand hover:underline">
              View All Categories →
            </Link>
          }
        >
          What Are You <span className="text-brand">Craving</span> Today?
        </SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* ================= TRUSTED VENDORS ================= */}
      <section className="section py-10">
        <SectionHeading
          action={
            <Link to="/explore" className="text-sm font-extrabold text-brand hover:underline">
              View All →
            </Link>
          }
        >
          Discover <span className="text-brand">Trusted</span> Street Food Spots
        </SectionHeading>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-80 animate-pulse bg-white/70" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </section>

      {/* ================= WHY CHAATMAP ================= */}
      <section className="section py-10">
        <SectionHeading accent="ChaatMap?">Why</SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="card flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Icon className="h-6 w-6 text-brand" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TRAILS + HOW IT WORKS ================= */}
      <section id="how" className="section scroll-mt-24 py-10">
        <SectionHeading
          action={
            <Link to="/trails" className="text-sm font-extrabold text-brand hover:underline">
              View All Trails →
            </Link>
          }
        >
          Featured Food Trails
        </SectionHeading>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            {TRAILS.map((t) => (
              <TrailCard key={t.id} trail={t} />
            ))}
          </div>

          {/* How It Works panel */}
          <div className="card flex flex-col p-6">
            <h3 className="text-lg font-extrabold">How It Works?</h3>
            <ol className="mt-5 flex flex-1 flex-col justify-between gap-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{s.title}</p>
                    <p className="mt-0.5 text-xs text-ink/60">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/explore" className="btn-primary mt-6 w-full">
              Start Exploring <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= COMMUNITY CTA ================= */}
      <section className="section py-10">
        <div className="relative isolate overflow-hidden rounded-3xl">
          <FoodImage
            src="/images/trail-2.jpg"
            alt="Indian street food market"
            className="absolute inset-0 h-full w-full object-cover"
            fallback="🍛"
          />
          <div className="absolute inset-0 bg-ink/75" />
          <div className="relative flex flex-col items-center px-6 py-16 text-center text-white sm:py-20">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Make Street Food <span className="text-brand">Safer</span> for Everyone.
            </h2>
            <p className="mt-3 max-w-lg text-sm text-white/75 sm:text-base">
              Join the ChaatMap Community and be a part of the change!
            </p>
            <Link to="/auth?mode=join" className="btn-primary mt-7 !px-8 !py-3 text-base">
              Join Community
            </Link>
            <p className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-semibold text-white/50">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" /> Transparent hygiene scores
              </span>
              <span className="flex items-center gap-1">
                <Footprints className="h-3.5 w-3.5 text-brand" /> Curated food trails
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand" /> Reviews in seconds
              </span>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
