/**
 * @vitest-environment jsdom
 *
 * AppContext — the global store: seed vendors, reviews, favourites, auth
 * and localStorage persistence. This is where "scores are always derived"
 * is enforced at the state level: adding a review must move the vendor's
 * computed hygiene score, and no action may fabricate an FSSAI badge
 * except toggleFssai (the admin path).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext.jsx'
import { VENDORS } from '../data/vendors.js'
import { vendorHygiene } from '../lib/hygiene.js'

const KEY = 'chaatmap.v1'
const V0 = VENDORS[0]

/** Harness exposing store state + actions as test hooks. */
function Probe() {
  const app = useApp()
  return (
    <div>
      <span data-testid="loading">{String(app.loading)}</span>
      <span data-testid="vendors">{app.vendors.length}</span>
      <span data-testid="score">{String(vendorHygiene(app.vendors[0]))}</span>
      <span data-testid="verified">{String(app.vendors[0].fssaiVerified)}</span>
      <span data-testid="user">{app.user?.email ?? ''}</span>
      <span data-testid="favorites">{app.favorites.join(',')}</span>
      <span data-testid="area">{app.selectedArea}</span>
      <span data-testid="reviews">{app.vendors[0].reviews.length}</span>
      <button onClick={() => app.toggleFavorite(V0.id)}>fav</button>
      <button onClick={() => app.toggleFssai(V0.id)}>fssai</button>
      <button onClick={() => app.signIn({ email: 'admin@chaatmap.in', name: 'Admin' })}>
        in
      </button>
      <button onClick={app.signOut}>out</button>
      <button onClick={() => app.setSelectedArea('Secunderabad')}>area</button>
      <button onClick={() => app.resetData()}>reset</button>
      <button
        onClick={() =>
          app.addHygieneReview(V0.id, {
            author: 'Probe',
            stars: 1,
            comment: '',
            water: 0,
            covered: 0,
            gloves: 0,
            surroundings: 0,
          })
        }
      >
        bad-review
      </button>
      <button
        onClick={() =>
          app.addHygieneReview(V0.id, {
            author: 'Probe',
            stars: 5,
            comment: 'great',
            water: 5,
            covered: 5,
            gloves: 5,
            surroundings: 5,
          })
        }
      >
        good-review
      </button>
      <button
        onClick={() => {
          const r = app.vendors[0].reviews[0]
          app.deleteReview(V0.id, r.id)
        }}
      >
        del-review
      </button>
    </div>
  )
}

const renderApp = () =>
  render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  )

/** Wait until the provider's initial load finished. */
const settled = async () => {
  const el = await screen.findByTestId('loading')
  await waitFor(() => expect(el).toHaveTextContent('false'))
  return el
}

