# Preparing and hosting packages

Embed My does not store your `.h5p` file. It plays the package from a URL you provide, so the file has to be complete and reachable by a visitor's browser.

## Where to put the file

The URL must point at the `.h5p` file itself, over **HTTPS**, and be public:

```text
https://embed-my.github.io/samples/quiz.h5p
```

Do not use a link to a download page, a cloud-drive preview page, or a private LMS page. If your website cannot host the file, upload it to a host that provides a public HTTPS URL with CORS access first.

Opening the URL in a private browser window should download the package without a login.

## Server headers

### CORS (required)

The H5P package is fetched by the Embed My frame, on `https://embed-my.github.io`, not by the page it is embedded in, so the file host must allow cross-origin requests from that origin; `Access-Control-Allow-Origin: *` is the usual way. For publicly shared teaching material, a permissive header is often appropriate:

```text
Access-Control-Allow-Origin: *
```

### Range requests (recommended)

For large packages, also support ranged requests and expose their headers:

```text
Accept-Ranges: bytes
Access-Control-Expose-Headers: Content-Range, Accept-Ranges, Content-Length
```

With them, a large package starts playing after a few kilobytes. Without them, it is downloaded whole before anything plays, which still works.

GitHub Pages meets both requirements as it comes. The player's [setup guide](https://github.com/missing-elements/h5p-offline-player/blob/main/h5p-player-setup.md#requirements) describes exactly what it checks.

## Packages and library files

An H5P package normally includes the libraries it needs. Some exports, notably from H5P.com and h5p.org, contain only `content/` and expect the site they came from to provide the libraries.

If the preview reports missing libraries:

- export the activity as a complete package, including libraries, when your authoring tool offers that option; or
- select a library source in Embed My if your organization provides one.

An activity that works inside one LMS is not necessarily a complete, portable `.h5p` package. Always preview it before publishing. The player's [libraries guide](https://github.com/missing-elements/h5p-offline-player/blob/main/docs/libraries.md) explains how library sources work.

## How big can a package be?

Embed My sets no limit and never holds the file; what limits a package is where it lives.

- **On a host that answers `Range` requests**, the player reads the archive in place. It fetches the index with a few kilobytes, pulls only the parts the activity asks for, and never holds more than 8 MB in memory, so a 300 MB package starts within seconds. The ceiling is your host and your visitors' connection, not the player.
- **On a host without `Range`**, the whole archive is downloaded and stored in the visitor's browser before anything plays. A package larger than the room the browser gives the site fails with a storage error that names the size it needed. That room varies by browser, is smaller for a frame inside another site and in private windows, and has no fixed number: tens of megabytes are safe there, hundreds are a gamble. Prefer a host that supports ranges, or keep the package small.
- **Hosts cap files too.** GitHub refuses single files over 100 MB, so that is the practical ceiling on GitHub Pages.
- **Size is almost always video**, and video compressed inside the archive or not arranged for streaming has to download in full before it plays on any host. See the next section.

## Video that is slow to start

Large media may be compressed inside the `.h5p` archive, or the video may not be arranged for progressive playback, so it cannot start until it has fully downloaded. Rewrite the package once with:

```bash
npx @missing-elements/h5p-normalize course.h5p
```

This rewrites the package for streaming without changing the learning content. The player's [streaming video guide](https://github.com/missing-elements/h5p-offline-player/blob/main/docs/streaming-video.md) explains the cause.

## Third-party content

H5P content may contact services named by the package, such as YouTube, Vimeo, Google Fonts, MathJax, or an organization-hosted media service. Review a package and its third-party content before publishing it. See [Privacy and security](privacy-and-security.md).
