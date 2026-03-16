import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// 1) 默认本地跑这个地址
const defaultBaseURL = 'http://127.0.0.1:3001';

// 2) 如果你想跑 staging，就在命令行传 PLAYWRIGHT_BASE_URL
//    例如：PLAYWRIGHT_BASE_URL=https://staging.xxx.com npx playwright test
const baseURL = process.env.PLAYWRIGHT_BASE_URL || defaultBaseURL;

// 3) 只要你设置了 PLAYWRIGHT_BASE_URL（比如 staging），就不启动本地 webServer
const shouldStartWebServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',

  timeout: 30_000,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ✅ 重点：本地/CI 自动启动 next-client 的 server；staging 不启动
  webServer: shouldStartWebServer
    ? {
        // 本地：dev；CI：build + start（更稳）
        command: isCI
          ? 'npm run build && npm run start -- -p 3000'
          : 'npm run dev -- --hostname 127.0.0.1 --port 3000',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
      }
    : undefined,

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // 想省时间就先只跑 chromium
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});