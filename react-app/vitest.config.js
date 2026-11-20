import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Test configuration.
 *
 * A single runner with `environment: 'node'` as the default; React/component
 * tests opt into jsdom individually with a `@vitest-environment jsdom`
 * docblock, which keeps exactly one project (no overlapping globs).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}', 'server/**/*.{test,spec}.{js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/lib/**', 'src/context/**', 'server/**'],
      exclude: ['server/main.js', '**/*.test.js', '**/*.test.jsx', '**/vitest.setup.js'],
    },
  },
})
