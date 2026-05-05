const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests", // Relativo a la ubicación de este archivo (qa/)
  outputDir: "../.hugo_internal/test-results", // Fuera de qa/, en la cache global
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [
      "html",
      { outputFolder: "../.hugo_internal/playwright-report", open: "never" },
    ],
  ],
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}",
  use: {
    baseURL: "http://localhost:1314",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "en-US",
    timezoneId: "UTC",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command:
      "npx hugo server -p 1314 --source .. --config config/_default/config.toml --watch=false --disableLiveReload",
    url: "http://localhost:1314",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
