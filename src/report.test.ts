import { describe, expect, it } from 'vitest'
import { contentTypeName, describeFailure, describePackage, formatSize, licenceName, readPlayerMessage, type PackageReport } from './report'

const PLAYER = 'https://embed-my.github.io'

const quiz: PackageReport = {
  source: { type: 'range-http', size: 4_324_039 },
  metadata: { title: 'Do you know what just happened?', license: 'CC0 1.0', authors: ['missing-elements'], mainLibrary: 'H5P.QuestionSet' },
  libraryBundle: null,
  elapsedMs: 2140
}

describe('readPlayerMessage', () => {
  it('reads a report, holding each field to its shape', () => {
    expect(
      readPlayerMessage({
        context: 'h5p-offline-player',
        action: 'report',
        source: { type: 'chunked', size: null },
        metadata: { title: ' Quiz ', license: 'CC BY', licenseVersion: '4.0', authors: ['Ada', 7, ''], mainLibrary: 'H5P.QuestionSet', extra: 1 },
        libraryBundle: { url: `${PLAYER}/assets/libraries-abc.h5p`, origin: PLAYER, fromCache: 'yes' },
        elapsedMs: 1234.5
      })
    ).toEqual({
      action: 'report',
      report: {
        source: { type: 'chunked', size: null },
        metadata: { title: 'Quiz', license: 'CC BY', licenseVersion: '4.0', authors: ['Ada'], mainLibrary: 'H5P.QuestionSet' },
        libraryBundle: { url: `${PLAYER}/assets/libraries-abc.h5p`, origin: PLAYER, fromCache: false },
        elapsedMs: 1234.5
      }
    })
  })

  it('reads a report that knows nothing', () => {
    expect(readPlayerMessage({ context: 'h5p-offline-player', action: 'report', source: { type: 'ftp' } })).toEqual({
      action: 'report',
      report: { source: null, metadata: null, libraryBundle: null, elapsedMs: null }
    })
  })

  it('reads an error', () => {
    expect(readPlayerMessage({ context: 'h5p-offline-player', action: 'error', code: 'no-cors', message: 'Blocked' })).toEqual({
      action: 'error',
      code: 'no-cors',
      message: 'Blocked'
    })
  })

  it('ignores the resizer messages, the xAPI relay and anything else', () => {
    expect(readPlayerMessage({ context: 'h5p', action: 'resize', scrollHeight: 400 })).toBeNull()
    expect(readPlayerMessage({ context: 'h5p-offline-player', action: 'xapi', statement: {} })).toBeNull()
    expect(readPlayerMessage({ context: 'h5p-offline-player', action: 'error' })).toBeNull()
    expect(readPlayerMessage('report')).toBeNull()
    expect(readPlayerMessage(null)).toBeNull()
  })
})

describe('describePackage', () => {
  it('describes a complete package on a host that streams', () => {
    const lines = describePackage(quiz, { playerOrigin: PLAYER })
    expect(lines.map((line) => line.tone)).toEqual(['info', 'ok', 'ok', 'ok', 'info'])
    expect(lines[0].text).toBe('Do you know what just happened? · Question Set · CC0 1.0 · by missing-elements')
    expect(lines[2].text).toContain('Streams in place')
    expect(lines[2].text).toContain('4.3 MB')
    expect(lines[3].text).toContain('Carries its libraries')
    expect(lines[4].text).toBe('Ready in 2.1 s on this connection.')
  })

  it('warns about a host that makes every visitor download the whole file', () => {
    const lines = describePackage({ ...quiz, source: { type: 'chunked', size: 48_000_000 } }, { playerOrigin: PLAYER })
    const transfer = lines.find((line) => line.text.startsWith('Downloaded whole'))
    expect(transfer?.tone).toBe('warn')
    expect(transfer?.text).toContain('whole 48 MB')
    expect(transfer?.link?.href).toBe('/docs/hosting-packages#range-requests-recommended')
  })

  it('says where the libraries came from, and whether that left the player origin', () => {
    const bundle = { url: `${PLAYER}/assets/libraries-abc.h5p`, origin: PLAYER, fromCache: false }
    const own = describePackage({ ...quiz, libraryBundle: bundle }, { playerOrigin: PLAYER })
    expect(own.find((line) => line.text.startsWith('Exported without'))).toMatchObject({ tone: 'info' })
    expect(own.find((line) => line.text.startsWith('Exported without'))?.text).toContain('about 10 MB')

    const cached = describePackage({ ...quiz, libraryBundle: { ...bundle, fromCache: true } }, { playerOrigin: PLAYER })
    expect(cached.find((line) => line.text.startsWith('Exported without'))?.text).toContain('already had')

    // Only an address that names its own `libraries=` source gets here: the player has no other.
    const elsewhere = describePackage(
      { ...quiz, libraryBundle: { url: 'https://cdn.example.org/libraries.h5p', origin: 'https://cdn.example.org', fromCache: false } },
      { playerOrigin: PLAYER }
    )
    const line = elsewhere.find((item) => item.text.startsWith('Exported without'))
    expect(line?.tone).toBe('warn')
    expect(line?.text).toContain('https://cdn.example.org')
  })

  it('leaves out what it was not told', () => {
    const lines = describePackage({ source: null, metadata: null, libraryBundle: null, elapsedMs: null }, { playerOrigin: PLAYER })
    expect(lines).toEqual([{ tone: 'ok', text: 'Carries its libraries: nothing else had to be fetched.' }])
  })

  it('says nothing about the host for a file picked from disk', () => {
    const lines = describePackage({ ...quiz, source: { type: 'file', size: 10 } }, { playerOrigin: PLAYER })
    expect(lines.some((line) => line.text.includes('Reachable'))).toBe(false)
  })
})

describe('describeFailure', () => {
  it('names the usual failure and points at the guide', () => {
    expect(describeFailure('no-cors', 'whatever')).toMatchObject({
      tone: 'bad',
      text: expect.stringContaining('no CORS header'),
      link: { href: '/docs/troubleshooting#the-preview-says-the-package-cannot-be-fetched' }
    })
  })

  it('passes the player’s own words on for the rest', () => {
    expect(describeFailure('runtime', 'H5P.Foo is not a function').text).toBe('The content did not start: H5P.Foo is not a function')
    expect(describeFailure('network', '').text).toBe('The file could not be fetched.')
    expect(describeFailure('refused', 'The package address is not a URL.').text).toBe('The package address is not a URL.')
  })
})

describe('the words', () => {
  it('names content types and licences as a person would', () => {
    expect(contentTypeName('H5P.InteractiveVideo')).toBe('Interactive Video')
    expect(contentTypeName('H5P.CoursePresentation')).toBe('Course Presentation')
    expect(contentTypeName('H5P.Dialogcards')).toBe('Dialogcards')
    expect(licenceName('CC BY', '4.0')).toBe('CC BY 4.0')
    expect(licenceName('CC0 1.0', '1.0')).toBe('CC0 1.0')
    expect(licenceName('U')).toBe('licence not stated')
  })

  it('formats sizes as a visitor reads them', () => {
    expect(formatSize(512)).toBe('512 bytes')
    expect(formatSize(81_920)).toBe('82 kB')
    expect(formatSize(4_324_039)).toBe('4.3 MB')
    expect(formatSize(312_000_000)).toBe('312 MB')
  })
})
