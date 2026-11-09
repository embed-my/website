/**
 * What the player's page says about the package once it plays, and what the stage shows for it.
 * The embed page posts one `report` when the content is up, with what the player learnt from
 * the host and the archive, and an `error` when a load fails before that. The messages are
 * read here as the page documents them (embed-my.github.io, `src/h5p-page.ts`), each field held
 * to its shape, and turned into the lines under the preview: is the host good, how will it
 * reach visitors, what did it cost, and what does the package say it is.
 */

/** A library that played at another version than the package carries or names: `H5P.Video`, `1.6.66`, `1.6.79`. */
export interface LibraryVersion {
  library: string
  from: string
  to: string
}

export interface PackageReport {
  /** How the bytes were reached: streamed in place, downloaded whole, or picked from disk. */
  source: { type: 'range-http' | 'chunked' | 'file'; size: number | null } | null
  /** `h5p.json`'s own account of the package, as the player read it; its strings are the package's. */
  metadata: {
    title?: string
    license?: string
    licenseVersion?: string
    authors?: string[]
    mainLibrary?: string
  } | null
  /**
   * Where libraries came from that the package did not carry, or newer versions of those it did:
   * `refreshed` lists the libraries it carries that played at the pack's newer version (player
   * 0.10). `null` when it played only its own.
   */
  libraryBundle: { url: string; origin: string; fromCache: boolean; refreshed: LibraryVersion[] } | null
  /** Libraries that played at an older version than the content names, as no source had it (player 1.2). */
  downgradedLibraries: LibraryVersion[]
  /** From the package being set to the content being up, on the page's connection. */
  elapsedMs: number | null
}

export type PlayerMessage = { action: 'report'; report: PackageReport } | { action: 'error'; code: string; message: string }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const optionalString = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

const sizeOf = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null)

/** A list of `{ library, from, to }`, keeping only the entries that give all three as text. */
const versionsOf = (value: unknown): LibraryVersion[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (!isRecord(item)) return []
        const library = optionalString(item.library)
        const from = optionalString(item.from)
        const to = optionalString(item.to)
        return library && from && to ? [{ library, from, to }] : []
      })
    : []

/** A message from the player's page, read as it documents them, or `null` for anything else. */
export function readPlayerMessage(data: unknown): PlayerMessage | null {
  if (!isRecord(data) || data.context !== 'h5p-offline-player') return null
  if (data.action === 'error') {
    const code = optionalString(data.code)
    return code ? { action: 'error', code, message: optionalString(data.message) ?? '' } : null
  }
  if (data.action !== 'report') return null

  let source: PackageReport['source'] = null
  if (isRecord(data.source) && (data.source.type === 'range-http' || data.source.type === 'chunked' || data.source.type === 'file')) {
    source = { type: data.source.type, size: sizeOf(data.source.size) }
  }

  let metadata: PackageReport['metadata'] = null
  if (isRecord(data.metadata)) {
    const authors = Array.isArray(data.metadata.authors)
      ? data.metadata.authors.map(optionalString).filter((name): name is string => name !== undefined)
      : []
    metadata = {
      title: optionalString(data.metadata.title),
      license: optionalString(data.metadata.license),
      licenseVersion: optionalString(data.metadata.licenseVersion),
      authors: authors.length ? authors : undefined,
      mainLibrary: optionalString(data.metadata.mainLibrary)
    }
  }

  let libraryBundle: PackageReport['libraryBundle'] = null
  if (isRecord(data.libraryBundle)) {
    const url = optionalString(data.libraryBundle.url)
    const origin = optionalString(data.libraryBundle.origin)
    if (url && origin) {
      libraryBundle = { url, origin, fromCache: data.libraryBundle.fromCache === true, refreshed: versionsOf(data.libraryBundle.refreshed) }
    }
  }

  const downgradedLibraries = versionsOf(data.downgradedLibraries)
  const elapsedMs = sizeOf(data.elapsedMs)
  return { action: 'report', report: { source, metadata, libraryBundle, downgradedLibraries, elapsedMs } }
}

/* ------------------------------------------------------------------ the lines */

/** `ok` is what a visitor wants, `info` is worth knowing, `warn` costs visitors something, `bad` stops the embed. */
export type Tone = 'ok' | 'info' | 'warn' | 'bad'

export interface Check {
  tone: Tone
  text: string
  link?: { href: string; text: string }
}

const HOSTING = '/docs/hosting-packages'
const TROUBLESHOOTING = '/docs/troubleshooting'

/** Bytes as a visitor reads them: `4.3 MB`, `820 kB`. */
export function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 0 : 1)} MB`
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} kB`
  return `${bytes} bytes`
}

/** `H5P.InteractiveVideo` as a person says it: `Interactive Video`. */
export function contentTypeName(mainLibrary: string): string {
  return mainLibrary
    .replace(/^H5P\./, '')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim()
}

/** H5P's licence codes that are not readable as they are; the rest (`CC BY`, `CC BY-SA`, `CC0 1.0`, …) say themselves. */
const LICENCES: Record<string, string> = {
  U: 'licence not stated',
  C: 'copyright, all rights reserved',
  PD: 'public domain',
  'ODC PDDL': 'public domain (ODC PDDL)',
  'CC PDM': 'public domain (CC PDM)',
  GNU: 'GPL'
}

/** The licence as the package states it, with its version when that is not already in the name. */
export function licenceName(license: string, version?: string): string {
  const named = LICENCES[license]
  if (named) return named
  return version && !license.includes(version) ? `${license} ${version}` : license
}

