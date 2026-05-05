const { test, expect } = require("@playwright/test");

test.describe("Appearance Tests", () => {
  test("Dark mode toggle should persist or change body class", async ({
    page,
  }) => {
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const darkToggle = page.locator("#dark-mode-toggle");
    if ((await darkToggle.count()) > 0) {
      await darkToggle.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    }
  });
});
