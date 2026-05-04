const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

test.describe('Vilkor Accessibility Audit', () => {

  test('Home page should not have critical accessibility issues', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // Check for accessibility violations
    // We can filter by impact: 'critical', 'serious', 'moderate', 'minor'
    await page.waitForTimeout(1000);
    await checkA11y(page, null, {
      includedImpacts: ['critical', 'serious']
    }, (violations) => {
      violations.forEach(v => {
        console.error(`Violation: ${v.id} - ${v.description}`);
        v.nodes.forEach(n => console.error(`  Node: ${n.html}`));
      });
    });
  });

  test('Pricing section should be accessible', async ({ page }) => {
    await page.goto('/es/');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
    await page.waitForTimeout(2000); // Wait for AOS animations to settle
    await checkA11y(page, '#pricing', {
      includedImpacts: ['critical', 'serious']
    });
  });

});
