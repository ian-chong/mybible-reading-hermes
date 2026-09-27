import { test, expect } from '@playwright/test'

const genesis1 = {
  reference: 'Genesis 1',
  verses: [
    { verse: 1, text: 'In the beginning, God created the heavens and the earth.\n' },
    { verse: 2, text: 'The earth was formless and empty.\n' },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('https://bible-api.com/**', (route) => route.fulfill({ json: genesis1 }))
})

test('loads with Tailwind styles applied', async ({ page }) => {
  await page.goto('/')
  const heading = page.getByRole('heading', { name: 'Bible Reading Planner' })
  await expect(heading).toBeVisible()

  // Theme colours and fonts from tailwind.config.js
  await expect(page.locator('#root > div')).toHaveCSS('background-color', 'rgb(255, 251, 235)')
  await expect(heading).toHaveCSS('font-family', /Cinzel/)
  await expect(page.locator('.grid-cols-12')).toHaveCSS('display', 'grid')
})

test('reads a chapter and marks it complete', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Genesis', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Genesis Chapter 1' })).toBeVisible()
  await expect(page.getByText('In the beginning')).toBeVisible()

  await page.getByRole('button', { name: 'Mark as Complete' }).click()
  await expect(page.getByRole('button', { name: 'Mark as Incomplete' })).toBeVisible()
  await expect(page.getByText('1/1189 chapters completed')).toBeVisible()

  // Progress survives a reload (localStorage)
  await page.reload()
  await expect(page.getByText('1/1189 chapters completed')).toBeVisible()
})

test('shows an error when the chapter fails to load', async ({ page }) => {
  await page.route('https://bible-api.com/**', (route) => route.fulfill({ status: 500 }))
  await page.goto('/')
  await page.getByText('Genesis', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await expect(page.getByText('Error Loading Chapter')).toBeVisible()
})
