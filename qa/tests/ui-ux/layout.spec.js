const { test, expect } = require('@playwright/test');

test.describe('Layout & Responsive Tests', () => {
  test('Should not have horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/es/');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });
});
