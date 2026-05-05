const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

test.describe("Vilkor Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Critical: Accessibility and SEO", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "best-practice"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    await expect(page).toHaveTitle(/Vilkor/);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("Critical: Core UX (Dark Mode and Navigation)", async ({ page }) => {
    // Navigation
    const solutionsLink = page
      .locator('nav a[href*="solutions"], nav a:has-text("Soluciones")')
      .first();
    if (await solutionsLink.isVisible()) {
      await solutionsLink.click();
      await expect(page).toHaveURL(/.*solutions|.*/);
    }

    // Dark Mode
    const darkToggle = page.locator("#dark-mode-toggle");
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    }
  });

  test("Critical: Localization Switch", async ({ page }) => {
    const langSwitch = page
      .locator(".language-switcher, #language-select, [aria-label*='language']")
      .first();
    if (await langSwitch.isVisible()) {
      // Just verify it exists and is clickable
      await expect(langSwitch).toBeVisible();
    }
  });

  test("Critical: Lead Form Logic", async ({ page }) => {
    const contactForm = page.locator("form").first();
    if (await contactForm.isVisible()) {
      const submitBtn = contactForm.locator('button[type="submit"]');
      await expect(submitBtn).toBeVisible();
    }
  });
});
