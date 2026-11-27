import { readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/*
 * The site's H5P part, `/h5p/`, which Vite builds into `_site/` once Eleventy has written the pages
 * there (`pnpm build`): `/h5p/play/play-page.js`, the play page's script, which EmbedMy Lesson's
 * card frames, `src/h5p/play/index.njk` loads it. The player, its runtime and the library pack name
 * their files relative to their own modules, and Vite emits them into `/h5p/assets/` with everything
 * else. The player's Service Worker lands there too, so its scope is `/h5p/assets/h5p/`: no other
 * page of the site is under it.
 *
 * Copied from missing-elements.github.io, which keeps its own play page and the build page.
 */

/** Where the files a package's licence asks to travel with it are emitted, beside them. */
const ASSETS = 'h5p/assets'

/**
 * Vite writes into Eleventy's `_site/`, so it cannot empty its output folder: the folders only it
 * writes are emptied instead, before it writes them again.
 */
function emptyOwnFolders(): Plugin {
  let outDir = ''
  return {
    name: 'embed-my:empty-own-folders',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    async buildStart() {
      for (const folder of [ASSETS]) await rm(join(outDir, folder), { recursive: true, force: true })
    }
  }
}

/**
 * The text files that travel with the code: the runtime's licence and notice, which it asks to go
 * with copies of it (GPL-3.0), and the library pack's licence list, which asks the same of its
 * libraries. Vite emits the scripts, fonts and parts as hashed assets and would leave them behind.
 */
function licenceFiles(): Plugin {
  const runtime = new URL('./node_modules/@missing-elements/h5p-runtime/dist/', import.meta.url)
  const libraries = new URL('./node_modules/@missing-elements/h5p-libraries/', import.meta.url)
  return {
    name: 'embed-my:licence-files',
    apply: 'build',
    generateBundle() {
      for (const file of ['LICENSE.txt', 'NOTICE.txt']) {
        this.emitFile({ type: 'asset', fileName: `${ASSETS}/runtime-${file}`, source: readFileSync(new URL(file, runtime)) })
      }
      this.emitFile({ type: 'asset', fileName: `${ASSETS}/libraries-LICENSES.txt`, source: readFileSync(new URL('libraries.txt', libraries)) })
    }
  }
}

export default defineConfig({
  publicDir: false,
  // A missing file is a 404, as on GitHub Pages, not the home page: `pnpm preview` answers as the
  // site does, where an SPA's fallback would answer every address with a page.
  appType: 'mpa',
  plugins: [emptyOwnFolders(), licenceFiles()],
  build: {
    outDir: '_site',
    emptyOutDir: false,
    assetsDir: ASSETS,
    // Every package bundled into the page's script with its licence (zod, zip.js and ours), beside
    // the runtime's and the pack's: MIT and BSD-3-Clause ask it to travel with them.
    license: { fileName: `${ASSETS}/play-page-LICENSES.txt` },
    rolldownOptions: {
      input: { 'play-page': 'src/h5p/play/play-page.ts' },
      output: { entryFileNames: 'h5p/play/[name].js' }
    }
  }
})
