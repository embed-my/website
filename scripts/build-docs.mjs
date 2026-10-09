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
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import xml from 'highlight.js/lib/languages/xml'
import { Marked } from 'marked'

// Only the languages the guides use; a fence with any other name, or none, stays plain text.
hljs.registerLanguage('html', xml)
hljs.registerLanguage('bash', bash)

const DOCS = new URL('../docs/', import.meta.url).pathname

/** The guides in the order the index lists them, with the line the index says about each. */
const GUIDES = [
  ['hosting-packages', 'Where to put the .h5p file, CORS and Range headers, packages without libraries, slow video'],
  ['privacy-and-security', 'What the iframe isolates, what is saved, cookies, the GDPR, and what you still need to protect'],
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
    /**
     * A fenced block, coloured at build with classes the stylesheet knows, never inline styles:
     * the pages' Content-Security-Policy allows no inline style, and classes follow the theme.
     */
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : null
      const body = language ? hljs.highlight(text, { language }).value : escapeHtml(text)
      const classes = language ? ` class="hljs language-${language}"` : ''
      return `<pre><code${classes}>${body}</code></pre>\n`
    },
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
            <span class="brand-tagline">Test your activities here</span>
          </span>
        </a>
        <nav aria-label="Site">
          <a href="/docs/">Guides</a>
          <a href="/player">Player</a>
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
          <a class="doc-nav-all" href="/docs/"${name === 'index' ? ' aria-current="page"' : ''}>All guides</a>
          <ul class="doc-nav-guides">
${GUIDES.map(([slug]) => navGuide(slug, slug === name)).join('\n')}
          </ul>
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

/**
 * A guide's chapters (`##`) with their sub-chapters (`###`), as the sidebar lists them. Each id is
 * made the way the heading renderer makes it, so the links land on the headings.
 */
const outlines = new Map()
function outline(markdown) {
  const chapters = []
  for (const token of marked.lexer(markdown)) {
    if (token.type !== 'heading' || token.depth < 2 || token.depth > 3) continue
    const html = marked.parseInline(token.text)
    // The label keeps inline code but no links: the entry is a link already.
    const entry = { id: slug(html), label: html.replace(/<\/?a\b[^>]*>/g, ''), children: [] }
    if (token.depth === 2 || chapters.length === 0) chapters.push(entry)
    else chapters.at(-1).children.push(entry)
  }
  return chapters
}

const navList = (entries, depth) =>
  entries.length === 0
    ? ''
    : `\n${'  '.repeat(depth)}<ul class="doc-nav-${depth === 7 ? 'chapters' : 'subchapters'}">\n` +
      entries
        .map(
          (entry) =>
            `${'  '.repeat(depth + 1)}<li><a href="#${entry.id}" data-chapter="${entry.id}">${entry.label}</a>${navList(entry.children, depth + 2)}</li>`
        )
        .join('\n') +
      `\n${'  '.repeat(depth)}</ul>`

/** One guide in the sidebar; the open one also lists its chapters. */
const navGuide = (slug, open) =>
  `            <li${open ? ' class="is-open"' : ''}><a href="/docs/${slug}"${open ? ' aria-current="page"' : ''}>${escapeHtml(titleOf(slug))}</a>` +
  (open ? navList(outlines.get(slug) ?? [], 7) : '') +
  '</li>'

const sources = (await readdir(DOCS)).filter((file) => file.endsWith('.md')).sort()
const parsed = []
for (const file of sources) {
  const name = file.slice(0, -3)
  const markdown = await readFile(join(DOCS, file), 'utf8')
  const title = /^#\s+(.+)$/m.exec(markdown)?.[1] ?? name
  titles.set(name, title)
  outlines.set(name, outline(markdown))
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
    description: 'How to check an H5P package with Embed My, and optionally embed it: hosting the file, display options, privacy, results, accessibility and troubleshooting.',
    body: `<h1>Guides</h1>\n<p>Everything about checking an H5P package with Embed My, and about the optional snippet. Start with the first one.</p>\n<ul class="doc-index">\n${index}\n</ul>`
  })
)

console.log(`docs: ${parsed.length} guides and an index written to docs/`)
