# The EmbedMy Lesson server

The app server of [`@missing-elements/h5p-mcp`](https://github.com/missing-elements/h5p-toolkit/tree/main/packages/mcp)
as a Cloudflare Worker, at `https://mcp.embed-my.org/mcp`. It names itself EmbedMy Lesson, its card
frames embed-my.org's play page, and a chat with no card is sent to the build page on
missing-elements.github.io ([`src/options.mjs`](src/options.mjs)). It is built from the published
packages, pinned exactly in `package.json`; a release of them moves the pin, then the Worker is
deployed again.

- **Hosted at an address of ours.** `mcp.embed-my.org` is one line of `wrangler.jsonc`, since the
  domain's zone is on the same account. The free plan gives 100,000 requests a day for the whole
  account, until midnight UTC; over it, the address answers no call until the reset. Nothing on
  another host is touched: the site stays up.
- **The server's files ride in the Worker.** `createApp()` takes what `import.meta` cannot find in a
  bundle: `version`, `card`, `references` and `libraries`. The library pack's parts, the h5p-author
  skill (its `references/`, with `SKILL.md` and `LICENSE` beside it) and the card are gathered into
  `staged/` by `scripts/stage.mjs` and carried as modules (`find_additional_modules`), which the
  Worker's file system shows under `/bundle` (`nodejs_compat`). About 15 MB, as `pnpm stage` prints, of
  the 64 MiB a Worker may be. Modules, not static assets: nothing of them is served.
- **It writes no log of a call and has nowhere to keep one.** `observability.enabled` is `false`,
  which switches off Workers Logs; no store is bound to it; it has one address, no `workers.dev`
  name and no preview addresses. What Cloudflare counts for any Worker, the requests, their
  statuses, the CPU time, is outside that setting: the privacy page says so.
- **Tested in the Workers runtime.** `tests/worker.test.ts` has wrangler bundle the Worker and start
  it on this computer, and holds each answer to the server's on Node with the same options, word for
  word, and the config to its logs off, no store and one address.
- **The free plan's CPU.** 10 ms a request, with leeway for an overrun now and then; a check took 14
  to 22 ms a call on a laptop in the local runtime (2026-11-24). If it does not hold: Workers Paid,
  $5 a month, with a cap under Billing → Spend Management.

## Deploy

No token of the account is in this repository or in GitHub: someone signed in deploys it.

```sh
cd worker
pnpm install
pnpm exec wrangler login --use-keyring   # once per computer; the token stays in the Keychain
pnpm test                                # the Worker in the Workers runtime, against the server on Node
pnpm deploy                              # gathers staged/, then uploads the Worker h5p-mcp
curl https://mcp.embed-my.org/           # one line of text answers
```

Metrics: Dashboard → Workers & Pages → h5p-mcp. "Exceeded CPU Time Limits" under Invocation
Statuses means a call needed more than the free plan's 10 ms. `pnpm exec wrangler tail` shows calls
as they come and stores nothing. `pnpm exec wrangler rollback` goes back to the previous version.
