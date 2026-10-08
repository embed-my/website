import { byId } from './ui/dom'
import { initThemeToggle } from './ui/theme-toggle'

/** A guide page, `/docs/<name>`: the generated prose needs only the theme switch. */
initThemeToggle(byId('theme-toggle', HTMLButtonElement))
