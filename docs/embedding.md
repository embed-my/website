# Embedding an activity

How to create an Embed My snippet for an H5P package, what the snippet contains, and how to check it before you share the page.

Before you start, you need a public HTTPS URL for the `.h5p` file. See [Preparing and hosting packages](hosting-packages.md).

## Create the embed

1. Open [Embed My](https://embed-my.org/).
2. Choose **H5P package**.
3. Paste the direct public URL ending in `.h5p`.
4. Preview the activity.
5. Choose display options:
   - a **title** for the frame, which screen readers announce;
   - the buttons of H5P's own **toolbar** under the activity: **Rights of use**, which shows the licences recorded in the package and its media, and **Reuse**, which lets visitors download the package. Tick neither and the frame shows no toolbar.
6. Copy the generated snippet.
7. Paste it into the HTML/embed block of your website and publish the page.

## What the snippet contains

```html
<iframe
  src="https://embed-my.github.io/h5p?src=https://embed-my.github.io/samples/quiz.h5p"
  title="Sample quiz"
  loading="lazy"
  allow="fullscreen"
  style="width: 100%; min-height: 540px; border: 0"
></iframe>
<script src="https://embed-my.github.io/h5p-resizer.js"></script>
```

Use the exact code Embed My generates. It may include additional parameters for a display option you selected. The package in the example is one of the samples Embed My hosts itself; yours will be at your own address.

### The resizer script

The script line lets the frame grow and shrink with the activity: the frame reports its height, and the script, included once per page, applies it. It is served by Embed My, so your page sends nothing to a third party.

- **Without it**, the frame stays at the height in the `style` attribute and anything taller scrolls inside it.
- **If your site strips scripts** from pasted HTML, keep the iframe and give it a height that fits the activity.
- **If the page already includes h5p.org's own `h5p-resizer.js`**, served from h5p.org for its h5p.org embeds, you need no second script: Embed My's file has the same name because it speaks the same protocol.

## How long an embed works

For as long as this project is on GitHub. There is no expiry and nothing to renew, and the address in the snippet is one that cannot expire.

- **The snippet uses an address that cannot expire.** It points at `embed-my.github.io`, which GitHub provides to this project for free, for as long as the project exists: nothing to renew, and no one else can claim it. The `embed-my.org` you see in your browser is only a nicer name for this website; the snippet does not depend on it, so every embed already on a page would keep working if that name were ever lost.
- **Your package stays yours.** The `.h5p` file lives on your host. Embed My only points at it and keeps no copy, so nothing of yours is lost if the project ends.
- **If the project ever stops, the frame shows an error** where the activity was. The rest of your page is unaffected: a frame that cannot load and a script that is not found break nothing around them.
- **You can run the same player yourself.** It is [h5p-offline-player](https://github.com/missing-elements/h5p-offline-player), MIT-licensed. Its [setup guide](https://github.com/missing-elements/h5p-offline-player/blob/main/h5p-player-setup.md) covers putting the player straight on your own site or serving the embed page from a host you control; either way your package stays as it is.

### If you would rather load nothing from anyone

The iframe is only a window onto Embed My, but `h5p-resizer.js` runs on your page itself. Copy it to your own site and point the snippet's `<script src>` at your copy: it is about sixty lines, MIT-licensed, and needs no updates; any copy keeps working with the frame. The frame is then the only thing your page takes from Embed My.

## Example: a portfolio page

If your package is at:

```text
https://portfolio.example/learning/windows-shortcuts.h5p
```

create an embed for that URL and paste the snippet into your portfolio's HTML/embed block. Visitors can complete the activity without an LMS account.

## Browser support

The activity runs inside the Embed My frame with its own Service Worker. That works in current Chrome, Edge, Firefox and Safari, on desktop and on phones.

- **The page containing the iframe must be served over HTTPS** (or `localhost` during development). On a plain `http://` page the frame has no Service Worker and nothing plays.
- **In-app browsers** inside social and messaging apps sometimes give a frame no Service Worker at all. The frame then shows a link that opens the activity on its own Embed My page. Offer that link wherever an iframe cannot be used.

## Sites that restrict iframes

Some sites have a Content Security Policy that restricts frames. The embedding site must allow:

```text
frame-src https://embed-my.github.io
```

That is the only address the frame loads from; `embed-my.org` is this website, which the snippet never names.

If the site cannot allow an iframe, link to the activity's Embed My page instead.

## Test before sharing

Open the published page in a private/incognito window and check that:

1. The activity loads and is not stuck on a blank frame.
2. Its interactions, media, and fullscreen button work.
3. The iframe expands far enough to show the entire activity.
4. A large video starts in an acceptable time on a normal connection.
5. The activity works for a visitor who is not signed in to your authoring system.

To check the package itself before publishing, run the open-source verifier:

```bash
npx @missing-elements/h5p-verify course.h5p
```

It opens the package in a real browser runtime and reports missing libraries, startup errors, and a screenshot. See the player's [verify guide](https://github.com/missing-elements/h5p-offline-player/blob/main/docs/verify.md) for details.

## With an AI assistant

The player's repository ships [agent skills](https://www.skills.sh/missing-elements/h5p-offline-player) for Claude Code, Cursor, Copilot, Codex and the rest. `h5p-embed-my` teaches an assistant this service: the package link to check, the snippet, where to paste it, the xAPI relay and what the service is not. `h5p-verify` checks a package before you share it, and `h5p-normalize` makes a package's video start at once.

```bash
npx skills add missing-elements/h5p-offline-player --skill h5p-embed-my
```

If something does not work, see [Troubleshooting](troubleshooting.md).
