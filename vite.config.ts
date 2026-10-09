import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vitest/config'

/*
 * The pages: the site, the player page, the guides (generated into docs/ by scripts/build-docs.mjs
 * before Vite runs) and the 404 page. The player page the snippet frames is on its own origin,
 * embed-my/embed-my.github.io.
 */
const docs = Object.fromEntries(
  readdirSync('docs')
    .filter((file) => file.endsWith('.html'))
    .map((file) => [`docs/${file.slice(0, -5)}`, `docs/${file}`])
)

/**
 * The origin the preview frames: the player origin, unless `VITE_PLAYER_URL` points the preview
 * at a local build of the player, in which case that origin is the one allowed as a frame.
 */
const playerOrigin = new URL(process.env.VITE_PLAYER_URL || 'https://embed-my.github.io/h5p').origin

type Policy = Record<string, string[]>

/** What the site's own pages need: their scripts, styles, fonts and the preview frame, nothing from anywhere else. */
const SITE_POLICY: Policy = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': [playerOrigin],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
}

/**
 * Writes each page's Content-Security-Policy into a <meta> tag at build. GitHub Pages sends no
 * headers of its own, so the tag is the only policy the pages get. The pinned-theme script is
 * inline on purpose (see index.html), and is allowed by its hash rather than by 'unsafe-inline'.
 * Build only: the dev server injects styles and scripts of its own that no fixed policy covers.
 */
function cspMeta(): Plugin {
  return {
    name: 'embed-my:csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const policy = structuredClone(SITE_POLICY)
        const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1])
        for (const source of inline) {
          policy['script-src'].push(`'sha256-${createHash('sha256').update(source).digest('base64')}'`)
        }
        const content = Object.entries(policy)
          .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
          .join('; ')
        return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content }, injectTo: 'head-prepend' }]
      }
    }
  }
}

export default defineConfig({
  plugins: [cspMeta()],
  // The unit tests only; the browser tests in e2e/ are Playwright's.
  test: { include: ['src/**/*.test.ts'] },
  build: {
    rollupOptions: {
      input: { main: 'index.html', player: 'player.html', 404: '404.html', ...docs }
    }
  }
})
