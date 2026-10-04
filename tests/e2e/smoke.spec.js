import { test, expect } from '@playwright/test'

const chapter = (reference) => ({
  reference,
  verses: [
    { verse: 1, text: 'In the beginning, God created the heavens and the earth.\n' },
    { verse: 2, text: 'The earth was formless and empty.\n' },
  ],
})

test.beforeEach(async ({ page }) => {
  await page.route('https://bible-api.com/**', (route) =>
    route.fulfill({ json: chapter(decodeURIComponent(new URL(route.request().url()).pathname.slice(1))) }),
  )
})

const nav = (page) => page.getByRole('navigation', { name: 'Main' })

test('loads with Tailwind styles applied', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 251, 235)')
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toHaveCSS('font-family', /Cormorant/)
  await expect(nav(page).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
})

test('no horizontal scroll and touch targets are at least 44px', async ({ page }) => {
  for (const path of ['/', '/#/bible', '/#/bible/Genesis', '/#/read/Genesis/1', '/#/plan', '/#/stories', '/#/stories/moses', '/#/stories/moses/1']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ el: el.getAttribute('aria-label') || el.textContent.trim(), ...el.getBoundingClientRect().toJSON() }))
        .filter(({ width, height }) => width < 44 || height < 44),
    )
    expect(small, path).toEqual([])
  }
})

