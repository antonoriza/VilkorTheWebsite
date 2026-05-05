const { test, expect } = require("@playwright/test");

test.describe("Appearance Tests", () => {
  test("Dark mode toggle should persist or change body class", async ({
    page,
  }) => {
    await page.goto("/es/");

    const darkToggle = page.locator("#dark-mode-toggle");
    if ((await darkToggle.count()) > 0) {
      await darkToggle.click();
      const isDark = await page.locator("html").hasClass("dark");
      console.log(`Dark mode active: ${isDark}`);
      expect(isDark).toBe(true);
    }
  });
});
