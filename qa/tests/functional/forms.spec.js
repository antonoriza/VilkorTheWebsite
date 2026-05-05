const { test, expect } = require("@playwright/test");

test.describe("Vilkor Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/es/#book-a-demo");
    await page.waitForLoadState("networkidle");
  });

  test("should show browser validation errors for empty fields", async ({
    page,
  }) => {
    const submitBtn = page.locator("#submit-btn").first();
    await submitBtn.click();

    // El navegador debería prevenir el envío (HTML5 validation)
    const firstName = page.locator("#first-name").first();
    const isInvalid = await firstName.evaluate((node) => !node.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test("should show success message on successful submission (mocked)", async ({
    page,
  }) => {
    // Interceptamos la llamada a StaticForms
    await page.route("**/api.staticforms.dev/submit", async (route) => {
      console.log("MOCK API CALLED");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Llenamos el formulario
    await page.fill("#first-name", "Test");
    await page.fill("#last-name", "User");
    await page.fill("#email", "test@example.com");
    await page.fill("#phone", "1234567890");

    await page.evaluate(() => {
      const form = document.getElementById("demo-form");
      let keyInput = form.querySelector('input[name="apiKey"]');
      if (!keyInput) {
        keyInput = document.createElement("input");
        keyInput.type = "hidden";
        keyInput.name = "apiKey";
        form.appendChild(keyInput);
      }
      keyInput.value = "dummy-key";
    });

    await page.click("#submit-btn");

    // Verificamos mensaje de éxito
    await page.waitForTimeout(2000); // Wait more for animation
    const isVisible = await page.evaluate(() => {
      const el = document.querySelector("#final-success-check-123");
      if (!el) return "NOT_FOUND";
      const style = getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        parseFloat(style.opacity) > 0
      );
    });
    console.log(`VISIBILITY STATUS: ${isVisible}`);
    expect(isVisible).toBe(true);
    const text = await page.evaluate(
      () => document.querySelector("#final-success-check-123").textContent,
    );
    expect(text).toContain("Gracias");
  });

  test("should show error message on API failure (mocked)", async ({
    page,
  }) => {
    // Interceptamos la llamada con un error
    await page.route("**/api.staticforms.dev/submit", async (route) => {
      console.log("MOCK ERROR API CALLED");
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      });
    });

    await page.fill("#first-name", "Test");
    await page.fill("#last-name", "User");
    await page.fill("#email", "test@example.com");
    await page.fill("#phone", "1234567890");

    await page.evaluate(() => {
      const form = document.getElementById("demo-form");
      let keyInput = form.querySelector('input[name="apiKey"]');
      if (!keyInput) {
        keyInput = document.createElement("input");
        keyInput.type = "hidden";
        keyInput.name = "apiKey";
        form.appendChild(keyInput);
      }
      keyInput.value = "dummy-key";
    });

    await page.click("#submit-btn");

    // Verificamos mensaje de error
    const errorMsg = page.locator("#contact-error-message").nth(0);
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test("should identify invalid email format", async ({ page }) => {
    await page.fill("#first-name", "Test");
    await page.fill("#email", "invalid-email"); // Formato incorrecto

    const submitBtn = page.locator("#submit-btn").first();
    await submitBtn.click();

    const emailField = page.locator("#email").first();
    const isInvalid = await emailField.evaluate(
      (node) => !node.checkValidity(),
    );
    expect(isInvalid).toBe(true);
  });
});
