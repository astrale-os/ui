import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@astrale-os\/ui\/theme\.css$/u,
        replacement: fileURLToPath(new URL('../packages/ui/dist/theme.css', import.meta.url)),
      },
      {
        find: /^@astrale-os\/ui\/presets\/(.+)\.css$/u,
        replacement: fileURLToPath(new URL('../packages/ui/dist/presets/$1.css', import.meta.url)),
      },
      {
        find: /^@astrale-os\/ui$/u,
        replacement: fileURLToPath(new URL('../packages/ui/src/index.ts', import.meta.url)),
      },
      {
        find: /^#astrale-ui\/(.+)$/u,
        replacement: fileURLToPath(new URL('../packages/ui/src/$1', import.meta.url)),
      },
    ],
  },
  server: { strictPort: true },
  build: { sourcemap: false },
})
