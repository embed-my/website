# Privacy and security

## What Embed My isolates

H5P packages contain JavaScript libraries. The player runs them inside the Embed My iframe, on the player's own origin, `embed-my.github.io`, rather than on the website where you paste the iframe, and apart from this website too. A package loaded through Embed My therefore does not run as JavaScript on your portfolio, school site, or CMS origin, and cannot read that site's cookies or storage. This is especially useful when the embedding site cannot safely host its own H5P player files.

## What it does not isolate

Browsers give the Embed My frame separate storage for each site that embeds it, so what a package does inside the frame stays with your site's embeds. Within that, every package embedded through Embed My on the same site shares one store: a package can read, and change, what other packages on that site have extracted there, which is their files and package URLs.

Embed only packages you trust, as you would any script.

## What the frame can do to your page

The snippet gives the frame no permission beyond fullscreen: no camera, microphone or location. It cannot read or change your page. But browsers let any iframe navigate the whole tab once the visitor has clicked inside it, so a hostile package could send a visitor who clicks on it to another address. That is one more reason to embed only packages you trust. A site that wants to rule it out can add `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"` to the iframe; test the activity afterwards, because a sandbox also stops the frame's own "Open it on its own" link.

The script line, `h5p-resizer.js`, is the one part of the snippet that runs on your page itself, with the same rights as your own scripts. It is about sixty lines, it only sets an iframe's height when that frame reports it, and you can read it at the address in the snippet. Leave it out and the frame keeps the height in the `style` attribute.

## What is saved

No learner records. The embed page never turns on the player's resume feature, so answers and progress are not saved anywhere, and reloading the page starts the activity over. Embed My stores nothing on its side either.

The visitor's browser does cache the package's files and address (Cache Storage and IndexedDB on the player's origin, kept separate per embedding site) so the next load is faster. Clearing the browser's site data removes it.

## Cookies and tracking

Embed My is a minimal, public player origin: it has no accounts, serves no advertising, runs no analytics, and sets no application cookies. The frame reports nothing to anyone. The embedding website controls its own privacy notice and any analytics it places around the iframe.

The pages and the script are served by GitHub Pages. Like any web host, GitHub sees each request as it is made, which includes the visitor's IP address and the frame's address with the package URL in it, under [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). Embed My itself keeps no logs and has no access to GitHub's.

H5P content itself may contact services named by the package, such as YouTube, Vimeo, Google Fonts, MathJax, or an organization-hosted media service. Review a package and its third-party content before publishing it.

One request the frame can make on its own: a package exported without its libraries takes them from a bundle on the player origin, and for a content type that bundle lacks, from the H5P hub at `api.h5p.org`. That request names the content type, not the visitor, and is made only when the bundle falls short.

## Data protection

Checking a package on embed-my.org involves only you: your browser fetches the package from its host and plays it, and Embed My never receives it.

A snippet on someone else's page is different. When the page opens, each visitor's browser requests the sizing script and the frame from GitHub Pages, and GitHub receives the visitor's IP address and the page's address. The package host receives the IP address too. The player keeps its files and the package's index in the browser's storage on the visitor's device. Embed My is a free tool, not a company, so there is no data-processing agreement to sign, and GitHub's own agreements cover GitHub's customers, not the visitors of a page that embeds a snippet.

Many schools and companies cannot accept that under their data-protection rules. Ask whoever looks after data protection before putting a snippet on an organisation's pages. The alternative that removes the question is to run [the player](https://github.com/missing-elements/h5p-offline-player) on a host the organisation controls, with the packages on that host too: then no third party is involved.

## What you should still protect

- **Share only packages you are allowed to publish.** An H5P package can include copyrighted media, learner-facing data, and JavaScript libraries.
- **Do not put secret package URLs in an embed.** The package URL appears in the iframe address and can be visible in browser history, page source, server logs, and referrer-related systems. A signed URL that expires keeps working only for visitors whose browser already opened it; new visitors get an error.
- **Use HTTPS.** The page containing the iframe must use HTTPS (or `localhost` during development). The player needs a secure context for its Service Worker.
- **Treat the package host as public.** Anyone who can view the page can discover and request the package URL.
- **Avoid personal data in the package.** Embed My is a player, not a learner-record store.

Do not use Embed My to embed private learner records, passwords, API keys, or confidential course material.

## Reporting a vulnerability

Vulnerabilities in the player itself are handled under the h5p-offline-player [security policy](https://github.com/missing-elements/h5p-offline-player/blob/main/SECURITY.md). For the website and the snippet it writes, see the site's [SECURITY.md](https://github.com/embed-my/website/blob/main/SECURITY.md); for the `/h5p` page and the sizing script, the player origin's [SECURITY.md](https://github.com/embed-my/embed-my.github.io/blob/main/SECURITY.md).
