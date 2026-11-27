import { readFileSync } from 'node:fs'
import { createApp } from '@missing-elements/h5p-mcp/app'
import mcp from '@missing-elements/h5p-mcp/package.json' with { type: 'json' }
import { OPTIONS } from './options.mjs'

/**
 * The app server of `@missing-elements/h5p-mcp` as a Worker: its files ride in under `/bundle`.
 * Tool calls carry an activity's source, never a file; it stores or logs nothing (`wrangler.jsonc`).
 */

/** Where a Worker's modules are files. */
const CARRIED = '/bundle'

/** @type {ReturnType<typeof createApp> | undefined} */
let app

export default {
  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    let server
    try {
      // Started by the first call and kept while the Worker lives. One that failed to start is
      // started again by the next call.
      app ??= createApp({
        ...OPTIONS,
        version: mcp.version,
        card: readFileSync(`${CARRIED}/card.html`, 'utf8'),
        libraries: `${CARRIED}/parts`,
        references: `${CARRIED}/references`
      })
      server = await app
    } catch (error) {
      app = undefined
      // The cause goes to `wrangler tail` only, as logs are off; it holds no request's content.
      console.error('The server could not start:', error)
      // Said plainly and with nothing of the failure in it: it is the Worker's, not the caller's.
      return new Response('The server could not start\n', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } })
    }
    return server.fetch(request)
  }
}
