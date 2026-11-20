import { Link } from 'react-router-dom'
import { MapPin, Heart } from 'lucide-react'

// Brand icons (removed from lucide) as small inline SVGs
const IgIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)
const YtIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22.5 6.9a3 3 0 0 0-2.1-2.1C18.6 4.3 12 4.3 12 4.3s-6.6 0-8.4.5A3 3 0 0 0 1.5 6.9 31 31 0 0 0 1 12a31 31 0 0 0 .5 5.1 3 3 0 0 0 2.1 2.1c1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-5.1z" />
    <path d="M9.8 15.1V8.9l5.4 3.1z" fill="currentColor" stroke="none" />
  </svg>
)
const XIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.4l4.5 5.9L18.9 2zm-1.1 18h1.7L6.3 3.7H4.5L17.8 20z" />
  </svg>
)
const LiIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.5c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21H9z" />
  </svg>
)

const COLUMNS = [
  { title: 'Quick Links', links: [['Home', '/'], ['Explore', '/explore'], ['Food Trails', '/trails']] },
  { title: 'Resources', links: [['How It Works', '/', 'how'], ['About', '/about'], ['Contact', '/about']] },
  { title: 'Legal', links: [['Privacy Policy', '/about'], ['Terms & Conditions', '/about']] },
]

const scrollToSection = (id) =>
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150)

const SOCIALS = [
  { Icon: IgIcon, label: 'Instagram' },
  { Icon: YtIcon, label: 'YouTube' },
  { Icon: XIcon, label: 'X' },
  { Icon: LiIcon, label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="section grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
              <MapPin className="h-5 w-5" fill="currentColor" />
            </span>
            <span className="text-xl font-extrabold">
              Chaat<span className="text-brand">Map</span>
            </span>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white/60">
            Discover <span className="text-brand">•</span> Explore <span className="text-brand">•</span> Trust
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
            Community-powered street-food discovery with transparent hygiene scores.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-white/90">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map(([label, to, scroll]) => (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={scroll ? () => scrollToSection(scroll) : undefined}
                    className="text-sm text-white/55 transition hover:text-brand"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-white/90">
            Follow Us
          </h4>
          <div className="flex gap-2.5">
            {SOCIALS.map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                onClick={(e) => e.preventDefault()}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-brand hover:bg-brand hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/40 sm:flex-row">
          <p>© 2026 ChaatMap. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-brand text-brand" /> for street-food lovers
          </p>
        </div>
      </div>
    </footer>
  )
}
