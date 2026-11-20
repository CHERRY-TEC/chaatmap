import { useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  MapPin, Search, Menu, X, ChevronDown, User, LogOut, ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/categories', label: 'Food Categories' },
  { to: '/trails', label: 'Food Trails' },
  { to: '/', label: 'How It Works', scrollTo: 'how' },
  { to: '/about', label: 'About' },
]

/** Scroll to a home-section after navigation (works with both routers). */
const scrollToSection = (id) =>
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150)

export default function Navbar() {
  const { user, signOut, selectedArea, setSelectedArea, areas, favorites } = useApp()
  const [open, setOpen] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/explore?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
  }

  const pickArea = (a) => {
    setSelectedArea(a)
    setAreaOpen(false)
    if (location.pathname !== '/explore') navigate('/explore')
  }

  const isLinkActive = (to, scrollTo) =>
    scrollTo ? false : to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur">
      <div className="section flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/30">
            <MapPin className="h-5 w-5" fill="currentColor" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Chaat<span className="text-brand">Map</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              onClick={l.scrollTo ? () => scrollToSection(l.scrollTo) : undefined}
              className={`relative rounded-full px-3 py-2 text-sm font-semibold transition ${
                isLinkActive(l.to, l.scrollTo)
                  ? 'text-brand'
                  : 'text-ink/70 hover:text-ink'
              }`}
            >
              {l.label}
              {isLinkActive(l.to, l.scrollTo) && (
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <div className="relative">
            <button
              onClick={() => setAreaOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-brand"
            >
              <MapPin className="h-4 w-4 text-brand" />
              {selectedArea}
              <ChevronDown className={`h-3.5 w-3.5 transition ${areaOpen ? 'rotate-180' : ''}`} />
            </button>
            {areaOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                {areas.map((a) => (
                  <button
                    key={a}
                    onClick={() => pickArea(a)}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-cream ${
                      a === selectedArea ? 'text-brand' : 'text-ink/80'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            aria-label="Search"
            onClick={() => navigate('/explore')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white hover:border-brand hover:text-brand"
          >
            <Search className="h-4 w-4" />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                {user.name[0].toUpperCase()}
              </span>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-2 text-xs font-bold hover:border-brand"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-ok" /> Admin
                </Link>
              )}
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white hover:border-brand hover:text-brand"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost !py-2 text-sm">
                <User className="h-4 w-4" /> Sign In
              </Link>
              <Link to="/auth?mode=join" className="btn-primary !py-2 text-sm">
                Join Community
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="border-t border-line bg-cream px-4 pb-5 pt-3 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Search Pani Puri, Dosa, Momos..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn-primary !px-4" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
          </form>

          <nav className="grid gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => {
                  setOpen(false)
                  if (l.scrollTo) scrollToSection(l.scrollTo)
                }}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isLinkActive(l.to, l.scrollTo) ? 'bg-brand/10 text-brand' : 'text-ink/80'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 flex flex-wrap gap-2">
            {areas.slice(1).map((a) => (
              <button
                key={a}
                onClick={() => { pickArea(a); setOpen(false) }}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  a === selectedArea
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-white text-ink/70'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            {user ? (
              <button onClick={() => { signOut(); setOpen(false) }} className="btn-ghost flex-1 text-sm">
                Sign Out ({user.name})
              </button>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                  Sign In
                </Link>
                <Link to="/auth?mode=join" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">
                  Join Community
                </Link>
              </>
            )}
          </div>
          {favorites.length > 0 && (
            <p className="mt-3 text-xs font-semibold text-ink/50">
              ❤ {favorites.length} saved spot{favorites.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </header>
  )
}
