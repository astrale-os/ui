import { defineConfig, devices } from '@playwright/test'

const internalStudioCatalog = process.env.ASTRALE_STUDIO_CATALOG === '1'

export default defineConfig({
  testDir: './tests',
  testIgnore: internalStudioCatalog ? [] : ['studio-internal.spec.ts'],
  outputDir: '../artifacts/playground/playwright',
  webServer: {
    command: internalStudioCatalog
      ? 'pnpm exec vite preview --host 127.0.0.1 --port 4173'
      : 'pnpm --workspace-root playground:dev --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: internalStudioCatalog ? false : !process.env.CI,
    env: { ASTRALE_STUDIO_CATALOG: process.env.ASTRALE_STUDIO_CATALOG ?? '0' },
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
