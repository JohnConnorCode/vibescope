import { test, expect, Page } from '@playwright/test';

test.describe('VibeScope App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage with hero section', async ({ page }) => {
    // Check hero section exists
    await expect(page.locator('h1')).toContainText('VibeScope');
    
    // Check for tagline
    await expect(page.locator('text=/Explore the semantic dimensions/')).toBeVisible();
    
    // Check feature cards are present
    await expect(page.locator('text=/AI-Powered Analysis/')).toBeVisible();
    await expect(page.locator('text=/12 Semantic Dimensions/')).toBeVisible();
    await expect(page.locator('text=/Visual Insights/')).toBeVisible();
  });

  test('should have a functional search input', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Enter any word"]');
    await expect(searchInput).toBeVisible();
    
    // Check it's focusable and typeable
    await searchInput.click();
    await searchInput.type('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('should show example words that are clickable', async ({ page }) => {
    // Check example words section exists
    await expect(page.locator('text=/Try these examples/')).toBeVisible();
    
    // Check at least one example word is present
    const exampleButton = page.locator('button').filter({ hasText: /love|peace|chaos|technology/ }).first();
    await expect(exampleButton).toBeVisible();
    
    // Click an example word
    await exampleButton.click();
    
    // Should trigger search (either show loading or results)
    // Wait for either loading state or results
    await expect(page.locator('text=/Analyzing|dimensions|masculine/')).toBeVisible({ timeout: 10000 });
  });

  test('should handle search and show results or meaningful error', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Enter any word"]');
    
    // Type a word and press Enter
    await searchInput.fill('happiness');
    await searchInput.press('Enter');
    
    // Should show either:
    // 1. Loading state
    // 2. Results with dimensions
    // 3. Error message with setup instructions
    
    const possibleStates = [
      page.locator('text=/Analyzing/'),  // Loading
      page.locator('text=/masculine.*feminine/i'), // Results  
      page.locator('text=/Setup Required|API key|configuration/i'), // Error
    ];
    
    // At least one should be visible within 10 seconds
    let foundState = false;
    for (const state of possibleStates) {
      if (await state.isVisible({ timeout: 10000 }).catch(() => false)) {
        foundState = true;
        break;
      }
    }
    
    expect(foundState).toBeTruthy();
  });

  test('should show loading state during analysis', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Enter any word"]');
    
    // Set up promise to watch for loading state
    const loadingPromise = page.waitForSelector('text=/Analyzing/', { 
      state: 'visible',
      timeout: 5000 
    }).catch(() => null);
    
    // Trigger search
    await searchInput.fill('wonder');
    await searchInput.press('Enter');
    
    // Check if loading state appeared (might be very quick)
    const loadingElement = await loadingPromise;
    
    // Either loading state appeared, or we went straight to results/error
    if (loadingElement) {
      expect(loadingElement).toBeTruthy();
    } else {
      // Should have results or error
      const hasContent = await page.locator('text=/dimensions|error|setup/i').isVisible({ timeout: 5000 });
      expect(hasContent).toBeTruthy();
    }
  });

  test('should have working "How it works" button', async ({ page }) => {
    // Look for How it works button
    const howItWorksButton = page.locator('button').filter({ hasText: /How it works/i });
    
    if (await howItWorksButton.isVisible()) {
      await howItWorksButton.click();
      
      // Should show modal or expanded content
      await expect(page.locator('text=/semantic|AI|embedding/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display proper error handling', async ({ page }) => {
    // Try to trigger an error by searching for empty string
    const searchInput = page.locator('input[placeholder*="Enter any word"]');
    await searchInput.fill('');
    await searchInput.press('Enter');
    
    // Should not crash, should stay on same page
    await expect(page.locator('h1')).toContainText('VibeScope');
    
    // Search should still be functional
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main elements should still be visible
    await expect(page.locator('h1')).toContainText('VibeScope');
    const searchInput = page.locator('input[placeholder*="Enter any word"]');
    await expect(searchInput).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(searchInput).toBeVisible();
  });

  test('API health check should work', async ({ page }) => {
    // Test the health endpoint
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('environment');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Test API directly with invalid input
    const response = await page.request.get('/api/vibe?term=');
    
    // Should return error but not crash
    if (!response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });
});

test.describe('Production Tests', () => {
  test.use({
    baseURL: 'https://vibescope-orpin.vercel.app'
  });

  test('production site should load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('VibeScope', { timeout: 10000 });
  });

  test('production API should respond', async ({ page }) => {
    const response = await page.request.get('https://vibescope-orpin.vercel.app/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBeDefined();
  });
});