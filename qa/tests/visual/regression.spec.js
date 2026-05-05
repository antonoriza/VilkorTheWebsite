const { test, expect } = require("@playwright/test");

test.describe("Vilkor Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({
      content: `
      * { 
        transition: none !important; 
        animation: none !important; 
        -webkit-font-smoothing: none !important;
        font-smoothing: none !important;
        text-rendering: optimizeSpeed !important;
      }
      [data-aos] { opacity: 1 !important; transform: none !important; }
    `,
    });
    // Disable Tilt
    await page.evaluate(() => {
      if (typeof VanillaTilt !== "undefined") {
        document.querySelectorAll(".pricing-card").forEach((el) => {
          if (el.vanillaTilt) el.vanillaTilt.destroy();
        });
      }
    });
  });

  test("Hero section should match snapshot", async ({ page }) => {
    const hero = page.locator("section").first();
    await expect(hero).toHaveScreenshot("hero-desktop.png", {
      threshold: 0.8,
      maxDiffPixelRatio: 1.0,
      animations: "disabled",
    });
  });

  test("Pricing cards should match snapshot", async ({ page }) => {
    const pricing = page.locator("#pricing");
    await expect(pricing).toHaveScreenshot("pricing-section.png", {
      threshold: 0.8,
      maxDiffPixelRatio: 1.0,
      animations: "disabled",
    });
  });

  test("Solutions grid should match snapshot", async ({ page }) => {
    const solutions = page.locator("#solutions");
    await expect(solutions).toHaveScreenshot("solutions-section.png", {
      threshold: 0.8,
      maxDiffPixelRatio: 1.0,
      animations: "disabled",
    });
  });
});
