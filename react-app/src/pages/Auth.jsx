import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { MapPin, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

/** Sign in / Join Community — demo auth persisted to localStorage. */
export default function Auth() {
  const { user, signIn, signOut } = useApp()
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'join' ? 'join' : 'signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const switchMode = (m) => {
    setMode(m)
    setError('')
    const next = new URLSearchParams(params)
    if (m === 'join') next.set('mode', 'join')
    else next.delete('mode')
    setParams(next, { replace: true })
  }

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'join' && !name.trim()) return setError('Please enter your name.')
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email))
      return setError('Please enter a valid email address.')
    if (password.length < 4) return setError('Password must be at least 4 characters.')

    const isAdmin = email.trim().toLowerCase().startsWith('admin@')
    signIn({
      name: mode === 'join' ? name.trim() : email.split('@')[0],
      email: email.trim(),
      role: isAdmin ? 'admin' : 'user',
    })
    navigate('/')
  }

  // Signed-in state
  if (user) {
    return (
      <div className="section max-w-lg py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-extrabold text-white">
            {user.name[0].toUpperCase()}
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">
            {user.role === 'admin' ? 'Admin signed in' : `Welcome, ${user.name}!`}
          </h1>
          <p className="mt-1.5 text-sm text-ink/60">{user.email}</p>

          <div className="mt-6 grid gap-2.5">
            <Link to="/review" className="btn-primary">
              Submit a Hygiene Review
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn-ghost">
                <ShieldCheck className="h-4 w-4 text-ok" /> Open Admin Dashboard
              </Link>
            )}
            <button onClick={() => { signOut(); navigate('/') }} className="btn-ghost">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section max-w-lg py-14">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
          <MapPin className="h-7 w-7" fill="currentColor" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {mode === 'signin' ? 'Welcome back' : 'Join the Community'}
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          {mode === 'signin'
            ? 'Sign in to rate vendors and share photos.'
            : 'Help make street food safer for everyone.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 rounded-full border border-line bg-white p-1.5">
        <button
          onClick={() => switchMode('signin')}
          className={`rounded-full py-2.5 text-sm font-extrabold transition ${
            mode === 'signin' ? 'bg-brand text-white shadow' : 'text-ink/55'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchMode('join')}
          className={`rounded-full py-2.5 text-sm font-extrabold transition ${
            mode === 'join' ? 'bg-brand text-white shadow' : 'text-ink/55'
          }`}
        >
          Join Community
        </button>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        {mode === 'join' && (
          <div>
            <label className="mb-1.5 block text-xs font-extrabold text-ink/70 uppercase">Name</label>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand">
              <User className="h-4 w-4 text-brand" />
              <input
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-ink/70 uppercase">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand">
            <Mail className="h-4 w-4 text-brand" />
            <input
              type="email"
              className="w-full bg-transparent py-3 text-sm outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-ink/70 uppercase">Password</label>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand">
            <Lock className="h-4 w-4 text-brand" />
            <input
              type="password"
              className="w-full bg-transparent py-3 text-sm outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full !py-3">
          {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-center text-[11px] leading-relaxed font-semibold text-ink/45">
          Demo auth — accounts are stored locally in your browser.
          <br />
          Use an email starting with <b>admin@</b> to get admin access.
        </p>
      </form>
    </div>
  )
}
