const { test, expect } = require('@playwright/test');

test.describe('Vilkor UI/UX Tests', () => {
  
  test('should load the homepage and show the brand logo', async ({ page }) => {
    await page.goto('/');
    console.log('Current URL:', page.url());
    const logo = page.getByText('Vilkor').first();
    await expect(logo).toBeVisible();
  });

  test('should switch language correctly (i18n check)', async ({ page }) => {
    // Go to English version
    await page.goto('/en/');
    const contactBtn = page.locator('a[href="#book-a-demo"]').filter({ hasText: 'Schedule Demo', visible: true }).first();
    await expect(contactBtn).toBeVisible();
    
    // Go back to Spanish
    await page.goto('/es/');
    const contactBtnEs = page.locator('a[href="#book-a-demo"]').filter({ hasText: 'Agendar demo', visible: true }).first();
    await expect(contactBtnEs).toBeVisible();
  });

  test('should toggle pricing from monthly to annual', async ({ page }) => {
    await page.goto('/es/');
    const starterPrice = page.locator('.price-value').first();
    
    // Initial monthly price
    await expect(starterPrice).toHaveText('$649');
    
    // Click toggle
    await page.click('#pricing-toggle');
    
    // Wait for the price update (there is a 150ms delay in the script)
    await expect(starterPrice).toHaveText('$519', { timeout: 2000 });
  });

  test('mobile menu should open on small screens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile only');
    
    await page.goto('/');
    const menuToggle = page.locator('#mobile-menu-toggle');
    const mobileMenu = page.locator('#mobile-menu');
    
    await expect(menuToggle).toBeVisible();
    await expect(mobileMenu).toHaveClass(/translate-x-full/); // Should be hidden initially
    
    await menuToggle.click();
    
    // Wait for animation
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    await expect(page.locator('.mobile-nav-link').first()).toBeVisible();
  });

});
