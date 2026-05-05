const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests", // Relativo a la ubicación de este archivo (qa/)
  outputDir: "../.hugo_internal/test-results", // Fuera de qa/, en la cache global
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    [
      "html",
      { outputFolder: "../.hugo_internal/playwright-report", open: "never" },
    ],
  ],
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-platform}{ext}",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "en-US",
    timezoneId: "UTC",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:1314/",
      },
    },
  ],
  webServer: {
    command:
      "hugo server -p 1314 --bind 0.0.0.0 --source .. --config config/_default/config.toml --watch=false --disableLiveReload",
    url: "http://127.0.0.1:1314",
    reuseExistingServer: !process.env.CI,
    env: {
      PATH: "/usr/local/bin:/usr/bin:/bin:" + process.env.PATH,
    },
    stdout: "ignore",
    stderr: "pipe",
  },
});
