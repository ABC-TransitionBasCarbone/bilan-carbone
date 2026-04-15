import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

test.describe('Edit organization', () => {
  test('should edit an organization name and sites, then revert', async ({ page }) => {
    test.setTimeout(120000)

    await login(page, 'bc-admin-0@yopmail.com', 'password-0')

    // Navigate to the edit form
    await page.goto('/organisations')
    await page.getByTestId('edit-organization-button').click({ force: true })
    await expect(page).toHaveURL(/\/organisations\/[a-f0-9-]{36}\/modifier/, { timeout: 15000 })

    // Capture the current name to revert later
    const nameInput = page.getByTestId('edit-organization-name').locator('input')
    const originalName = await nameInput.inputValue()

    // Count original sites
    const originalSiteCount = await page.getByTestId('edit-site-name').count()

    // Rename the organization
    await nameInput.fill('My new name')

    // Add a site
    await page.getByTestId('add-site-button').click()
    await page.getByTestId('edit-site-name').last().locator('input').fill('My new site 0')
    await page.getByTestId('organization-sites-etp').last().locator('input').fill('10')
    await page.getByTestId('organization-sites-ca').last().locator('input').fill('1000')

    const updateResponse1 = page.waitForResponse(
      (r) => r.url().includes('/organisations/') && r.url().includes('/modifier') && r.request().method() === 'POST',
    )
    await page.getByTestId('edit-organization-button').click()
    await updateResponse1

    await expect(page.getByTestId('organization-name')).toContainText('My new name', { timeout: 10000 })

    // Add a second site
    await page.getByTestId('edit-organization-button').click({ force: true })
    await expect(page).toHaveURL(/\/organisations\/[a-f0-9-]{36}\/modifier/, { timeout: 10000 })
    await page.getByTestId('add-site-button').click()
    await page.getByTestId('edit-site-name').last().locator('input').fill('My new site 1')
    await page.getByTestId('organization-sites-etp').last().locator('input').fill('20')
    await page.getByTestId('organization-sites-ca').last().locator('input').fill('2000')

    const updateResponse2 = page.waitForResponse(
      (r) => r.url().includes('/organisations/') && r.url().includes('/modifier') && r.request().method() === 'POST',
    )
    await page.getByTestId('edit-organization-button').click()
    await updateResponse2

    await expect(page.getByTestId('organization-name')).toBeVisible({ timeout: 10000 })

    // Verify second site was saved
    await page.getByTestId('edit-organization-button').click({ force: true })
    await expect(page).toHaveURL(/\/organisations\/[a-f0-9-]{36}\/modifier/, { timeout: 10000 })
    const siteNames = page.getByTestId('edit-site-name')
    const siteCount = await siteNames.count()
    await expect(siteNames.nth(siteCount - 1).locator('input')).toHaveValue('My new site 1')
    await expect(page.getByTestId('organization-sites-etp').nth(siteCount - 1).locator('input')).toHaveValue('20')
    await expect(page.getByTestId('organization-sites-ca').nth(siteCount - 1).locator('input')).toHaveValue('2000')

    // Revert: delete added sites (from last to first), then restore name
    // Delete "My new site 1"
    await page.getByTestId('delete-site-button').last().click()
    // Delete "My new site 0"
    await page.getByTestId('delete-site-button').nth(originalSiteCount).click()

    // Restore original name
    await page.getByTestId('edit-organization-name').locator('input').fill(originalName)

    const revertResponse = page.waitForResponse(
      (r) => r.url().includes('/organisations/') && r.url().includes('/modifier') && r.request().method() === 'POST',
    )
    await page.getByTestId('edit-organization-button').click()
    await revertResponse

    await expect(page.getByTestId('organization-name')).toContainText(originalName, { timeout: 10000 })
  })
})
