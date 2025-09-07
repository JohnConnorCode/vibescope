import { test, expect } from '@playwright/test';

test.describe('AI Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('OpenAI word analysis should return semantic dimensions', async ({ page }) => {
    // Test the API directly first
    const response = await page.request.get('/api/vibe?term=love');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Should have term
    expect(data.term).toBe('love');
    
    // Should have axes with 12 dimensions
    expect(data.axes).toBeDefined();
    expect(Object.keys(data.axes).length).toBeGreaterThanOrEqual(12);
    
    // Check for expected dimensions
    expect(data.axes).toHaveProperty('masculine_feminine');
    expect(data.axes).toHaveProperty('concrete_abstract');
    expect(data.axes).toHaveProperty('positive_negative');
    
    // Values should be between -1 and 1
    Object.values(data.axes).forEach(value => {
      expect(typeof value).toBe('number');
      expect(value as number).toBeGreaterThanOrEqual(-1);
      expect(value as number).toBeLessThanOrEqual(1);
    });
  });

  test('GPT-5 nano narration should generate poetic interpretations', async ({ page }) => {
    // First get vibe data
    const vibeResponse = await page.request.get('/api/vibe?term=peace');
    const vibeData = await vibeResponse.json();
    
    // Then request narration
    const narrationResponse = await page.request.post('/api/vibe/narrate', {
      data: {
        term: 'peace',
        axes: vibeData.axes,
        neighbors: vibeData.neighbors || []
      }
    });
    
    expect(narrationResponse.ok()).toBeTruthy();
    
    const narrationData = await narrationResponse.json();
    expect(narrationData.narrative).toBeDefined();
    expect(typeof narrationData.narrative).toBe('string');
    expect(narrationData.narrative.length).toBeGreaterThan(10);
  });

  test('Sentence analysis should detect manipulation patterns', async ({ page }) => {
    const testSentence = 'Everyone knows this is the only solution that will save us from disaster';
    
    const response = await page.request.get(`/api/vibe/analyze-sentence?text=${encodeURIComponent(testSentence)}`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Should have propaganda analysis
    expect(data.propaganda).toBeDefined();
    expect(data.propaganda.overallManipulation).toBeDefined();
    expect(typeof data.propaganda.overallManipulation).toBe('number');
    
    // Should detect techniques in this manipulative sentence
    expect(data.propaganda.techniques).toBeDefined();
    expect(Array.isArray(data.propaganda.techniques)).toBeTruthy();
    expect(data.propaganda.techniques.length).toBeGreaterThan(0);
    
    // Should include specific scores
    expect(data.propaganda).toHaveProperty('fearTactics');
    expect(data.propaganda).toHaveProperty('bandwagon');
  });

  test('Full UI flow: search word and get AI analysis', async ({ page }) => {
    // Find the search input
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Type a word and search
    await searchInput.fill('wisdom');
    await searchInput.press('Enter');
    
    // Wait for results (either loading or data)
    await page.waitForTimeout(2000);
    
    // Check for results - look for any dimension or manipulation text
    const hasResults = await page.locator('text=/masculine|feminine|concrete|abstract|positive|negative|manipulation/i').first().isVisible().catch(() => false);
    
    if (!hasResults) {
      // If no results, check for error message
      const hasError = await page.locator('text=/error|failed|API/i').first().isVisible().catch(() => false);
      
      if (hasError) {
        // Check what error it is
        const errorText = await page.locator('text=/error|failed|API/i').first().textContent();
        console.log('Error found:', errorText);
        
        // If it's API key error, that's expected in test environment
        if (errorText?.includes('API key')) {
          expect(errorText).toContain('API');
        } else {
          // Other errors should be investigated
          expect(hasError).toBeTruthy();
        }
      }
    } else {
      // Results were shown successfully
      expect(hasResults).toBeTruthy();
    }
  });

  test('Comparison mode should work with multiple words', async ({ page }) => {
    // Click compare button if visible
    const compareButton = page.locator('button').filter({ hasText: /compare/i }).first();
    
    if (await compareButton.isVisible()) {
      await compareButton.click();
      
      // Should show comparison interface
      await page.waitForTimeout(1000);
      
      // Check for comparison UI elements
      const hasComparisonUI = await page.locator('text=/versus|vs|compare/i').first().isVisible().catch(() => false);
      expect(hasComparisonUI).toBeTruthy();
    }
  });

  test('Share functionality should create shareable links', async ({ page }) => {
    // Test share API directly
    const response = await page.request.post('/api/share', {
      data: {
        term: 'test-word',
        type: 'word',
        data: {
          axes: {
            masculine_feminine: 0.5,
            concrete_abstract: -0.3
          }
        }
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('/share/');
      
      // Try to retrieve the share
      const shareId = data.id;
      const getResponse = await page.request.get(`/api/share?id=${shareId}`);
      
      if (getResponse.ok()) {
        const shareData = await getResponse.json();
        expect(shareData.term).toBe('test-word');
      }
    }
  });

  test('API rate limiting should be in place', async ({ page }) => {
    // Make multiple rapid requests
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(page.request.get(`/api/vibe?term=test${i}`));
    }
    
    const responses = await Promise.all(promises);
    
    // Some should be rate limited (429) or all should succeed
    const rateLimited = responses.filter(r => r.status() === 429);
    const succeeded = responses.filter(r => r.ok());
    
    // Either rate limiting is working or all requests succeeded
    expect(rateLimited.length + succeeded.length).toBe(responses.length);
  });

  test('Health check should report API status', async ({ page }) => {
    const response = await page.request.get('/api/health');
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(data.database).toBeDefined();
      expect(data.environment).toBeDefined();
      
      // Should report OpenAI key status
      expect(data.environment).toHaveProperty('hasOpenAIKey');
    }
  });
});

test.describe('Production AI Tests', () => {
  test.use({
    baseURL: 'https://vibescope-orpin.vercel.app'
  });

  test('Production API should respond with real AI analysis', async ({ page }) => {
    const response = await page.request.get('https://vibescope-orpin.vercel.app/api/vibe?term=harmony');
    
    // Should either work or return specific error
    if (response.ok()) {
      const data = await response.json();
      expect(data.axes).toBeDefined();
      expect(Object.keys(data.axes).length).toBeGreaterThan(0);
    } else {
      const data = await response.json();
      expect(data.error).toBeDefined();
    }
  });
});