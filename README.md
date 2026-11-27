# embed-my.org

The site of Embed My, at <https://embed-my.org>: a hub for apps that make and play H5P activities
with no H5P server, built on Missing Elements' open-source [player and tools](https://github.com/missing-elements/h5p-toolkit).
The first app is **EmbedMy Lesson**, an app for ChatGPT. This repository holds its pages and, in
[`worker/`](worker/), its server.

## What it serves

| Path | What it is | Source |
| --- | --- | --- |
| `/` | The apps and the player they are built on | [src/index.njk](src/index.njk); the lists are in [src/_data/site.js](src/_data/site.js) |
| `/h5p/play/` | The play page EmbedMy Lesson's card frames: it builds the activity in a link's `#source=` in the visitor's browser and plays it, with its download. No page links to it | [src/h5p/play/](src/h5p/play/) |
| `/privacy/`, `/terms/`, `/support/` | The privacy policy, the terms and the support page of the site and of EmbedMy Lesson, which OpenAI's listing asks for. Not legal advice: a lawyer is to confirm the policy and the terms before the app is submitted | [src/privacy/](src/privacy/), [src/terms/](src/terms/), [src/support/](src/support/) |

The play page is a copy of missing-elements.github.io's, which keeps its own as the default of
`@missing-elements/h5p-mcp`'s app server, and the build page its "Open in the build page" links
to. The guides, the h5p-author skill and its bundles are there too.

## Develop

Needs Node 22.12 or later and pnpm.

```bash
pnpm install
pnpm dev        # Eleventy's server, http://localhost:8080
pnpm build      # type-checks, then Eleventy writes _site/, then Vite the play page's script into it
pnpm preview    # serves _site/ as GitHub Pages does, http://localhost:4173
```

`pnpm dev` shows the pages as Eleventy writes them: the play page's script is there only after a
`pnpm build`.

## How it is built and deployed

- **Eleventy** writes the pages from `src/` into `_site/`, with `public/CNAME`, which keeps the
  custom domain. They ship no framework: their scripts are the theme toggle
  ([src/assets/site.js](src/assets/site.js)) and the play page's.
- **Vite** then writes the play page's script into `_site/h5p/play/`, bundled with the H5P player,
  its runtime and the library pack, which it emits into `/h5p/assets/` with their licences. The
  player's Service Worker lands there too, so its scope is `/h5p/assets/h5p/`.
- A push to `main` deploys through [deploy.yml](.github/workflows/deploy.yml); a pull request is
  built by it too.
- **The server** in `worker/` is deployed by hand: [worker/README.md](worker/README.md).

## What it pins

The pages and the server run published releases, pinned exactly in `package.json` and
`worker/package.json`: `@missing-elements/h5p-author`, `h5p-libraries`, `h5p-offline-player`,
`h5p-runtime` and, for the server, `h5p-mcp`. To move a pin, change its version, run
`pnpm install`, then `pnpm build` (or `pnpm test` in `worker/`), and commit the lockfile with it.
Dependabot takes a new `@missing-elements` release the day it comes out, where it holds other
packages back three days ([.github/dependabot.yml](.github/dependabot.yml)).

## Licence

MIT. The H5P runtime the play page loads is GPL-3.0 and each H5P library keeps its own licence;
their texts are served beside them in `/h5p/assets/`. H5P is a registered trademark of H5P Group AS;
Embed My is not affiliated with H5P Group.
