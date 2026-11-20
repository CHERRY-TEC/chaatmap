/**
 * @vitest-environment jsdom
 *
 * HygieneScore — the circular badge that displays the weighted score.
 * Tests cover the derived ring geometry, the colour thresholds and the
 * honest "no data" state (a vendor with zero reviews must show an em dash,
 * never a fake number).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HygieneScore from './HygieneScore.jsx'

const ring = (container) =>
  container.querySelectorAll('svg circle')[1] // second circle = progress ring

describe('HygieneScore', () => {
  it('renders the score with exactly one decimal', () => {
    render(<HygieneScore score={4.6} />)
    expect(screen.getByText('4.6')).toBeInTheDocument()
    render(<HygieneScore score={4} />)
    expect(screen.getByText('4.0')).toBeInTheDocument()
  })

  it('shows an em dash instead of a number when there are no reviews', () => {
    const { container } = render(<HygieneScore score={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\d\.\d/)
  })

  it('handles undefined the same as null', () => {
    render(<HygieneScore score={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the HYGIENE label by default', () => {
    render(<HygieneScore score={4.5} />)
    expect(screen.getByText('Hygiene')).toBeInTheDocument()
  })

  it('hides the label when showLabel is false', () => {
    render(<HygieneScore score={4.5} showLabel={false} />)
    expect(screen.queryByText('Hygiene')).not.toBeInTheDocument()
  })

  it('uses green for scores ≥ 4.5, amber ≥ 3.5, red below', () => {
    const { container, rerender } = render(<HygieneScore score={4.8} />)
    expect(ring(container).getAttribute('stroke')).toBe('#18864B')
    rerender(<HygieneScore score={4.5} />)
    expect(ring(container).getAttribute('stroke')).toBe('#18864B')
    rerender(<HygieneScore score={3.9} />)
    expect(ring(container).getAttribute('stroke')).toBe('#E8A200')
    rerender(<HygieneScore score={3.5} />)
    expect(ring(container).getAttribute('stroke')).toBe('#E8A200')
    rerender(<HygieneScore score={2.1} />)
    expect(ring(container).getAttribute('stroke')).toBe('#D64545')
    rerender(<HygieneScore score={null} />)
    expect(ring(container).getAttribute('stroke')).toBe('#9CA3AF')
  })

  it('fills the ring proportionally to score / 5', () => {
    const { container, rerender } = render(<HygieneScore score={2.5} />)
    const c = 2 * Math.PI * ((58 - 7) / 2)
    expect(Number(ring(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(c * 0.5, 6)
    rerender(<HygieneScore score={5} />)
    expect(Number(ring(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 6)
  })

  it('clamps an out-of-range score instead of overflowing the ring', () => {
    const { container, rerender } = render(<HygieneScore score={7} />)
    expect(Number(ring(container).getAttribute('stroke-dashoffset'))).toBeGreaterThanOrEqual(0)
    rerender(<HygieneScore score={-2} />)
    const c = 2 * Math.PI * ((58 - 7) / 2)
    // negative score → empty ring (offset == full circumference)
    expect(Number(ring(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(c, 6)
  })

  it('respects the size prop for the SVG box', () => {
    const { container } = render(<HygieneScore score={4} size={80} />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('width')).toBe('80')
    expect(svg.getAttribute('height')).toBe('80')
  })

  it('renders a numeric score without NaN for fractional input', () => {
    render(<HygieneScore score={4.4444} />)
    expect(screen.getByText('4.4')).toBeInTheDocument()
  })
})
