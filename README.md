# embed-my.org

The Embed My website: one page that turns a link to an H5P package into an iframe snippet, with a live
preview, and the guides under `/docs`. The player the snippet frames is on its own origin,
[embed-my.github.io](https://github.com/embed-my/embed-my.github.io); this site never runs a package.

## Develop

Needs Node 22.12 or later and pnpm (its version is pinned in `package.json`).

```bash
pnpm install
pnpm dev         # dev server, http://localhost:5173
pnpm test        # unit tests (Vitest)
pnpm typecheck   # TypeScript, no output
pnpm build       # guides, type-check, then build into dist/
pnpm preview     # serve dist/, http://localhost:4173
pnpm e2e         # browser tests against dist/ (build first; once per machine: pnpm exec playwright install chromium)
```

The preview frames the player on its origin, so a local dev server previews against the live player, and the
browser tests need the network. To frame a local build of the player instead, run it from its repository
(`pnpm build && pnpm preview --port 4174`) and put `VITE_PLAYER_URL=http://localhost:4174/h5p` in `.env.local`,
or in the environment of `pnpm build` and `pnpm e2e`: the preview, the sample chips and the build's
Content-Security-Policy all follow it.

## Where things are

| Path | What it holds |
|---|---|
| `index.html` | The page's markup and its icon sprite |
| `src/main.ts` | Wires the page together; every element lookup is here |
| `src/config.ts` | The origin the snippet points at, the page the preview frames, where the samples are, the formats |
| `src/snippet.ts` | Builds the embed address and the snippet; touches no DOM |
| `src/resizer.ts` | Reads the H5P resizer messages the preview frame sends |
| `src/ui/` | One module per part of the page: package form, preview, options, snippet board, theme switch |
| `src/styles/` | `main.css` imports the fonts, the tokens, then one file per part of the page |
| `docs/*.md` | The guides, in Markdown. `scripts/build-docs.mjs` turns them into `docs/*.html` (generated, not committed) before Vite runs, served at `/docs/<name>`; `src/docs.ts` and `src/styles/docs.css` are their script and styles |
| `404.html` | The page GitHub Pages shows for an address that has nothing |
| `e2e/`, `playwright.config.ts` | The browser tests: the home page previews a sample and writes its snippet, the guides link up, and nothing violates the pages' Content-Security-Policy |
| `public/` | Copied into the build as it is: `CNAME`, `logo.svg` (the full logo), `favicon.svg` (its mark alone, also the header logo), `robots.txt`, `sitemap.txt` |

Each page gets a `Content-Security-Policy` in a `<meta>` tag at build, from `vite.config.ts`: GitHub Pages sends
no headers, so the tag is the only policy there is. The inline pinned-theme script is allowed by its hash, and the
player origin is the one frame allowed. The dev server gets no policy, because it injects scripts and styles of
its own. The browser tests fail on any violation.

Tests sit next to the code they test. `snippet.test.ts` holds the example from the embedding guide word for word, so
change the two together. `page.test.ts` checks rules that live in `index.html`: the link field's pattern and the icon
sprite.

## Deploy

A push to `main` runs `.github/workflows/deploy.yml`: unit tests, build, browser tests, then `dist/` goes to GitHub
Pages. Pages has to use **GitHub Actions** as its source (Settings → Pages → Build and deployment); the custom
domain `embed-my.org` is kept in those settings, and `public/CNAME` records it in the build. Actions are pinned to
commits; Dependabot keeps the pins and the packages current.

When both change, deploy the player origin first: the preview here frames its `/h5p`, and the policy allows only
that origin as a frame.
