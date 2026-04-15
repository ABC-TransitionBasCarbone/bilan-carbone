import { execSync } from 'node:child_process'

import dayjs from 'dayjs'
import { expect, type Locator, type Page, type APIRequestContext } from '@playwright/test'

export const login = async (page: Page, email: string, password: string) => {
  await page.goto('/login')
  await page.locator('[data-testid="input-email"] input').fill(email)
  await page.locator('[data-testid="input-password"] input').fill(password)
  await page.getByTestId('login-button').click()
  await expect(page).toHaveURL(/fromLogin/, { timeout: 30000 })
}

export const logout = async (page: Page) => {
  await page.goto('/logout')
}

export const sourceCard = (page: Page, name: string): Locator => page.getByTestId(`emission-source-${name}`).first()

export const inputByTestId = (scope: Page | Locator, testId: string): Locator =>
  scope.getByTestId(testId).locator('input,textarea')

export const openSubPost = async (page: Page, subPostTestId: string, { canCreate = true } = {}) => {
  const subPost = page.getByTestId(subPostTestId)
  const toggle = subPost.getByTestId('subpost')
  await toggle.scrollIntoViewIfNeeded()
  const isExpanded = await toggle.getAttribute('aria-expanded')
  if (isExpanded !== 'true') {
    await toggle.click()
  }
  if (canCreate) {
    await expect(subPost.getByTestId('new-emission-source')).toBeVisible()
  } else {
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  }
}

export const resetTestDatabase = () => {
  const env = { ...process.env }
  delete env['CLAUDECODE']
  execSync('yarn db:test:reset', { stdio: 'inherit', env })
}

/**
 * Creates a study and returns the study URL.
 * The page must already be logged in as a user that can create studies.
 */
export const createStudy = async (page: Page, studyName: string): Promise<string> => {
  await page.goto('/etudes/creer')

  const firstSite = page.getByTestId('organization-sites-checkbox').first()
  await firstSite.locator('input').click({ force: true })
  await page.getByTestId('new-study-organization-button').click()

  await page.getByTestId('new-study-name').locator('input').fill(studyName)
  // Validator autocomplete uses pre-loaded options — open it and pick the first option
  const validatorInput = page.getByTestId('new-validator-name').locator('input')
  await validatorInput.click()
  await validatorInput.press('ArrowDown')
  await expect(page.locator('[data-option-index="0"]')).toBeVisible({ timeout: 10000 })
  await page.locator('[data-option-index="0"]').click()

  // MUI x-date-pickers renders a segmented date input — click the field then type DD/MM/YYYY
  const endDateWrapper = page.getByTestId('new-study-endDate')
  await endDateWrapper.click()
  await page.keyboard.type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
  await page.getByTestId('new-study-level').click()
  await page.locator('[data-value="Initial"]').click()

  const createResponse = page.waitForResponse(
    (r) => r.url().includes('/etudes/creer') && r.request().method() === 'POST',
  )
  await page.getByTestId('new-study-create-button').click()
  await createResponse
  await expect(page).toHaveURL(/\/etudes\/[a-f0-9-]{36}/, { timeout: 15000 })

  // Return the base study URL (just /etudes/UUID) so callers can navigate to it
  const studyUrlMatch = page.url().match(/\/etudes\/[a-f0-9-]{36}/)
  return studyUrlMatch ? `${new URL(page.url()).origin}${studyUrlMatch[0]}` : page.url()
}

/**
 * Deletes the current study (must be on a study page).
 */
export const deleteCurrentStudy = async (page: Page, studyName: string) => {
  await page.getByTestId('delete-study').click()
  await expect(page.locator('#delete-study-modal-title')).toBeVisible()
  await page.getByTestId('delete-study-name-field').locator('input').fill(studyName)
  const deleteResponse = page.waitForResponse((r) => r.url().includes('/etudes/') && r.request().method() === 'POST')
  await page.getByTestId('confirm-study-deletion').click()
  await deleteResponse
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
}

/**
 * Polls maildev (http://localhost:1080/email) until a new email arrives after
 * `since` (epoch ms) addressed to `toEmail`, then returns the first href found
 * in the email body. Throws if no email arrives within the timeout.
 */
export const getLatestEmailLink = async (
  request: APIRequestContext,
  toEmail: string,
  since: number,
  { timeout = 15000 }: { timeout?: number } = {},
): Promise<string> => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const res = await request.get('http://localhost:1080/email')
    const emails: Array<{ id: string; to: Array<{ address: string }>; date: string; html: string }> = await res.json()
    const match = emails
      .filter((e) => {
        const receivedAt = new Date(e.date).getTime()
        return receivedAt > since && e.to.some((t) => t.address.toLowerCase() === toEmail.toLowerCase())
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    if (match) {
      const hrefMatch = match.html.match(/href="([^"]+)"/)
      if (hrefMatch) {
        return hrefMatch[1].replace(/&amp;/g, '&')
      }
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`No email found for ${toEmail} within ${timeout}ms`)
}

/**
 * Deletes all emails in maildev. Call before a test that needs to check for new mail.
 */
export const clearMaildev = async (request: APIRequestContext): Promise<void> => {
  await request.delete('http://localhost:1080/email/all')
}

/**
 * Deletes an emission factor by name from the emission factors list page.
 * The page must already be on /facteurs-d-emission.
 */
export const deleteEmissionFactor = async (page: Page, name: string) => {
  await page.getByTestId('emission-factor-search-input').locator('input').fill(name)
  await expect(page.getByTestId('cell-emission-name').first()).toHaveText(name, { timeout: 10000 })
  await page.getByTestId('delete-emission-factor-button').first().click()
  await expect(page.locator('#delete-emission-factor-modal-title')).toBeVisible()
  await page.getByTestId('delete-emission-factor-confirm').click()
  await expect(page.locator('#delete-emission-factor-modal-title')).toHaveCount(0, { timeout: 10000 })
}
