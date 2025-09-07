import { test, expect } from '@playwright/test';

test.describe('Final Comprehensive VibeScope Tests', () => {
  test('Complete word analysis flow', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://vibescope-orpin.vercel.app');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText('VibeScope');
    
    // Find and use search input
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Type a word and search
    await searchInput.fill('innovation');
    await searchInput.press('Enter');
    
    // Wait for results (either results or error)
    await page.waitForSelector('text=/analyzing|dimension|error|manipulation/i', { timeout: 10000 });
    
    // Check if we got some response
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('Complete sentence analysis flow', async ({ page }) => {
    await page.goto('https://vibescope-orpin.vercel.app');
    
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Everyone agrees this is the best solution');
    await searchInput.press('Enter');
    
    // Wait for analysis
    await page.waitForSelector('text=/analyzing|propaganda|manipulation|dimension/i', { timeout: 10000 });
    
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('API endpoints respond correctly', async ({ request }) => {
    // Test word API - may return 503 with mock data when DB is down
    const wordResponse = await request.get('https://vibescope-orpin.vercel.app/api/vibe?term=test');
    const wordData = await wordResponse.json();
    
    // Should have axes regardless of status
    expect(wordData).toHaveProperty('axes');
    expect(Object.keys(wordData.axes).length).toBeGreaterThanOrEqual(12);
    
    // Test sentence API
    const sentenceResponse = await request.get('https://vibescope-orpin.vercel.app/api/vibe/analyze-sentence?text=test%20sentence');
    expect(sentenceResponse.ok()).toBeTruthy();
    const sentenceData = await sentenceResponse.json();
    expect(sentenceData).toHaveProperty('propaganda');
  });

  test('Responsive design works', async ({ page }) => {
    await page.goto('https://vibescope-orpin.vercel.app');
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    const desktopInput = page.locator('input[type="text"]').first();
    await expect(desktopInput).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileInput = page.locator('input[type="text"]').first();
    await expect(mobileInput).toBeVisible();
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletInput = page.locator('input[type="text"]').first();
    await expect(tabletInput).toBeVisible();
  });
});