/** Two libraries by name and version, the rest counted: `Blanks 1.14.13 → 1.14.37, Drag Text 1.10.17 → 1.10.50 and 6 more`. */
function libraryList(versions: LibraryVersion[], words: (version: LibraryVersion) => string): string {
  const named = versions.slice(0, 2).map(words)
  const rest = versions.length - named.length
  return rest > 0 ? `${named.join(', ')} and ${rest} more` : named.join(' and ')
}

const LIBRARY_FILES = { href: `${HOSTING}#packages-and-library-files`, text: 'About library files' }

/** The lines for a package that plays, in the order a visitor reads them: what it is, then how it got here. */
export function describePackage(report: PackageReport, { playerOrigin }: { playerOrigin: string }): Check[] {
  const checks: Check[] = []
  const { source, metadata, libraryBundle, downgradedLibraries, elapsedMs } = report

  if (metadata) {
    const parts = [
      metadata.title,
      metadata.mainLibrary && contentTypeName(metadata.mainLibrary),
      metadata.license && licenceName(metadata.license, metadata.licenseVersion),
      metadata.authors && `by ${metadata.authors.join(', ')}`
    ].filter((part): part is string => Boolean(part))
    if (parts.length) checks.push({ tone: 'info', text: parts.join(' · ') })
  }

  if (source && source.type !== 'file') {
    checks.push({ tone: 'ok', text: 'Reachable from a browser: the host allows cross-origin requests.' })
    const size = source.size === null ? '' : ` ${formatSize(source.size)}`
    if (source.type === 'range-http') {
      checks.push({
        tone: 'ok',
        text: `Streams in place: the host honours Range requests, so a visitor fetches only the parts they use${size ? ` of its${size}` : ''}.`
      })
    } else {
      checks.push({
        tone: 'warn',
        text: `Downloaded whole: the host ignores Range requests, so every visitor downloads the${size ? ` whole${size}` : ' whole package'} before anything plays.`,
        link: { href: `${HOSTING}#range-requests-recommended`, text: 'What to ask the host for' }
      })
    }
  }

  const own = libraryBundle?.origin === playerOrigin
  const elsewhere = libraryBundle && !own ? `${libraryBundle.origin}, a library source on another site, which every visitor's browser contacts on its first play` : ''
  if (!libraryBundle) {
    checks.push({ tone: 'ok', text: 'Carries its libraries: nothing else had to be fetched.' })
  } else if (libraryBundle.refreshed.length) {
    // A package that carries its libraries, some of them older than the pack's (player 0.10).
    const { refreshed } = libraryBundle
    const list = libraryList(refreshed, ({ library, from, to }) => `${contentTypeName(library)} ${from} → ${to}`)
    const count = refreshed.length === 1 ? 'one of them' : `${refreshed.length} of them`
    checks.push({
      tone: own ? 'info' : 'warn',
      text: own
        ? `Carries its libraries, and plays ${count} at the newer version in the player's library pack: ${list}.`
        : `Carries its libraries, and plays ${count} at a newer version from ${elsewhere}: ${list}.`,
      link: LIBRARY_FILES
    })
  } else if (own) {
    checks.push({
      tone: 'info',
      text: libraryBundle.fromCache
        ? "Exported without its libraries: the player added the ones it needs from its library pack, from the copy this browser already had."
        : "Exported without its libraries: the player added the ones it needs from its library pack, downloaded once per browser and kept.",
      link: LIBRARY_FILES
    })
  } else {
    checks.push({ tone: 'warn', text: `Exported without its libraries: they came from ${elsewhere}.`, link: LIBRARY_FILES })
  }

  if (downgradedLibraries.length) {
    // Content made for a newer minor version than any source has, played at the newest older one (player 1.2).
    const list = libraryList(downgradedLibraries, ({ library, from, to }) => `${contentTypeName(library)} ${from}, played at ${to}`)
    checks.push({
      tone: 'warn',
      text: `Made for newer libraries than the player has: ${list}. Most newer versions only add fields, but a part can be missing or drawn wrong, so check every part.`,
      link: { href: `${HOSTING}#content-made-for-newer-libraries`, text: 'About newer libraries' }
    })
  }

  if (elapsedMs !== null) {
    checks.push({ tone: 'info', text: `Ready in ${(elapsedMs / 1000).toFixed(1)} s on this connection.` })
  }

  return checks
}

/** The line for a load that failed, by the player's error code. */
export function describeFailure(code: string, message: string): Check {
  const fetching = { href: `${TROUBLESHOOTING}#the-preview-says-the-package-cannot-be-fetched`, text: 'What to check' }
  switch (code) {
    case 'no-cors':
      return {
        tone: 'bad',
        text: 'Not reachable from a browser: the host sends no CORS header, or this is not a direct link to the file.',
        link: fetching
      }
    case 'network':
      return { tone: 'bad', text: `The file could not be fetched${message ? `: ${message}` : '.'}`, link: fetching }
    case 'bad-archive':
      return { tone: 'bad', text: 'Not an H5P package: the file is not an archive the player can read.', link: fetching }
    case 'no-worker':
      return {
        tone: 'bad',
        text: 'This browser gives the frame no Service Worker, which the player needs.',
        link: { href: `${TROUBLESHOOTING}#the-activity-does-not-load-in-an-apps-built-in-browser`, text: 'Which browsers do' }
      }
    case 'quota':
      return { tone: 'bad', text: "No room: this browser's storage is full, so the package could not be unpacked." }
    case 'refused':
      // The embed page turned the address down before loading anything, and says why.
      return { tone: 'bad', text: message || 'The player refused this address.', link: fetching }
    default:
      return { tone: 'bad', text: `The content did not start${message ? `: ${message}` : '.'}` }
  }
}
