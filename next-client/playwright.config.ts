/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// 1) defaultBaseURL
const defaultBaseURL = "http://127.0.0.1:3001";

// 2) If you want to run staging, just pass PLAYWRIGHT_BASE_URL in the command line.
//    Example：PLAYWRIGHT_BASE_URL=https://staging.xxx.com npx playwright test
const baseURL = process.env.PLAYWRIGHT_BASE_URL || defaultBaseURL;

// 3) As long as you set PLAYWRIGHT_BASE_URL (for example, staging), the local webServer will not be started.
const shouldStartWebServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",

  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,

  retries: isCI ? 2 : 0,

  workers: isCI ? 2 : undefined,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // ✅ Key point: The local/CI automatically starts the server for the next-client; staging does not start.
  webServer: shouldStartWebServer
    ? {
        // Local: dev; CI: build + start (more stable)
        command: isCI
          ? "npm run build && npm run start -- -p 3001"
          : "npm run dev -- --hostname 127.0.0.1 --port 3001",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
      }
    : undefined,

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Want to save time? Just run chromium
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
