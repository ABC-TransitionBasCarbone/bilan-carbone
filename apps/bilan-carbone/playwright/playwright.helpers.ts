import { execSync } from 'node:child_process'

import { expect, type Locator, type Page } from '@playwright/test'

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
