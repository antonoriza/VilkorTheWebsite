const { test, expect } = require('@playwright/test');

const languages = [
  { 
    code: 'es', 
    path: '/es/', 
    contactText: 'Agendar Demo', 
    currency: '$', 
    monthly: '649', 
    annual: '519',
    successMsg: 'Gracias'
  },
  { 
    code: 'en', 
    path: '/en/', 
    contactText: 'Schedule Demo', 
    currency: '$', 
    monthly: '35', 
    annual: '28',
    successMsg: 'Thank You'
  },
  { 
    code: 'pt', 
    path: '/pt/', 
    contactText: 'Agendar Demo', 
    currency: 'R$', 
    monthly: '189', 
    annual: '151',
    successMsg: 'Obrigado'
  }
];

test.describe('Vilkor Multi-language UI/UX Tests', () => {
  
  for (const lang of languages) {
    test.describe(`Language: ${lang.code.toUpperCase()}`, () => {
      
      test(`should load the homepage in ${lang.code}`, async ({ page }) => {
        await page.goto(lang.path);
        const logo = page.getByText('Vilkor').first();
        await expect(logo).toBeVisible();
      });

      test(`should show correct contact button text in ${lang.code}`, async ({ page }) => {
        await page.goto(lang.path);
        const contactBtn = page.locator('a[href="#book-a-demo"]').filter({ hasText: lang.contactText, visible: true }).first();
        await expect(contactBtn).toBeVisible();
      });

      test(`should toggle pricing correctly in ${lang.code}`, async ({ page }) => {
        await page.goto(lang.path);
        const starterPrice = page.locator('.price-value').first();
        
        // Initial monthly price
        await expect(starterPrice).toHaveText(`${lang.currency}${lang.monthly}`);
        
        // Click toggle
        await page.click('#pricing-toggle');
        
        // Wait for the price update
        await expect(starterPrice).toHaveText(`${lang.currency}${lang.annual}`, { timeout: 5000 });
      });

      test(`should show localized success message in ${lang.code}`, async ({ page }) => {
        await page.route('**/api.staticforms.dev/submit', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        });

        await page.goto(`${lang.path}#book-a-demo`);
        
        await page.fill('#first-name', 'Test');
        await page.fill('#last-name', 'User');
        await page.fill('#email', 'test@example.com');
        await page.fill('#phone', '1234567890');
        
        // Inject dummy API key if not present
        await page.evaluate(() => {
          const form = document.getElementById('demo-form');
          let keyInput = form.querySelector('input[name="apiKey"]');
          if (!keyInput) {
            keyInput = document.createElement('input');
            keyInput.type = 'hidden';
            keyInput.name = 'apiKey';
            form.appendChild(keyInput);
          }
          keyInput.value = 'dummy-key';
        });
        
        await page.click('#submit-btn');

        // Check success message visibility
        const successContainer = page.locator('#final-success-check-123');
        await expect(successContainer).toBeVisible({ timeout: 10000 });
        
        const text = await successContainer.textContent();
        expect(text).toContain(lang.successMsg);
      });

    });
  }

});
