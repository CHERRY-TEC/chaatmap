import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jest-dom matchers (toBeInTheDocument, toHaveAttribute, …)
import '@testing-library/jest-dom/vitest'

// jsdom does not implement these; the app only needs them to not throw.
if (!globalThis.IS_REACT_ACT_ENVIRONMENT) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}

if (typeof window !== 'undefined') {
  // matchMedia — leaflet / CSS media queries
  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })

  // ResizeObserver — used by some layout components
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // scrollTo — jsdom logs "not implemented" otherwise
  window.scrollTo ??= () => {}

  // Leaflet measures element sizes
  if (!window.HTMLElement.prototype.getBoundingClientRect) {
    window.HTMLElement.prototype.getBoundingClientRect = () => ({
      width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0,
    })
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  try {
    localStorage?.clear()
  } catch {
    /* not in a DOM environment */
  }
})
