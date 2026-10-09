import { describeFailure, describePackage, readPlayerMessage, type Check } from '../report'
import { HELLO, readResizerMessage } from '../resizer'

/**
 * Step 3, second half: the preview. The frame loads the player's embed page and is sized by the same resizer
 * protocol `/h5p-resizer.js` handles on a visitor's page. The stage's `data-state` drives
 * src/styles/preview.css. Under the frame, the lines the embed page's report turns into: what
 * the package is, whether the host streams it, where its libraries came from, how long it took.
 */

export interface PreviewParts {
  stage: HTMLElement
  frame: HTMLIFrameElement
  status: HTMLElement
  measured: HTMLElement
  /** The block holding the lines, hidden until there is one, and the list in it. */
  report: HTMLElement
  checks: HTMLElement
}

export interface PreviewSettings {
  /** The origin the frame's messages have to come from. */
  playerOrigin: string
  /** How long the frame may stay silent before the stage offers to open it on its own. */
  stallAfterMs: number
  /** Called with each height the activity reports; says whether the snippet took it as its minimum height. */
  onHeight: (height: number) => boolean
}

export interface Preview {
  /** Loads an embed page's address into the frame, starting over. */
  load(url: string): void
}

type StageState = 'empty' | 'loading' | 'ready' | 'stalled' | 'failed'

export function createPreview({ stage, frame, status, measured, report, checks }: PreviewParts, settings: PreviewSettings): Preview {
  let stallTimer = 0
  let alive = false
  /**
   * Whether the content is up, which the embed page's report says. Until then a height is the
   * loader's or a notice's, not the activity's, so the frame follows it but the snippet does not.
   */
  let contentUp = false
  let lastHeight = 0

  const setState = (state: StageState) => {
    stage.dataset.state = state
  }

  const say = (text: string, { busy = false } = {}) => {
    status.replaceChildren()
    if (busy) {
      const spinner = document.createElement('span')
      spinner.className = 'spinner'
      spinner.setAttribute('aria-hidden', 'true')
      status.append(spinner)
    }
    if (text) status.append(text)
  }

  // Neither a hello nor a height: the browser gave the frame no Service Worker, or the player
  // could not be reached. The link opens the same page on its own, where the player can say why.
  const stalled = () => {
    if (alive) return
    setState('stalled')
    say('The preview did not start here. It needs a current browser and an https page. ')
    const link = document.createElement('a')
    link.href = frame.src
    link.target = '_blank'
    link.rel = 'noopener'
    link.textContent = 'Open it on its own ↗'
    status.append(link)
  }

  // The measured height goes to the options, which take it as the minimum height unless the
  // visitor typed one; the line under the frame says which happened.
  const showHeight = (height: number) => {
    const taken = settings.onHeight(height)
    measured.textContent = taken
      ? `Measured height: ${height} px, set as the snippet's minimum height.`
      : `Measured height: ${height} px. The snippet keeps the minimum height you typed.`
    measured.hidden = false
  }

  /** The lines under the frame; the strings are the package's own and go in as text. */
  const showChecks = (lines: Check[]) => {
    checks.replaceChildren(
      ...lines.map((line) => {
        const item = document.createElement('li')
        item.dataset.tone = line.tone
        item.append(line.text)
        if (line.link) {
          const anchor = document.createElement('a')
          anchor.href = line.link.href
          anchor.textContent = line.link.text
          item.append(' ', anchor)
        }
        return item
      })
    )
    report.hidden = lines.length === 0
  }

  // The embed page's report once the content is up, or its error when the load failed before
  // that. An error ends the wait: the page's own notice in the frame says what happened, and
  // the line under it says what to do.
  const onPlayerMessage = (data: unknown) => {
    const message = readPlayerMessage(data)
    if (!message) return
    if (message.action === 'report') {
      contentUp = true
      showChecks(describePackage(message.report, { playerOrigin: settings.playerOrigin }))
      if (lastHeight) showHeight(lastHeight)
      return
    }
    clearTimeout(stallTimer)
    alive = true
    setState('failed')
    measured.hidden = true
    // In the live status line, so a screen reader hears it; the line under the frame says what to do.
    say('The preview could not play this link. See below for what to check.')
    showChecks([describeFailure(message.code, message.message)])
  }

  addEventListener('message', ({ source, origin, data }) => {
    if (source !== frame.contentWindow || origin !== settings.playerOrigin) return
    const message = readResizerMessage(data)
    if (!message) {
      onPlayerMessage(data)
      return
    }
    if (!alive) {
      alive = true
      clearTimeout(stallTimer)
    }
    if (message.action === 'hello') {
      frame.contentWindow?.postMessage(HELLO, origin)
      if (stage.dataset.state === 'loading') say('Starting the player…', { busy: true })
      return
    }
    frame.style.height = `${message.height}px`
    lastHeight = message.height
    // After a failure the frame still shows the player's notice, sized to fit: the stage stays failed.
    if (stage.dataset.state === 'failed') return
    if (stage.dataset.state !== 'ready') {
      setState('ready')
      say('')
    }
    if (contentUp) showHeight(message.height)
  })

  return {
    load(url) {
      clearTimeout(stallTimer)
      alive = false
      contentUp = false
      lastHeight = 0
      measured.hidden = true
      showChecks([])
      frame.style.height = ''
      setState('loading')
      say('Loading the preview…', { busy: true })
      frame.src = url
      stallTimer = window.setTimeout(stalled, settings.stallAfterMs)
    }
  }
}
