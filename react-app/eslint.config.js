import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * Flat ESLint config for ChaatMap (ESLint 10).
 *
 * - @eslint/js recommended baseline (syntax, correctness)
 * - react-hooks rules (dependency arrays, conditional hooks)
 * - react-refresh rule (component-only modules for fast refresh)
 * - Node globals for server/ scripts, browser globals for src/
 *
 * Run with `npm run lint`.
 */
export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'shots/**', 'data/**'],
  },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true, // `const { a, ...rest }` — `a` is deliberately dropped
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      'no-implied-eval': 'error',
    },
  },

  // Node-side code (API server, build/smoke scripts) — no React rules needed.
  {
    files: ['server/**/*.js', 'scripts/**/*.mjs'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Tests may export helpers alongside suites.
  {
    files: ['**/*.{test,spec}.{js,jsx}', 'vitest.setup.js'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // useApp() is a hook consumed by every component; co-locating it with the
  // provider is the intended pattern, not a shared-constant module.
  {
    files: ['src/context/AppContext.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]
