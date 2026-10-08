/*
 * The guides, from Markdown to pages: each `docs/<name>.md` becomes `docs/<name>.html`, and
 * `docs/index.html` lists them. Vite then builds those pages like any other, so they get the
 * site's styles, the theme switch and the build's CSP. The HTML files are generated, not kept:
 * `.gitignore` leaves them out, and `pnpm dev` and `pnpm build` run this first.
 *
 * Links between guides are written as they are on GitHub, `hosting-packages.md#server-headers`,
 * and rewritten here to the page's address, `/docs/hosting-packages#server-headers`, so the
 * Markdown reads on GitHub too.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Marked } from 'marked'

const DOCS = new URL('../docs/', import.meta.url).pathname

/** The guides in the order the index lists them, with the line the index says about each. */
const GUIDES = [
  ['embedding', 'Display options, the resizer script, browser support, sites that restrict iframes, and a pre-publish checklist'],
  ['hosting-packages', 'Where to put the .h5p file, CORS and Range headers, packages without libraries, slow video'],
  ['privacy-and-security', 'What the iframe isolates, what is saved, cookies, and what you still need to protect'],
  ['results-and-xapi', 'Why scores do not reach a gradebook, and how a page can receive xAPI statements'],
  ['accessibility', 'What Embed My provides and what activity authors must check'],
  ['troubleshooting', 'Common problems and how to report one']
]

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** GitHub's heading ids, near enough: lower case, punctuation dropped, spaces to hyphens. */
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const marked = new Marked({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens)
      return `<h${depth} id="${slug(text)}">${text}</h${depth}>\n`
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens)
      // `name.md`, `name.md#part` → `/docs/name#part`; anything else as written.
      const local = /^([a-z0-9-]+)\.md(#.*)?$/.exec(href)
      const target = local ? `/docs/${local[1]}${local[2] ?? ''}` : href
      const external = /^https?:\/\//.test(target)
      const attrs = [`href="${escapeHtml(target)}"`]
      if (title) attrs.push(`title="${escapeHtml(title)}"`)
      if (external) attrs.push('rel="noopener"')
      return `<a ${attrs.join(' ')}>${text}</a>`
    }
  }
})

const page = ({ name, title, description, body }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} — Embed My</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="https://embed-my.org/docs/${name}" />
    <meta name="theme-color" content="#7847a0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <!-- The same pinned-theme script as index.html, for the same reason: no flash of the wrong theme. -->
    <script>
      try {
        const pinned = localStorage.getItem('theme')
        if (pinned === 'light' || pinned === 'dark') document.documentElement.dataset.theme = pinned
      } catch {}
    </script>
    <link rel="stylesheet" href="/src/styles/docs.css" />
    <script type="module" src="/src/docs.ts"></script>
  </head>

  <body>
    <svg hidden>
      <symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </symbol>
      <symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </symbol>
      <symbol id="i-github" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
      </symbol>
    </svg>

    <div class="wrap">
      <header class="topbar">
        <a class="brand" href="/" aria-label="Embed My, home">
          <img class="brand-mark" src="/favicon.svg" alt="" width="32" height="32" />
          <span class="brand-text">
            <span class="brand-name">embed-my</span>
            <span class="brand-tagline">Your content, anywhere</span>
          </span>
        </a>
        <nav aria-label="Site">
          <a href="/docs/">Guides</a>
          <a href="/docs/troubleshooting">Help</a>
        </nav>
        <div class="topbar-actions">
          <button type="button" class="icon-button" id="theme-toggle" aria-label="Switch theme">
            <svg class="icon icon-moon" aria-hidden="true"><use href="#i-moon" /></svg>
            <svg class="icon icon-sun" aria-hidden="true"><use href="#i-sun" /></svg>
          </button>
          <a class="icon-button" href="https://github.com/embed-my" rel="noopener" aria-label="Embed My on GitHub" title="Embed My on GitHub">
            <svg class="icon" aria-hidden="true"><use href="#i-github" /></svg>
          </a>
        </div>
      </header>

      <main class="doc">
        <nav class="doc-nav" aria-label="Guides">
          <a href="/docs/">All guides</a>
${GUIDES.map(([slug, _]) => `          <a href="/docs/${slug}"${slug === name ? ' aria-current="page"' : ''}>${escapeHtml(titleOf(slug))}</a>`).join('\n')}
        </nav>
        <article class="doc-body">
${body}
        </article>
      </main>

      <footer class="footer doc-footer">
        <p>
          Something wrong or missing in this guide? Open an issue on
          <a href="https://github.com/embed-my/website/issues" rel="noopener">GitHub</a>.
          Independent of H5P Group. “H5P” is a trademark of H5P Group.
        </p>
      </footer>
    </div>
  </body>
</html>
`

const titles = new Map()
const titleOf = (slug) => titles.get(slug) ?? slug

const sources = (await readdir(DOCS)).filter((file) => file.endsWith('.md')).sort()
const parsed = []
for (const file of sources) {
  const name = file.slice(0, -3)
  const markdown = await readFile(join(DOCS, file), 'utf8')
  const title = /^#\s+(.+)$/m.exec(markdown)?.[1] ?? name
  titles.set(name, title)
  parsed.push({ name, title, markdown })
}

for (const { name, title, markdown } of parsed) {
  const description = GUIDES.find(([slug]) => slug === name)?.[1] ?? title
  const body = marked.parse(markdown)
  await writeFile(join(DOCS, `${name}.html`), page({ name, title, description, body }))
}

const index = GUIDES.map(
  ([slug, line]) => `<li><a href="/docs/${slug}"><strong>${escapeHtml(titleOf(slug))}</strong></a><br />${escapeHtml(line)}</li>`
).join('\n')
await writeFile(
  join(DOCS, 'index.html'),
  page({
    name: 'index',
    title: 'Guides',
    description: 'How to embed an H5P activity with Embed My: hosting the package, display options, privacy, results, accessibility and troubleshooting.',
    body: `<h1>Guides</h1>\n<p>Everything about putting an H5P activity on a page with Embed My. Start with the first one.</p>\n<ul class="doc-index">\n${index}\n</ul>`
  })
)

console.log(`docs: ${parsed.length} guides and an index written to docs/`)
