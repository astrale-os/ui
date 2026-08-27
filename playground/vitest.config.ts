import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: { __ASTRALE_STUDIO_CATALOG__: false },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
  },
})
