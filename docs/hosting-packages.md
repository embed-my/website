# Preparing and hosting packages

Embed My does not store your `.h5p` file. It plays the package from a URL you provide, so the file has to be complete and reachable by a visitor's browser.

## Where to put the file

The URL must point at the `.h5p` file itself, over **HTTPS**, and be public:

```text
https://embed-my.github.io/samples/quiz.h5p
```

Do not use a link to a download page, a cloud-drive preview page, or a private LMS page. If your website cannot host the file, use one of the [free places](#free-places-to-put-the-file) below.

Opening the URL in a private browser window should download the package without a login.

## Free places to put the file

Checked on 9 October 2026 from the Embed My player origin, by request headers and, where a `.h5p` file was available, by playing it through the player. Services change their terms and their links; if one of these stops working, [tell us](troubleshooting.md#reporting-a-problem).

| Host | Free allowance | You upload with | Starts playing before the download ends | Largest file | Checked by |
|---|---|---|---|---|---|
| **Dropbox** Basic, with one edit to the link | 2 GB; 20 GB of link traffic a day | the Dropbox website or app | yes | no stated limit | headers |
| **GitHub** public repository | 1 GB per repository | the GitHub website | yes | 25 MB from the browser, 100 MB with git | playing a package |
| **Zenodo** | 50 GB per record | the Zenodo website | yes | no stated limit | playing a package |
| **Backblaze B2** | 10 GB, downloads up to 3× that a month | the Backblaze website | yes | no stated limit | headers |
| **Cloudflare Pages** | 500 uploads a month | drag and drop in the dashboard | no, the whole file downloads first | 25 MB | headers |

What does not work, and why: **Google Drive**, **OneDrive** and **SharePoint** share links send the file without the CORS header and offer no way to add it; the **Internet Archive** sends the header on its redirect but not from the servers that deliver the file; **Neocities** free sites do not accept `.h5p` files; **jsDelivr** serves an altered copy of a binary file, which the player refuses; **Supabase** free projects pause after a week without activity; **GitLab Pages** needs a build pipeline and identity verification; **LMS file links** (Moodle, Canvas, Google Classroom) need a login. **Netlify**, **Vercel** and **Cloudflare R2** work for anyone comfortable adding a headers file or a bucket setting; see the end of this section.

### Dropbox

Most teachers already have an account, and the only step beyond sharing is one edit to the link.

1. Upload the `.h5p` file to Dropbox.
2. Share it: **Create link**, with **Anyone with the link** able to view. Copy the link. It looks like `https://www.dropbox.com/scl/fi/abc123/quiz.h5p?rlkey=xyz&dl=0`.
3. In that link, replace `www.dropbox.com` with `dl.dropboxusercontent.com`, and `dl=0` at the end with `dl=1`: `https://dl.dropboxusercontent.com/scl/fi/abc123/quiz.h5p?rlkey=xyz&dl=1`.
4. Paste the edited link into Embed My. The unedited link does not work: it redirects, and the redirect carries no CORS header.

A Basic account's links are paused for 24 hours once they have served 20 GB, or 100,000 downloads, in a day, counted across all your links. That is hundreds of plays of a typical package. The direct-download address is not something Dropbox documents, so if it ever stops working, come back to this guide; the file itself is safe in your Dropbox either way.

### GitHub

No Pages site needed: a file in a public repository already has an address that works.

1. Create a free account, then a new **public** repository, named for example `h5p`.
2. **Add file → Upload files**, drag the `.h5p` in, and **Commit changes**. The website takes files up to 25 MB; git tools take up to 100 MB.
3. Open the file in the repository, press **Raw**, and copy the address: `https://raw.githubusercontent.com/<you>/h5p/main/quiz.h5p`.

Upload a new file under the same name to update the activity; the address stays the same. GitHub does not mean this address for heavy traffic, but a class or a school site is nowhere near that. [GitHub Pages](https://docs.github.com/en/pages) serves the same files at a `<you>.github.io` address, which is what Embed My itself uses.

### Zenodo

For material you are publishing openly anyway. Zenodo is the research repository run by CERN: free, permanent, and it gives the upload a DOI.

1. Create an account, then **New upload**. Choose the resource type **Lesson**, add the `.h5p` file, a title and a licence, and **Publish**.
2. The address to use is **not** the download link on the page. Build it from the record number in the page's address and the file name: `https://zenodo.org/api/records/<record number>/files/quiz.h5p/content`.

Everything on Zenodo is public and permanent: a published file cannot be replaced, and a new version gets a new record number, so an updated activity means a new link and a new snippet. Each record takes up to 50 GB.

### Backblaze B2

Plain file storage with a generous free tier and no card to sign up.

1. Create a free account and a bucket with **Files in bucket** set to **Public**.
2. In the bucket's settings, under **CORS Rules**, choose **Share everything in this bucket with all HTTPS origins**, for both APIs. Without this step the file is refused.
3. Upload the file and copy its **Friendly URL**: `https://f00x.backblazeb2.com/file/<bucket>/quiz.h5p`.

The first 10 GB are free, and so are downloads up to three times what you store each month; beyond that Backblaze charges by the gigabyte, with a card on file.

### Cloudflare Pages

Fine for small packages, and nothing to configure.

1. Create a free account. In the dashboard, **Workers & Pages → Create → Drag and drop your files**, and drop a folder that holds the `.h5p` file.
2. The address is `https://<project>.pages.dev/quiz.h5p`.

Every file is sent with the CORS header already. Pages does not answer Range requests, so the whole package downloads before it plays, and a single file cannot be larger than 25 MB.

### Your own or your school's web host

Any web space that serves files over HTTPS works once it sends the CORS header. Ask whoever runs it to add `Access-Control-Allow-Origin: *` for the folder, which on Apache is one line in `.htaccess` and on nginx one `add_header` line. WordPress refuses `.h5p` uploads to its media library unless an administrator allows the file type.

### For the technically minded

- **Netlify** (free tier, drag and drop): add a file named `_headers` at the top of the folder you drop, containing `/*` on one line and `  Access-Control-Allow-Origin: *` on the next.
- **Vercel** (Hobby tier, non-commercial use): add a `vercel.json` with a `headers` rule setting the same header for `/(.*)`.
- **Cloudflare R2** (10 GB free, free downloads): enabling R2 goes through a checkout that asks for a payment method; then set the bucket's CORS policy and give it a public address.

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

With them, a large package starts playing after a few kilobytes. Without them, it is downloaded whole before anything plays, which still works. A simple range such as `bytes=0-99` needs no CORS preflight, so a host that ignores `OPTIONS` requests is not a problem.

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
