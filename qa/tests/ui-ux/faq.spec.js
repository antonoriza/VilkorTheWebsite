const { test, expect } = require("@playwright/test");

test.describe("FAQ Tests", () => {
  test("FAQ accordions should toggle content", async ({ page }) => {
    await page.goto("/es/");

    const faqSection = page.locator("#faq");
    if ((await faqSection.count()) > 0) {
      const firstFaq = page.locator("#faq details").first();
      const summary = firstFaq.locator("summary");

      await summary.click();
      await expect(firstFaq).toHaveAttribute("open", "");
    }
  });
});
