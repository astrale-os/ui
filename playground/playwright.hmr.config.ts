import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './hmr-tests',
  outputDir: '../artifacts/playground/playwright-hmr',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 30_000,
    env: { ASTRALE_STUDIO_CATALOG: '1' },
  },
})
