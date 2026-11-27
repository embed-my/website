# Security

Embed My has no accounts and keeps no data: the site is static files on GitHub Pages, an activity
is built and played in the visitor's browser, and the server in `worker/` stores and logs nothing.

- **The player, the H5P runtime, the author and the `@missing-elements/h5p-mcp` package**: report
  it under the
  [h5p-toolkit security policy](https://github.com/missing-elements/h5p-toolkit/blob/main/SECURITY.md).
- **This repository** (the pages, their Content-Security-Policy, and the Worker in `worker/`: its
  code and configuration): report it privately through
  [GitHub's security advisory form](https://github.com/embed-my/website/security/advisories/new)
  for this repository, not as a public issue.
