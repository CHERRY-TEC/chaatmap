/**
 * @vitest-environment jsdom
 *
 * VendorCard — the primary browse-mode card. Tests assert that every value
 * shown is derived (hygiene score computed from reviews), that the FSSAI
 * badge only appears for actually-verified vendors, and that the favourite
 * control works through the app context.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VendorCard from './VendorCard.jsx'
import { AppProvider } from '../context/AppContext.jsx'
import { VENDORS } from '../data/vendors.js'
import { vendorHygiene, vendorRating } from '../lib/hygiene.js'

const verified = VENDORS.find((v) => v.fssaiVerified)
const unverified = VENDORS.find((v) => !v.fssaiVerified)

function renderCard(vendor) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <VendorCard vendor={vendor} />
      </AppProvider>
    </MemoryRouter>,
  )
}

describe('VendorCard', () => {
  it('renders the vendor identity: name, specialty, area and price range', () => {
    renderCard(verified)
    expect(screen.getByRole('heading', { name: verified.name })).toBeInTheDocument()
    expect(screen.getByText(verified.specialty)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${verified.area} ·`))).toBeInTheDocument()
    expect(
      screen.getByText(`₹${verified.priceMin}–₹${verified.priceMax}`),
    ).toBeInTheDocument()
  })

  it('links to the vendor detail route', () => {
    renderCard(verified)
    const link = screen.getByRole('link', { name: /View Details/ })
    expect(link).toHaveAttribute('href', `/vendor/${verified.id}`)
  })

  it('shows the hygiene score derived from the reviews (not a stored constant)', () => {
    const { container } = renderCard(verified)
    const badge = container.querySelector('div.flex.flex-col.items-center.gap-1')
    expect(badge).not.toBeNull()
    expect(badge.textContent).toContain(vendorHygiene(verified).toFixed(1))
  })

  it('shows the derived star rating with one decimal', () => {
    renderCard(verified)
    expect(
      screen.getByLabelText(`Rated ${vendorRating(verified)} out of 5`),
    ).toBeInTheDocument()
  })

  it('shows the FSSAI badge ONLY for verified vendors', () => {
    const { unmount } = renderCard(verified)
    expect(
      screen.getByTitle('FSSAI licence verified by ChaatMap admin'),
    ).toBeInTheDocument()
    unmount()

    renderCard(unverified)
    expect(
      screen.queryByTitle('FSSAI licence verified by ChaatMap admin'),
    ).not.toBeInTheDocument()
  })

  it('shows the Open Now pill only when the vendor is open', () => {
    const openVendor = VENDORS.find((v) => v.openNow)
    const closedVendor = VENDORS.find((v) => !v.openNow)
    const { unmount } = renderCard(openVendor)
    expect(screen.getByText('Open Now')).toBeInTheDocument()
    unmount()
    renderCard(closedVendor)
    expect(screen.queryByText('Open Now')).not.toBeInTheDocument()
  })

  it('toggles the favourite heart label on click', () => {
    renderCard(verified)
    const heart = screen.getByRole('button', { name: 'Add to favourites' })
    fireEvent.click(heart)
    expect(
      screen.getByRole('button', { name: 'Remove from favourites' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove from favourites' }))
    expect(
      screen.getByRole('button', { name: 'Add to favourites' }),
    ).toBeInTheDocument()
  })

  it('falls back to the emoji when the photo fails to load', () => {
    renderCard(verified)
    const img = screen.getByRole('img', { name: verified.name })
    fireEvent.error(img)
    expect(screen.getByText(verified.emoji)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: verified.name })).not.toBeInTheDocument()
  })

  it('renders the photo while it loads fine', () => {
    renderCard(verified)
    const img = screen.getByRole('img', { name: verified.name })
    expect(img).toHaveAttribute('src', verified.image)
  })
})
