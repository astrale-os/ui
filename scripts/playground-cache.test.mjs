import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import playgroundConfig from '../playground/vite.config.ts'

test('the playground dependency cache belongs to its checkout', async () => {
  const config = await playgroundConfig({
    command: 'serve',
    mode: 'development',
    isPreview: false,
    isSsrBuild: false,
  })

  assert.equal(
    config.cacheDir,
    fileURLToPath(
      new URL(
        `../playground/node_modules/.vite-astrale-${createHash('sha256')
          .update(fileURLToPath(new URL('../', import.meta.url)))
          .digest('hex')
          .slice(0, 12)}`,
        import.meta.url,
      ),
    ),
  )
})
