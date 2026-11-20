import { createContext, useContext, useEffect, useState } from 'react'
import { VENDORS, AREAS } from '../data/vendors.js'

const KEY = 'chaatmap.v1'
const AppCtx = createContext(null)

let seq = 100
const uid = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`

const DEFAULT_STATE = {
  vendors: VENDORS,
  user: null,
  favorites: [],
}

/**
 * Global store: vendors + reviews, auth user, favourites.
 * - useEffect loads persisted state on mount (with a short async delay so
 *   loading states are real, not decorative).
 * - useEffect persists every change back to localStorage.
 * All scores are derived from reviews via src/lib/hygiene.js.
 */
export function AppProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState('Hyderabad')

  // Load once on mount
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) {
          const saved = JSON.parse(raw)
          if (saved?.vendors?.length) {
            setState((prev) => ({
              ...prev,
              ...saved,
              user: saved.user ?? null,
              favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
            }))
          }
        }
      } catch {
        /* corrupted storage — fall back to seed data */
      }
      setLoading(false)
    }, 350)
    return () => clearTimeout(t)
  }, [])

  // Persist on every change (after initial load)
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch {
        /* storage full or blocked — app still works in-memory */
      }
    }
  }, [state, loading])

  const addHygieneReview = (vendorId, review) =>
    setState((s) => ({
      ...s,
      vendors: s.vendors.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              reviews: [
                { ...review, id: uid(), date: new Date().toISOString().slice(0, 10) },
                ...v.reviews,
              ],
            }
          : v,
      ),
    }))

  const deleteReview = (vendorId, reviewId) =>
    setState((s) => ({
      ...s,
      vendors: s.vendors.map((v) =>
        v.id === vendorId
          ? { ...v, reviews: v.reviews.filter((r) => r.id !== reviewId) }
          : v,
      ),
    }))

  // Admin action — the ONLY way a FSSAI badge can appear.
  const toggleFssai = (vendorId) =>
    setState((s) => ({
      ...s,
      vendors: s.vendors.map((v) =>
        v.id === vendorId ? { ...v, fssaiVerified: !v.fssaiVerified } : v,
      ),
    }))

  const toggleFavorite = (vendorId) =>
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(vendorId)
        ? s.favorites.filter((id) => id !== vendorId)
        : [...s.favorites, vendorId],
    }))

  const signIn = (user) => setState((s) => ({ ...s, user }))
  const signOut = () => setState((s) => ({ ...s, user: null }))

  const resetData = () => setState({ ...DEFAULT_STATE, user: state.user })

  const value = {
    ...state,
    loading,
    areas: AREAS,
    selectedArea,
    setSelectedArea,
    addHygieneReview,
    deleteReview,
    toggleFssai,
    toggleFavorite,
    signIn,
    signOut,
    resetData,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