describe('AppContext', () => {
  it('throws a helpful error when useApp is used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/must be used inside <AppProvider>/)
  })

  it('starts in a loading state, then settles', async () => {
    renderApp()
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    await settled()
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('seeds all 8 vendors from the dataset', async () => {
    renderApp()
    await settled()
    expect(screen.getByTestId('vendors')).toHaveTextContent('8')
    expect(screen.getByTestId('reviews')).toHaveTextContent(
      String(V0.reviews.length),
    )
  })

  it('defaults the selected area to Hyderabad', async () => {
    renderApp()
    await settled()
    expect(screen.getByTestId('area')).toHaveTextContent('Hyderabad')
    fireEvent.click(screen.getByText('area'))
    expect(screen.getByTestId('area')).toHaveTextContent('Secunderabad')
  })

  it('addHygieneReview lowers the derived score for a terrible review', async () => {
    renderApp()
    await settled()
    const before = screen.getByTestId('score').textContent
    fireEvent.click(screen.getByText('bad-review'))
    const after = screen.getByTestId('score').textContent
    expect(Number(after)).toBeLessThan(Number(before))
    expect(screen.getByTestId('reviews')).toHaveTextContent(
      String(V0.reviews.length + 1),
    )
  })

  it('addHygieneReview raises the derived score for a perfect review', async () => {
    renderApp()
    await settled()
    const before = Number(screen.getByTestId('score').textContent)
    fireEvent.click(screen.getByText('good-review'))
    const after = Number(screen.getByTestId('score').textContent)
    // Perfect pull-up can only move up (or stay if already 5.0).
    expect(after).toBeGreaterThanOrEqual(before)
    expect(screen.getByTestId('reviews')).toHaveTextContent(
      String(V0.reviews.length + 1),
    )
  })

  it('deleteReview removes the newest review and the score follows', async () => {
    renderApp()
    await settled()
    fireEvent.click(screen.getByText('bad-review'))
    const scored = Number(screen.getByTestId('score').textContent)
    fireEvent.click(screen.getByText('del-review'))
    expect(screen.getByTestId('reviews')).toHaveTextContent(
      String(V0.reviews.length),
    )
    expect(Number(screen.getByTestId('score').textContent)).not.toBe(scored)
  })

  it('toggleFssai flips the verification flag (the admin-only badge path)', async () => {
    renderApp()
    await settled()
    const initial = V0.fssaiVerified
    expect(screen.getByTestId('verified')).toHaveTextContent(String(initial))
    fireEvent.click(screen.getByText('fssai'))
    expect(screen.getByTestId('verified')).toHaveTextContent(String(!initial))
    fireEvent.click(screen.getByText('fssai'))
    expect(screen.getByTestId('verified')).toHaveTextContent(String(initial))
  })

  it('toggleFavorite adds then removes a favourite', async () => {
    renderApp()
    await settled()
    expect(screen.getByTestId('favorites')).toHaveTextContent('')
    fireEvent.click(screen.getByText('fav'))
    expect(screen.getByTestId('favorites')).toHaveTextContent(V0.id)
    fireEvent.click(screen.getByText('fav'))
    expect(screen.getByTestId('favorites')).toHaveTextContent('')
  })

  it('signIn stores the user and signOut clears it', async () => {
    renderApp()
    await settled()
    fireEvent.click(screen.getByText('in'))
    expect(screen.getByTestId('user')).toHaveTextContent('admin@chaatmap.in')
    fireEvent.click(screen.getByText('out'))
    expect(screen.getByTestId('user')).toHaveTextContent('')
  })

  it('resetData restores seed vendors but keeps the signed-in user', async () => {
    renderApp()
    await settled()
    fireEvent.click(screen.getByText('in'))
    fireEvent.click(screen.getByText('bad-review')) // mutate vendor data
    fireEvent.click(screen.getByText('reset'))
    expect(screen.getByTestId('user')).toHaveTextContent('admin@chaatmap.in')
    expect(screen.getByTestId('reviews')).toHaveTextContent(String(V0.reviews.length))
    expect(screen.getByTestId('score')).toHaveTextContent(
      String(vendorHygiene(V0)),
    )
  })

  it('persists every change to localStorage after load', async () => {
    renderApp()
    await settled()
    fireEvent.click(screen.getByText('fav'))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(KEY))
      expect(saved.favorites).toContain(V0.id)
    })
  })

  it('hydrates vendors, user and favourites from localStorage on mount', async () => {
    const customId = VENDORS[1].id
    localStorage.setItem(
      KEY,
      JSON.stringify({
        vendors: [VENDORS[1]],
        user: { email: 'saved@user.com', name: 'Saved' },
        favorites: [customId],
      }),
    )
    renderApp()
    await settled()
    expect(screen.getByTestId('vendors')).toHaveTextContent('1')
    expect(screen.getByTestId('user')).toHaveTextContent('saved@user.com')
    expect(screen.getByTestId('favorites')).toHaveTextContent(customId)
  })

  it('survives corrupted localStorage instead of crashing', async () => {
    localStorage.setItem(KEY, '{not-json')
    renderApp()
    await settled()
    expect(screen.getByTestId('vendors')).toHaveTextContent('8')
  })

  it('ignores a stored payload with no vendors array', async () => {
    localStorage.setItem(KEY, JSON.stringify({ favorites: ['x'], user: null }))
    renderApp()
    await settled()
    expect(screen.getByTestId('vendors')).toHaveTextContent('8')
    expect(screen.getByTestId('favorites')).toHaveTextContent('')
  })

  it('never lets a review action fabricate an FSSAI badge', async () => {
    renderApp()
    await settled()
    const initial = V0.fssaiVerified
    await act(async () => {
      fireEvent.click(screen.getByText('good-review'))
    })
    expect(screen.getByTestId('verified')).toHaveTextContent(String(initial))
  })
})
