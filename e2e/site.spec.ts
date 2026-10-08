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
