// test-card-visibility.js
import { chromium } from 'playwright';

(async () => {
  // Launch browser in headless mode for CI/CLI
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Navigate to the app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Wait for the app to load (React hydration) - wait for a specific text that we know is in the app
  await page.waitForSelector('text=Bible Reading Planner', { timeout: 10000 });
  
  // Get the page title
  const title = await page.title();
  
  // Check for specific elements that should be present if cards are visible
  const hasRootDiv = await page.locator('#root').count() > 0;
  const hasTextContent = await page.locator('text=Bible Reading Planner').count() > 0;
  const hasBookSection = await page.locator('text=Books of the Bible').count() > 0;
  const hasChapterSection = await page.locator('text=Chapters').count() > 0; // We have a section that says "Chapters" when a book is selected
  const hasContentSection = await page.locator('text=Select a chapter to view').count() > 0; // This is in the content viewer when nothing is selected
  
  console.log('=== PLAYWRIGHT TEST RESULTS ===');
  console.log(`URL: http://localhost:5173`);
  console.log(`Page title: ${title}`);
  console.log(`Has #root div: ${hasRootDiv}`);
  console.log(`Has "Bible Reading Planner" text: ${hasTextContent}`);
  console.log(`Has "Books of the Bible" section: ${hasBookSection}`);
  console.log(`Has "Chapters" text: ${hasChapterSection}`);
  console.log(`Has "Select a chapter to view" text: ${hasContentSection}`);
  
  // Check for card-like elements (our sections with specific classes)
  const cardSections = await page.locator('.bg-white.dark\\:bg-gray-800.rounded-xl.shadow-lg.p-6').count();
  console.log(`\\nNumber of card sections found: ${cardSections}`);
  
  // Check for book items (the clickable book elements)
  const bookItems = await page.locator('.cursor-pointer.flex.items-start.p-4.border').count();
  console.log(`Number of book items found: ${bookItems}`);
  
  // If we have at least one card section and one book item, we can say the cards are rendered
  const cardsVisible = cardSections > 0 && bookItems > 0;
  console.log(`\\nAre cards visible? ${cardsVisible}`);
  
  // Get a sample of the rendered HTML for the first card section (if exists)
  if (cardSections > 0) {
    const firstCardHtml = await page.locator('.bg-white.dark\\:bg-gray-800.rounded-xl.shadow-lg.p-6').first().innerHTML();
    console.log(`\\n=== SAMPLE OF FIRST CARD SECTION HTML (first 500 chars) ===\\n${firstCardHtml.substring(0, 500)}`);
  }
  
  await browser.close();
  
  // Exit with success if cards are visible, otherwise failure
  process.exit(cardsVisible ? 0 : 1);
})();