test('read a chapter from the Bible tab and mark it read', async ({ page }) => {
  await page.goto('/')
  await nav(page).getByRole('link', { name: 'Bible' }).click()
  await page.getByRole('link', { name: /^Genesis/ }).click()
  await page.getByRole('link', { name: 'Chapter 1', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Genesis 1' })).toBeVisible()
  await expect(page.getByText('In the beginning')).toBeVisible()

  // The action bar is on screen without scrolling.
  const markRead = page.getByRole('button', { name: 'Mark as read' })
  await expect(markRead).toBeInViewport()
  await markRead.click()
  await expect(page.getByRole('button', { name: 'Read' })).toHaveAttribute('aria-pressed', 'true')

  // Next chapter, then back twice returns to the chapter grid showing chapter 1 as read.
  await page.getByRole('link', { name: 'Next chapter: Genesis 2' }).click()
  await expect(page.getByRole('heading', { name: 'Genesis 2' })).toBeVisible()
  await page.goBack()
  await page.goBack()
  await expect(page.getByRole('link', { name: 'Chapter 1, read' })).toBeVisible()

  // Today reflects it, and it survives a reload.
  await page.goto('/')
  await expect(page.getByText('Continue reading')).toBeVisible()
  await expect(page.getByRole('link', { name: /Genesis 2$/ })).toBeVisible()
  await page.reload()
  await expect(page.getByText('1 of 1,189 chapters')).toBeVisible()
})

test('Today continue button opens the next unread chapter', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Start reading/ }).click()
  await expect(page.getByRole('heading', { name: 'Genesis 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
})

test('shows an error with retry when the chapter fails to load', async ({ page }) => {
  let fail = true
  await page.route('https://bible-api.com/**', (route) =>
    fail ? route.fulfill({ status: 500 }) : route.fulfill({ json: chapter('Genesis 1') }),
  )
  await page.goto('/#/read/Genesis/1')
  await expect(page.getByText('Error Loading Chapter')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('In the beginning')).toBeVisible()
})

test('changing the target date updates the plan and persists', async ({ page }) => {
  await page.goto('/#/plan')
  const date = page.getByLabel('Target completion date')
  await date.fill('2027-09-30')
  await expect(page.getByText('Days left')).toBeVisible()
  await page.reload()
  await expect(date).toHaveValue('2027-09-30')
})

test('reading a story step marks its chapter in the main plan, and reset unmarks it', async ({ page }) => {
  await page.goto('/#/stories')
  await expect(page.getByRole('heading', { name: 'Stories', level: 1 })).toBeVisible()

  // Open the Moses story and its first step.
  await page.getByRole('link', { name: /Moses/ }).click()
  await expect(page.getByRole('heading', { name: 'Moses', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: /Start reading/ }).click()
  await expect(page.getByRole('heading', { name: 'A baby in the bulrushes' })).toBeVisible()
  await expect(page.getByText('Exodus 2:1-10 · King James Version')).toBeVisible()
  await expect(page.getByText('Step 1 of 28')).toBeVisible()

  // Moving to the next step marks step 1 read and advances.
  await page.getByRole('button', { name: 'Next passage' }).click()
  await expect(page.getByRole('heading', { name: 'Fleeing to Midian' })).toBeVisible()
  await expect(page.getByText('Step 2 of 28')).toBeVisible()

  // The anchor chapter now counts toward the main plan: Today shows 1 read today,
  // and the story overview shows the step as read.
  await page.goto('/#/stories/moses')
  await expect(page.getByText('1 of 28 passages')).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('1 of 1,189 chapters')).toBeVisible()
  await expect(page.getByText('1-day streak')).toBeVisible()

  // The chapter shows as read in the Bible tab too.
  await page.goto('/#/bible/Exodus')
  await expect(page.getByRole('link', { name: 'Chapter 2, read' })).toBeVisible()

  // Resetting the story removes its own marks: chapter 2 is unread again,
  // the plan counts drop back, and the step list starts over.
  await page.goto('/#/stories/moses')
  await page.getByRole('button', { name: 'Reset story' }).click()
  await page.getByRole('button', { name: 'Tap again to reset' }).click()
  await expect(page.getByText('0 of 28 passages')).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('0 of 1,189 chapters')).toBeVisible()

  // A chapter read by hand is untouched by a later story mark + reset.
  await page.goto('/#/read/Exodus/2')
  await page.getByRole('button', { name: 'Mark as read' }).click()
  await page.goto('/#/stories/moses')
  await page.getByRole('link', { name: /Start reading/ }).click()
  await page.getByRole('button', { name: 'Next passage' }).click()
  await page.goto('/#/stories/moses')
  await page.getByRole('button', { name: 'Reset story' }).click()
  await page.getByRole('button', { name: 'Tap again to reset' }).click()
  await expect(page.getByText('0 of 28 passages')).toBeVisible()
  await page.goto('/#/bible/Exodus')
  await expect(page.getByRole('link', { name: 'Chapter 2, read' })).toBeVisible()
})

test('reading every step completes the story', async ({ page }) => {
  await page.goto('/#/stories/moses/1')
  for (let step = 1; step < 28; step++) {
    await page.getByRole('button', { name: 'Next passage' }).click()
  }
  await expect(page.getByText('Step 28 of 28')).toBeVisible()
  await page.getByRole('button', { name: 'Finish story' }).click()
  await expect(page.getByText('28 of 28 passages')).toBeVisible()
  await expect(page.getByText('Story complete')).toBeVisible()

  // The whole Exodus arc the story marked is reflected in the plan.
  await page.goto('/')
  await expect(page.getByText('1-day streak')).toBeVisible()
})

test('shows an error with retry when a story passage fails to load', async ({ page }) => {
  let fail = true
  await page.route('https://bible-api.com/**', (route) =>
    fail ? route.fulfill({ status: 500 }) : route.fulfill({ json: chapter('Exodus 2:1-10') }),
  )
  await page.goto('/#/stories/moses/1')
  await expect(page.getByText('Error Loading Passage')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('In the beginning')).toBeVisible()
})

test('story step screens deep-link and restore, and bad routes fall back', async ({ page }) => {
  await page.goto('/#/stories/moses/28')
  await expect(page.getByRole('heading', { name: 'The song of Moses and the Lamb' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'The song of Moses and the Lamb' })).toBeVisible()

  // An out-of-range step lands on the story overview; an unknown story lands on the list.
  await page.goto('/#/stories/moses/99')
  await expect(page.getByRole('heading', { name: 'Moses', level: 1 })).toBeVisible()
  await page.goto('/#/stories/nobody')
  await expect(page.getByRole('heading', { name: 'Stories', level: 1 })).toBeVisible()
})
