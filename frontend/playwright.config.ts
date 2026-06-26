import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const isDocker = !!process.env.E2E_DOCKER

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.E2E_DOCKER && {
          channel: 'chromium' as const,
          executablePath: '/usr/bin/chromium-browser',
          launchOptions: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        }),
      },
    },
  ],
  // In Docker the frontend is already served by Nginx — no need to start Vite.
  ...(isDocker
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 30_000,
        },
      }),
})
