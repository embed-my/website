# Troubleshooting

## The preview says the package cannot be fetched

Check that:

- the URL is a direct `https://.../*.h5p` URL;
- opening it in a private browser window downloads the package or shows the archive response;
- the file host permits cross-origin browser requests (CORS) from `https://embed-my.github.io`, the origin the frame runs on (`Access-Control-Allow-Origin: *` is the usual way);
- the URL has not expired and does not require an LMS login.

[Preparing and hosting packages](hosting-packages.md#server-headers) lists the headers to set if you control the host.

## The activity works in my LMS but not in Embed My

The export may not include the H5P libraries it relies on. Re-export a complete package or use an approved library source. See [Packages and library files](hosting-packages.md#packages-and-library-files).

## The activity is cut off or leaves blank space

The resizer script from the generated snippet is missing or was stripped by your site. Use the platform's dedicated **Embed**, **Custom HTML**, or **iframe** block, which usually keeps scripts, or ask the site administrator to allow the script. If scripts cannot be used at all, set the iframe's height to fit the activity. See [The resizer script](embedding.md#the-resizer-script).

## A video is slow to start

The media is probably compressed inside the archive or not arranged for progressive playback. Ask the package publisher to run `npx @missing-elements/h5p-normalize course.h5p`. See [Video that is slow to start](hosting-packages.md#video-that-is-slow-to-start).

## The activity does not load in an app's built-in browser

Some in-app browsers give a frame no Service Worker, and the frame shows a link to open the activity on its own page. Share that link, or the page's own URL to open in a regular browser.

## Nothing plays on my page

Check that the page containing the iframe is served over `https://`. On `http://` the frame has no Service Worker.

## The host blocks the iframe

The site's Content Security Policy must allow `frame-src https://embed-my.github.io`. If it cannot, link to the activity's Embed My page instead. See [Sites that restrict iframes](embedding.md#sites-that-restrict-iframes).

## Other problems

The player's [troubleshooting table](https://github.com/missing-elements/h5p-offline-player/blob/main/h5p-player-setup.md#troubleshooting) covers error codes and less common symptoms in detail, such as formulas shown as raw LaTeX or a missing copyright button.

## Reporting a problem

Open an issue where the problem lives:

- **The activity itself**: it does not load, plays wrong, a content type misbehaves, a video is slow, the toolbar or fullscreen fails. That is the player, and its issues go to [h5p-offline-player](https://github.com/missing-elements/h5p-offline-player/issues). Most reports end up here.
- **This website**: the snippet it writes, the preview, the options, the page itself, and these guides: [embed-my/website](https://github.com/embed-my/website/issues).
- **The frame itself**, `/h5p` on embed-my.github.io, or the sizing script: [embed-my/embed-my.github.io](https://github.com/embed-my/embed-my.github.io/issues).

Not sure which? Pick the website; it will be moved. Whichever it is, include:

- the page URL where the activity is embedded;
- the package URL, if it is public;
- the browser and version, and whether it is an app's built-in browser;
- a screenshot or the visible error message;
- whether the package worked from a local `.h5p` file or inside another platform.
