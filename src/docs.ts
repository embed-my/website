import { byId } from './ui/dom'
import { initThemeToggle } from './ui/theme-toggle'

/*
 * A guide page, `/docs/<name>`: the theme switch, and the sidebar following the reader.
 *
 * Which chapter is being read is the browser's call where it can be: the sidebar is a
 * `scroll-target-group`, so the link whose heading was last scrolled to is `:target-current`
 * and the stylesheet marks it, with no script in the loop. What a script still does there is
 * mirror that state as `aria-current`, which `:target-current` does not expose to assistive
 * technology, once scrolling has settled.
 *
 * A browser without `scroll-target-group` (Firefox and Safari, as of 2026) gets the same rule
 * worked out by hand: the chapter whose heading was last scrolled past the top of the window,
 * marked with the class the stylesheet accepts in place of the pseudo-class.
 */
initThemeToggle(byId('theme-toggle', HTMLButtonElement))

const nav = document.querySelector<HTMLElement>('.doc-nav')
const links = [...document.querySelectorAll<HTMLAnchorElement>('.doc-nav [data-chapter]')]

if (nav && links.length) {
  const native = CSS.supports('scroll-target-group: auto')
  const CURRENT = ':target-current'

  /** Marks `current` for assistive technology, and, without native support, for the stylesheet too. */
  const mark = (current: HTMLAnchorElement | null) => {
    for (const link of links) {
      const is = link === current
      if (is) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
      if (!native) link.classList.toggle(CURRENT, is)
    }
  }

  if (native) {
    // Read after the next frame has rendered: the browser settles `:target-current` in a frame's
    // layout, after its scroll events and animation callbacks, so a read in either of those still
    // sees the frame before. The callback of the frame after that runs once it has settled.
    const sync = () => mark(nav.querySelector<HTMLAnchorElement>(`[data-chapter]${CURRENT}`))
    let queued = false
    const schedule = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          queued = false
          sync()
        })
      )
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('scrollend', schedule)
    addEventListener('resize', schedule)
    schedule()
  } else {
    const headings = links
      .map((link) => document.getElementById(link.dataset.chapter ?? ''))
      .filter((heading): heading is HTMLElement => heading !== null)
    const byId = new Map(links.map((link) => [link.dataset.chapter, link]))
    /** The heading's own scroll margin, so the rule matches where a click on its link lands. */
    const margin = (heading: HTMLElement) => Number.parseFloat(getComputedStyle(heading).scrollMarginTop) || 0

    const update = () => {
      // As the specification has it: the last heading at or above the top edge, the first one
      // before any is reached, and the last one once the page can scroll no further.
      let current = headings[0] ?? null
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - margin(heading) <= 1) current = heading
        else break
      }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 1) current = headings.at(-1) ?? current
      mark(current ? (byId.get(current.id) ?? null) : null)
    }
    let queued = false
    const schedule = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        update()
      })
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    update()
  }
}
