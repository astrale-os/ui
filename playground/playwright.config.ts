import { defineConfig, devices } from '@playwright/test'

const studioProviderCatalog = process.env.ASTRALE_STUDIO_CATALOG === '1'
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)

export default defineConfig({
  testDir: './tests',
  testIgnore: studioProviderCatalog ? [] : ['studio-variants.spec.ts'],
  outputDir: '../artifacts/playground/playwright',
  webServer: {
    command: studioProviderCatalog
      ? `pnpm exec vite preview --host 127.0.0.1 --port ${port}`
      : `pnpm --workspace-root playground:dev --host 127.0.0.1 --port ${port}`,
    port,
    reuseExistingServer: studioProviderCatalog ? false : !process.env.CI,
    env: { ASTRALE_STUDIO_CATALOG: process.env.ASTRALE_STUDIO_CATALOG ?? '0' },
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
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
