const { test, expect } = require("@playwright/test");

test.describe("Navigation Tests", () => {
  test("Internal links should navigate to correct sections", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/es/");

    const navLinks = [
      { selector: 'a[href="#solutions"]', sectionId: "solutions" },
      { selector: 'a[href="#features"]', sectionId: "features" },
      { selector: 'a[href="#pricing"]', sectionId: "pricing" },
    ];

    for (const link of navLinks) {
      if (isMobile) {
        const toggle = page.locator("#mobile-menu-toggle");
        await toggle.click();
        await page.waitForTimeout(500); // Wait for menu animation
        await page.locator(`#mobile-menu ${link.selector}`).first().click();
      } else {
        await page.locator(`nav ${link.selector}`).first().click();
      }

      const section = page.locator(`#${link.sectionId}`);
      await expect(section).toBeVisible();
    }
  });
});
