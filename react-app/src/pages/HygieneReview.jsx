import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Droplets, Eye, Hand, Sparkles, CheckCircle2, AlertCircle, ArrowRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene } from '../lib/hygiene.js'
import RatingStars from '../components/RatingStars.jsx'

const CRITERIA = [
  { key: 'water', label: 'Clean / RO Water Used', weight: 40, Icon: Droplets, hint: 'Is the water used for pani / cooking clean or RO-filtered?' },
  { key: 'covered', label: 'Covered Food Display', weight: 25, Icon: Eye, hint: 'Are displayed items covered or protected from open air?' },
  { key: 'gloves', label: 'Gloves / Headgear Usage', weight: 20, Icon: Hand, hint: 'Do handlers use gloves, tongs or headgear?' },
  { key: 'surroundings', label: 'Surroundings Cleanliness', weight: 15, Icon: Sparkles, hint: 'Is the counter and surrounding area clean?' },
]

const ZERO_TO_FIVE = [0, 1, 2, 3, 4, 5]

export default function HygieneReview() {
  const { id } = useParams()
  const { vendors, user, addHygieneReview, loading } = useApp()
  const navigate = useNavigate()

  const [vendorId, setVendorId] = useState(id || '')
  const [author, setAuthor] = useState(user?.name || '')
  const [stars, setStars] = useState(0)
  const [scores, setScores] = useState({ water: null, covered: null, gloves: null, surroundings: null })
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null) // { vendorId, before, after }

  const selected = vendors.find((v) => v.id === (id || vendorId))
  const before = useMemo(() => (selected ? vendorHygiene(selected) : null), [selected])

  const setCriterion = (key, value) =>
    setScores((s) => ({ ...s, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!selected) errs.vendor = 'Choose a vendor to review.'
    if (!author.trim()) errs.author = 'Please enter your name.'
    if (!stars) errs.stars = 'Give an overall experience rating.'
    if (CRITERIA.some((c) => scores[c.key] === null)) {
      errs.scores = 'Rate all four criteria (0–5).'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return

    addHygieneReview(selected.id, {
      author: author.trim(),
      stars,
      comment: comment.trim(),
      ...scores,
    })
    setDone({ vendorId: selected.id, before })
  }

  // Success screen — recompute the vendor's score from the updated reviews
  if (done) {
    const v = vendors.find((x) => x.id === done.vendorId)
    const after = vendorHygiene(v)
    return (
      <div className="section max-w-2xl py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-okbg">
            <CheckCircle2 className="h-9 w-9 text-ok" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Review submitted!</h1>
          <p className="mt-2 text-sm text-ink/60">
            Thanks for helping the community. {v?.name}’s hygiene score has been recalculated
            using the weighted formula.
          </p>

          <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-6 rounded-2xl border border-line bg-cream p-5">
            <div>
              <p className="text-2xl font-extrabold text-ink/45">{done.before ?? '—'}</p>
              <p className="text-[10px] font-bold text-ink/45 uppercase">Before</p>
            </div>
            <ArrowRight className="h-5 w-5 text-brand" />
            <div>
              <p className="text-3xl font-extrabold text-ok">{after ?? '—'}</p>
              <p className="text-[10px] font-bold text-ink/45 uppercase">After</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/vendor/${done.vendorId}`} className="btn-primary">
              View Vendor
            </Link>
            <button onClick={() => navigate('/explore')} className="btn-ghost">
              Back to Explore
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="section py-16"><div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-white/70" /></div>
  }

  return (
    <div className="section max-w-3xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
          <ShieldCheck className="h-6 w-6 text-brand" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Submit a <span className="text-brand">Hygiene Review</span>
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Rate four criteria from 0–5 — the weighted score updates the vendor instantly.
          </p>
        </div>
      </div>

      {/* Formula */}
      <div className="mb-6 overflow-x-auto rounded-2xl border border-brand/25 bg-brand/6 px-4 py-3">
        <p className="text-xs font-bold whitespace-nowrap text-brand sm:text-sm">
          Score = (0.40 × Water) + (0.25 × Covered Food) + (0.20 × Gloves) + (0.15 × Surroundings)
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-6 p-6">
        {/* Vendor picker (when no :id in URL) */}
        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-ink/70 uppercase">
            Vendor *
          </label>
          {id ? (
            <div className="flex items-center justify-between rounded-xl border border-line bg-cream px-4 py-3">
              <span className="text-sm font-extrabold">{selected?.name}</span>
              <Link to="/review" className="text-xs font-bold text-brand hover:underline">
                Change
              </Link>
            </div>
          ) : (
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="input font-semibold"
            >
              <option value="">Select a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.area}
                </option>
              ))}
            </select>
          )}
          {errors.vendor && <FieldError msg={errors.vendor} />}
        </div>

        {/* Author */}
        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-ink/70 uppercase">
            Your name *
          </label>
          <input
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Aarav Reddy"
          />
          {errors.author && <FieldError msg={errors.author} />}
        </div>

        {/* Overall rating */}
        <div>
          <label className="mb-2 block text-xs font-extrabold text-ink/70 uppercase">
            Overall experience *
          </label>
          <RatingStars value={stars} onChange={setStars} size={20} label="Overall experience" />
          {errors.stars && <FieldError msg={errors.stars} />}
        </div>

        {/* Four criteria */}
        <div className="space-y-4">
          <p className="text-xs font-extrabold text-ink/70 uppercase">
            Hygiene criteria * <span className="font-semibold text-ink/45">(0–5 each)</span>
          </p>
          {CRITERIA.map(({ key, label, weight, Icon, hint }) => (
            <div key={key} className="rounded-2xl border border-line bg-cream p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-extrabold">
                  <Icon className="h-4 w-4 text-brand" /> {label}
                </span>
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-extrabold text-brand">
                  {weight}%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink/55">{hint}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ZERO_TO_FIVE.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCriterion(key, n)}
                    aria-label={`${label}: ${n} of 5`}
                    className={`h-9 w-9 rounded-lg border text-sm font-extrabold transition ${
                      scores[key] === n
                        ? 'border-brand bg-brand text-white shadow-md shadow-brand/30'
                        : 'border-line bg-white text-ink/60 hover:border-brand hover:text-brand'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span className="ml-2 self-center text-xs font-bold text-ink/45">
                  {scores[key] !== null ? `${scores[key]} / 5` : 'not rated'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Comment */}
        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-ink/70 uppercase">
            Comment <span className="font-semibold text-ink/45">(optional)</span>
          </label>
          <textarea
            className="input min-h-24 resize-y"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you notice about cleanliness, water, serving practice…"
          />
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            <AlertCircle className="h-4 w-4" />{' '}
            {errors.scores || errors.vendor || errors.author || errors.stars}
          </p>
        )}

        <button type="submit" className="btn-primary w-full !py-3">
          Submit Hygiene Review
        </button>
        <p className="text-center text-[11px] font-semibold text-ink/45">
          Your review recalculates the vendor’s weighted score immediately.
        </p>
      </form>
    </div>
  )
}

function FieldError({ msg }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
      <AlertCircle className="h-3.5 w-3.5" /> {msg}
    </p>
  )
}
