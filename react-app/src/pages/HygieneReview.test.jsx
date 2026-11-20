/**
 * @vitest-environment jsdom
 *
 * HygieneReview page — the form that feeds the weighted formula. Tests
 * verify client-side validation, that all four criteria are mandatory,
 * and that a successful submission actually recalculates the vendor's
 * displayed score (Before → After).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HygieneReview from './HygieneReview.jsx'
import { AppProvider } from '../context/AppContext.jsx'
import { VENDORS } from '../data/vendors.js'
import { vendorHygiene } from '../lib/hygiene.js'

const VENDOR = VENDORS[0]
const ZERO_REVIEW = { stars: 1, water: 0, covered: 0, gloves: 0, surroundings: 0 }

const CRITERIA_LABELS = [
  'Clean / RO Water Used',
  'Covered Food Display',
  'Gloves / Headgear Usage',
  'Surroundings Cleanliness',
]

function renderReview({ withId = true } = {}) {
  const entry = withId ? `/review/${VENDOR.id}` : '/review'
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AppProvider>
        <Routes>
          <Route path="/review/:id" element={<HygieneReview />} />
          <Route path="/review" element={<HygieneReview />} />
          <Route path="/explore" element={<p>explore page</p>} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  )
}

/** Wait for the provider's 350ms hydration gate to open. */
const formReady = () =>
  screen.findByRole('button', { name: 'Submit Hygiene Review' })

const setCriteria = (n) => {
  for (const label of CRITERIA_LABELS) {
    fireEvent.click(screen.getByRole('button', { name: `${label}: ${n} of 5` }))
  }
}

const setName = (value) => {
  fireEvent.change(screen.getByPlaceholderText('e.g. Aarav Reddy'), {
    target: { value },
  })
}

describe('HygieneReview', () => {
  it('shows the weighted formula exactly as specified', async () => {
    renderReview()
    await formReady()
    expect(
      screen.getByText(
        'Score = (0.40 × Water) + (0.25 × Covered Food) + (0.20 × Gloves) + (0.15 × Surroundings)',
      ),
    ).toBeInTheDocument()
  })

  it('lists all four criteria with their weights (40/25/20/15)', async () => {
    renderReview()
    await formReady()
    const weights = ['40%', '25%', '20%', '15%']
    weights.forEach((w) => expect(screen.getByText(w)).toBeInTheDocument())
    CRITERIA_LABELS.forEach((label) =>
      expect(screen.getAllByText(label).length).toBeGreaterThan(0),
    )
  })

  it('shows every criterion as "not rated" initially', async () => {
    renderReview()
    await formReady()
    expect(screen.getAllByText('not rated')).toHaveLength(4)
  })

  it('blocks submission when name, stars or criteria are missing', async () => {
    renderReview()
    await formReady()
    fireEvent.click(await formReady())
    await waitFor(() => {
      expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
    })
    expect(
      screen.getByText('Give an overall experience rating.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Rate all four criteria (0–5).')).toBeInTheDocument()
    // Still on the form — no success screen.
    expect(screen.queryByText('Review submitted!')).not.toBeInTheDocument()
  })

  it('requires rating ALL four criteria, not just one', async () => {
    renderReview()
    await formReady()
    setName('Partial Reviewer')
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    // Rate three of four only.
    fireEvent.click(screen.getByRole('button', { name: 'Clean / RO Water Used: 5 of 5' }))
    fireEvent.click(screen.getByRole('button', { name: 'Covered Food Display: 5 of 5' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gloves / Headgear Usage: 5 of 5' }))
    fireEvent.click(await formReady())
    expect(screen.getByText('Rate all four criteria (0–5).')).toBeInTheDocument()
    expect(screen.queryByText('Review submitted!')).not.toBeInTheDocument()
  })

  it('shows the selected value as "n / 5" once a criterion is rated', async () => {
    renderReview()
    await formReady()
    fireEvent.click(screen.getByRole('button', { name: 'Clean / RO Water Used: 3 of 5' }))
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
    expect(screen.getAllByText('not rated')).toHaveLength(3)
  })

  it('submits a complete review and shows the recalculated score (Before → After)', async () => {
    renderReview()
    await formReady()

    const before = vendorHygiene(VENDOR)
    const expectedAfter = vendorHygiene({
      ...VENDOR,
      reviews: [
        { author: 'Form Tester', comment: '', ...ZERO_REVIEW },
        ...VENDOR.reviews,
      ],
    })

    setName('Form Tester')
    fireEvent.click(screen.getByRole('radio', { name: '1 star' }))
    setCriteria(0)
    fireEvent.click(await formReady())

    await screen.findByText('Review submitted!')
    expect(expectedAfter).toBeLessThan(before)

    // Before and After values are both displayed and differ.
    const beforeEl = screen.getByText('Before').previousElementSibling
    const afterEl = screen.getByText('After').previousElementSibling
    expect(Number(beforeEl.textContent)).toBeCloseTo(before, 6)
    expect(Number(afterEl.textContent)).toBeCloseTo(expectedAfter, 6)
    expect(afterEl.textContent).not.toBe(beforeEl.textContent)
  })

  it('links to the vendor page and can navigate back to Explore', async () => {
    renderReview()
    await formReady()
    setName('Nav Tester')
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    setCriteria(5)
    fireEvent.click(await formReady())

    await screen.findByText('Review submitted!')
    const link = screen.getByRole('link', { name: 'View Vendor' })
    expect(link).toHaveAttribute('href', `/vendor/${VENDOR.id}`)

    fireEvent.click(screen.getByRole('button', { name: 'Back to Explore' }))
    expect(screen.getByText('explore page')).toBeInTheDocument()
  })

  it('asks for a vendor when the route carries no :id', async () => {
    renderReview({ withId: false })
    await formReady()
    setName('Picker Tester')
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    setCriteria(4)
    fireEvent.click(await formReady())
    // Shown once as a field error and once in the summary banner.
    expect(screen.getAllByText('Choose a vendor to review.').length).toBeGreaterThan(0)

    // Pick one from the select and resubmit successfully.
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: VENDOR.id },
    })
    fireEvent.click(await formReady())
    await screen.findByText('Review submitted!')
  })

  it('persists the new review so a re-render still shows it', async () => {
    renderReview()
    await formReady()
    setName('Persist Tester')
    fireEvent.click(screen.getByRole('radio', { name: '4 stars' }))
    setCriteria(2)
    fireEvent.click(await formReady())
    await screen.findByText('Review submitted!')

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('chaatmap.v1'))
      const vendor = saved?.vendors?.find((v) => v.id === VENDOR.id)
      expect(vendor.reviews[0].author).toBe('Persist Tester')
      expect(vendor.reviews[0].water).toBe(2)
    })
  })
})
