#!/usr/bin/env node
/**
 * Server entry point — `npm run server`.
 *
 * Opens the SQLite database (file-backed by default so data survives
 * restarts) and starts the REST API. Set CHAATMAP_DB=':memory:' for a
 * throwaway instance (used by the test suite).
 */

import { startServer, createLogger } from './index.js'

const logger = createLogger()
const port = process.env.PORT ?? 3001

startServer({ port, logger })
  .then(({ port: actual }) => {
    logger.info('ready', {
      url: `http://localhost:${actual}/api`,
      db: process.env.CHAATMAP_DB ?? 'data/chaatmap.db',
    })
  })
  .catch((err) => {
    logger.error('startup_failed', { message: err.message, stack: err.stack })
    process.exit(1)
  })

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    logger.info('shutdown', { signal: sig })
    process.exit(0)
  })
}
