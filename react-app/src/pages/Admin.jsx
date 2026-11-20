import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Users, Star, Trash2, BadgeCheck, BadgeX, MapPin,
  ArrowRight, RotateCcw, Lock,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { vendorHygiene, vendorRating, round1 } from '../lib/hygiene.js'

/**
 * Admin dashboard — stats, vendor table (FSSAI verification toggle is the
 * ONLY way a verified badge appears anywhere in the app), recent reviews
 * with delete (scores recalculate live).
 */
export default function Admin() {
  const {
    vendors, user, signIn, toggleFssai, deleteReview, resetData, loading,
  } = useApp()
  const [tab, setTab] = useState('overview')

  // Loading state — wait for auth to resolve before deciding
  if (loading) {
    return (
      <div className="section py-20">
        <div className="mx-auto h-72 max-w-3xl animate-pulse rounded-3xl bg-white/70" />
      </div>
    )
  }

  // Gate — demo admin sign-in
  if (!user || user.role !== 'admin') {
    return (
      <div className="section max-w-md py-20">
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-okbg">
            <Lock className="h-7 w-7 text-ok" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold">Admin access required</h1>
          <p className="mt-2 text-sm text-ink/60">
            Sign in with an email starting with <b>admin@</b> to open the dashboard.
          </p>
          <div className="mt-6 grid gap-2.5">
            <button
              onClick={() =>
                signIn({ name: 'ChaatMap Admin', email: 'admin@chaatmap.in', role: 'admin' })
              }
              className="btn-primary"
            >
              <ShieldCheck className="h-4 w-4" /> Sign in as Demo Admin
            </button>
            <Link to="/auth" className="btn-ghost">
              Use regular sign-in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalReviews = vendors.reduce((s, v) => s + v.reviews.length, 0)
  const scored = vendors.map((v) => vendorHygiene(v)).filter((x) => x !== null)
  const avgHygiene = scored.length ? round1(scored.reduce((a, b) => a + b, 0) / scored.length) : '—'
  const openCount = vendors.filter((v) => v.openNow).length
  const verifiedCount = vendors.filter((v) => v.fssaiVerified).length

  const allReviews = vendors
    .flatMap((v) => v.reviews.map((r) => ({ ...r, vendorId: v.id, vendorName: v.name })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8)

  const stats = [
    { Icon: MapPin, value: vendors.length, label: 'Vendors', color: 'text-brand bg-brand/10' },
    { Icon: Star, value: totalReviews, label: 'Reviews', color: 'text-brand bg-brand/10' },
    { Icon: ShieldCheck, value: avgHygiene, label: 'Avg hygiene', color: 'text-ok bg-okbg' },
    { Icon: Users, value: openCount, label: 'Open now', color: 'text-ok bg-okbg' },
  ]

  return (
    <div className="section py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-okbg px-3 py-1 text-[11px] font-extrabold text-ok uppercase">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Dashboard
          </span>
          <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight">
            Welcome, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {vendors.length} vendors · {totalReviews} reviews · {verifiedCount} FSSAI verified
          </p>
        </div>
        <button
          onClick={() => { if (confirm('Reset all reviews & FSSAI flags to seed data?')) resetData() }}
          className="btn-ghost text-sm"
        >
          <RotateCcw className="h-4 w-4" /> Reset data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ Icon, value, label, color }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl leading-none font-extrabold">{value}</p>
              <p className="mt-1 text-xs font-bold text-ink/55">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-7 mb-4 flex gap-2">
        {[
          ['vendors', 'Vendors'],
          ['reviews', 'Recent Reviews'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition ${
              tab === k ? 'bg-brand text-white shadow' : 'border border-line bg-white text-ink/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'vendors' ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-extrabold tracking-wide text-ink/50 uppercase">
                <th className="px-5 py-3.5">Vendor</th>
                <th className="px-4 py-3.5">Area</th>
                <th className="px-4 py-3.5">Rating</th>
                <th className="px-4 py-3.5">Hygiene</th>
                <th className="px-4 py-3.5">Reviews</th>
                <th className="px-4 py-3.5">FSSAI</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-line/70 last:border-0 hover:bg-cream/60">
                  <td className="px-5 py-3.5">
                    <p className="font-extrabold">{v.name}</p>
                    <p className="text-[11px] font-bold text-brand">{v.specialty}</p>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-ink/65">{v.area}</td>
                  <td className="px-4 py-3.5 font-extrabold text-brand">
                    ★ {vendorRating(v) ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-ok">
                    {vendorHygiene(v) ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-ink/60">{v.reviews.length}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleFssai(v.id)}
                      title={
                        v.fssaiVerified
                          ? 'Click to revoke verification'
                          : 'Click after verifying the licence'
                      }
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition ${
                        v.fssaiVerified
                          ? 'bg-ok text-white hover:bg-red-500'
                          : 'border border-line bg-white text-ink/55 hover:border-ok hover:text-ok'
                      }`}
                    >
                      {v.fssaiVerified ? (
                        <>
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified
                        </>
                      ) : (
                        <>
                          <BadgeX className="h-3.5 w-3.5" /> Verify
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      to={`/vendor/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-brand hover:underline"
                    >
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-3">
          {allReviews.map((r) => (
            <li key={`${r.vendorId}-${r.id}`} className="card flex flex-wrap items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                {r.author[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">
                  {r.author} → <span className="text-brand">{r.vendorName}</span>
                </p>
                <p className="truncate text-xs text-ink/55">
                  {r.comment || 'No comment'} · {r.date}
                </p>
              </div>
              <span className="text-xs font-extrabold text-brand">★ {r.stars}</span>
              <span className="rounded-full bg-okbg px-2.5 py-1 text-[11px] font-extrabold text-ok">
                W {r.water} · C {r.covered} · G {r.gloves} · S {r.surroundings}
              </span>
              <button
                onClick={() => deleteReview(r.vendorId, r.id)}
                aria-label="Delete review"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/50 transition hover:border-red-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[11px] font-semibold text-ink/45">
        FSSAI badges across the app appear only for vendors verified here — no fake
        verification. Deleting a review instantly recalculates that vendor’s weighted score.
      </p>
    </div>
  )
}
