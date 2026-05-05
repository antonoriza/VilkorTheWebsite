const { test, expect } = require('@playwright/test');

test.describe('Performance Audit', () => {
  test('Page performance: should load in under 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/es/', { waitUntil: 'networkidle' });
    const endTime = Date.now();
    const loadTime = (endTime - startTime) / 1000;
    
    console.log(`Page Load Time: ${loadTime}s`);
    expect(loadTime).toBeLessThan(5);
  });
});
