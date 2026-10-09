/**
 * Where the snippets point: the player origin, which serves the embed page (`/h5p`), the sizing
 * script (`/h5p-resizer.js`) and the samples. It is the GitHub Pages address of
 * embed-my/embed-my.github.io, with no custom domain, on purpose: it belongs to the project for
 * as long as it is on GitHub, with nothing to renew and nothing anyone else can register, so every
 * snippet ever pasted outlives this site's domain. And it is an origin apart from this site's, so
 * a package's scripts never run where the snippet is written. Fixed, so a snippet copied from a
 * local build works on a visitor's page too.
 */
export const SITE_ORIGIN = 'https://embed-my.github.io'

/**
 * The page the preview frames: `/h5p` on the player origin, the very page the snippet names, so
 * what plays in the preview is what plays on a visitor's page. `VITE_PLAYER_URL` in `.env.local`
 * points it at a local build of the player (embed-my/embed-my.github.io) instead; the build's
 * Content-Security-Policy allows that origin as a frame then.
 */
export const PLAYER_URL = import.meta.env.VITE_PLAYER_URL || `${SITE_ORIGIN}/h5p`

/**
 * Where the sample packages are: on the player origin, beside the frame that fetches them, so the
 * fetch is same-origin and needs no CORS. The chips on the page hold a path, resolved against
 * this, so a preview against a local player plays that player's own copies.
 */
export const SAMPLES_ORIGIN = new URL(PLAYER_URL).origin

/** The embed page's path on the player origin. */
export const EMBED_PATH = '/h5p'


/** What the snippet shows before a link is pasted: the example from the embedding guide. */
export const EXAMPLE = {
  src: `${SITE_ORIGIN}/samples/quiz.h5p`,
  title: 'Sample quiz',
} as const

/** The frame title when none was typed and the file name gives none. */
export const FALLBACK_TITLE = 'Interactive activity'

/** How long the preview may stay silent before the page offers to open it on its own. */
export const PREVIEW_STALL_MS = 15_000
