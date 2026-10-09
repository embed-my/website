import { expect, test, type Page } from '@playwright/test'

/*
 * The site as a visitor meets it, in a real browser against the built files: the home page
 * previews a package and writes its snippet, and the guides link up. The preview frames the
 * player on its own origin, the one the build was given (`VITE_PLAYER_URL`, else
 * embed-my.github.io), and the sample it plays lives there too. Any Content-Security-Policy
 * violation fails the test, because the policy is written at build and only a browser checks it.
 */

const PLAYER_ORIGIN = new URL(process.env.VITE_PLAYER_URL || 'https://embed-my.github.io/h5p').origin
const SAMPLE = `${PLAYER_ORIGIN}/samples/quiz.h5p`

/** Fails the test on any CSP report or uncaught error the page logs. */
function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (message.type() === 'error' || /Content.Security.Policy/i.test(text)) problems.push(text)
  })
  page.on('pageerror', (error) => problems.push(error.message))
  return problems
}

test('the home page previews a package and writes its snippet', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/')

  await page.getByLabel(/Link to the/).fill(SAMPLE)
  await page.getByRole('button', { name: 'Preview' }).click()

  // The preview frame says hello, then reports a height, which becomes the snippet's minimum height.
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 40_000 })
  await expect(page.locator('#measured')).toContainText('Measured height')

  const code = page.locator('#code')
  await expect(code).toContainText(`https://embed-my.github.io/h5p?src=${SAMPLE}`)
  await expect(code).toContainText('title="Quiz"')
  await expect(code).toContainText('https://embed-my.github.io/h5p-resizer.js')

  expect(problems, problems.join('\n')).toEqual([])
})

test('a sample chip fills the link in from the player origin', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Glossary cards' }).click()
  await expect(page.getByLabel(/Link to the/)).toHaveValue(`${PLAYER_ORIGIN}/samples/glossary.h5p`)
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 40_000 })
})

test('the guides are served, linked to one another and under the policy', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/docs/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guides')
  await page.getByRole('link', { name: 'Preparing and hosting packages' }).first().click()
  await expect(page).toHaveURL(/\/docs\/hosting-packages$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparing and hosting packages')
  // A link between guides, rewritten from `privacy-and-security.md`.
  await page.getByRole('link', { name: 'Privacy and security' }).first().click()
  await expect(page).toHaveURL(/\/docs\/privacy-and-security$/)
  expect(problems, problems.join('\n')).toEqual([])
})

test('the guide sidebar sticks, lists the chapters and marks the one being read', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/hosting-packages')
  const nav = page.locator('.doc-nav')
  const chapters = nav.locator('.doc-nav-chapters')
  await expect(chapters.getByRole('link', { name: 'Free places to put the file' })).toBeVisible()
  await expect(chapters.getByRole('link', { name: 'Dropbox' })).toBeVisible()

  // Read down to a sub-chapter: it is marked, visibly and for assistive technology, and the sidebar is still on screen.
  await page.evaluate(() => document.getElementById('dropbox')?.scrollIntoView({ block: 'start' }))
  await expect(nav.locator('[aria-current="location"]')).toHaveText('Dropbox')
  await expect(chapters.getByRole('link', { name: 'Dropbox' })).toHaveCSS('font-weight', '700')
  await expect(chapters.getByRole('link', { name: 'Free places to put the file' })).not.toHaveCSS('font-weight', '700')
  const top = await nav.evaluate((element) => element.getBoundingClientRect().top)
  expect(top).toBeGreaterThanOrEqual(0)
  expect(top).toBeLessThan(40)

  // A chapter link jumps to its heading and the mark follows.
  await chapters.getByRole('link', { name: 'Server headers' }).click()
  await expect(page).toHaveURL(/#server-headers$/)
  await expect(nav.locator('[aria-current="location"]')).toHaveText('Server headers')

  // At the very end, the last chapter is the one being read.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await expect(nav.locator('[aria-current="location"]')).toHaveText('Third-party content')
})

test('the player page is served, linked from the top bar and under the policy', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Player' }).click()
  await expect(page).toHaveURL(/\/player$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The player')
  await expect(page.getByRole('link', { name: 'github.com/missing-elements/h5p-offline-player', exact: true })).toBeVisible()
  expect(problems, problems.join('\n')).toEqual([])
})
