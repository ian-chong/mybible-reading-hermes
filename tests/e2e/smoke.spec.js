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
  for (const path of ['/', '/#/bible', '/#/bible/Genesis', '/#/read/Genesis/1', '/#/plan', '/#/explore', '/#/timeline', '/#/stories', '/#/stories/moses', '/#/stories/moses/1']) {
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
  await expect(page.getByRole('img', { name: 'Chapters read: 1 of 50' })).toBeVisible()

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
  await expect(page.getByRole('img', { name: 'Chapters read: 2 of 40' })).toBeVisible()

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
  await expect(page.getByRole('img', { name: 'Chapters read: 2 of 40' })).toBeVisible()
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

// Seeds read chapters directly, as if they had been read on earlier days.
const seedProgress = (page, completed) =>
  page.addInitScript((value) => {
    if (!localStorage.getItem('bibleReadingProgress')) localStorage.setItem('bibleReadingProgress', JSON.stringify(value))
  }, completed)

test('Bible tab shows each book as a percentage and maps where in a book you have read', async ({ page }) => {
  await seedProgress(page, { Ruth: [3, 4], Genesis: [1] })
  await page.goto('/#/bible')

  await expect(page.getByRole('heading', { name: 'Whole Bible' })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Ruth\s*2\/4\s*50%/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Genesis\s*1\/50\s*2%/ })).toBeVisible()

  // Reading the last two of Ruth's four chapters lights the right half of the map.
  await page.getByRole('link', { name: /^Ruth/ }).click()
  await expect(page.getByRole('img', { name: 'Chapters read: 3–4 of 4' })).toBeVisible()
  await expect(page.getByText('Read: chapters 3–4')).toBeVisible()
  const run = page.getByTestId('chapter-map-run')
  await expect(run).toHaveCount(1)
  await expect(run).toHaveAttribute('style', /left: 50%; width: 50%/)

  // Only the unread chapters are listed as cards; the read ones sit behind a disclosure.
  const unread = page.locator('section:has(#unread-heading)')
  await expect(page.getByText('Not yet read · 2')).toBeVisible()
  await expect(unread.getByRole('link')).toHaveText([/1/, /2/])
  await expect(page.getByRole('link', { name: 'Chapter 3, read' })).toBeHidden()
  await page.getByText('Read chapters · 2').click()
  await expect(page.getByRole('link', { name: 'Chapter 3, read' })).toBeVisible()

  // A card opens that chapter in the reader.
  await page.getByRole('link', { name: 'Chapter 2', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ruth 2' })).toBeVisible()
})

test('a finished book says so instead of listing chapters', async ({ page }) => {
  await seedProgress(page, { Jude: [1] })
  await page.goto('/#/bible/Jude')
  await expect(page.getByText('Jude complete')).toBeVisible()
  await expect(page.getByText(/Not yet read/)).toHaveCount(0)
})

test('Timeline lists all 66 books in written order and opens a book', async ({ page }) => {
  await seedProgress(page, { Ruth: [1, 2] })
  await page.goto('/')
  await nav(page).getByRole('link', { name: 'Explore' }).click()
  await page.getByRole('link', { name: /^Timeline/ }).click()
  await expect(page.getByRole('heading', { name: 'Timeline', level: 1 })).toBeVisible()
  await expect(nav(page).getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page')

  const books = page.locator('main ol li a')
  await expect(books).toHaveCount(66)
  const names = await books.locator('span.font-serif').allTextContents()
  expect(new Set(names).size).toBe(66)
  expect(names[0]).toBe('Job')
  expect(names.at(-1)).toBe('Revelation')
  expect(names.indexOf('Malachi')).toBeLessThan(names.indexOf('James'))
  expect(names.indexOf('Galatians')).toBeLessThan(names.indexOf('Matthew'))

  // Each book carries its date and progress; tapping opens it in the Bible tab, and the browser Back button returns.
  const ruth = page.getByRole('link', { name: /^Ruth/ })
  await expect(ruth).toContainText('c. 1010–970 BC')
  await expect(ruth).toContainText('50%')
  await ruth.click()
  await expect(page.getByRole('heading', { name: 'Ruth', level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Timeline', level: 1 })).toBeVisible()
})

test('Explore offers Stories and Timeline as ways to read, with progress on each', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bibleReadingStories', JSON.stringify({ moses: { steps: [1], newlyMarked: [] } }))
    localStorage.setItem('bibleReadingProgress', JSON.stringify({ Exodus: [2], Ruth: [1] }))
  })
  await page.goto('/')
  await nav(page).getByRole('link', { name: 'Explore' }).click()
  await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Stories/ })).toContainText('1 of 33 started')
  await expect(page.getByRole('link', { name: /^Timeline/ })).toContainText('2 of 66 books started')

  // Stories sits inside Explore: the tab stays lit, and Back returns to the menu.
  await page.getByRole('link', { name: /^Stories/ }).click()
  await expect(page.getByRole('heading', { name: 'Stories', level: 1 })).toBeVisible()
  await expect(nav(page).getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page')
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible()
})
