import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import playwrightConfig from '../playground/playwright.config.ts'
import playgroundConfig from '../playground/vite.config.ts'

const normalize = (value) => value.replaceAll('\\', '/')

function resolveAlias(specifier) {
  const alias = playgroundConfig.resolve.alias.find(({ find }) =>
    typeof find === 'string' ? find === specifier : find.test(specifier),
  )
  assert.ok(alias, `missing playground alias for ${specifier}`)
  return normalize(specifier.replace(alias.find, alias.replacement))
}

test('the playground dev route keeps every public UI entrypoint source-owned', async () => {
  const workspace = JSON.parse(await readFile('package.json', 'utf8'))
  const uiPackage = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
  assert.equal(
    workspace.scripts['playground:dev'],
    'pnpm build && pnpm --filter @astrale-os/ui-playground dev',
  )
  assert.equal(
    playwrightConfig.webServer.command,
    'pnpm --workspace-root playground:dev --host 127.0.0.1 --port 4173',
  )
  assert.deepEqual(playgroundConfig.server.forwardConsole, {
    unhandledErrors: false,
    logLevels: ['error', 'warn'],
  })

  for (const [entrypoint, target] of Object.entries(uiPackage.exports)) {
    const importPath = typeof target === 'string' ? undefined : target.import
    if (!importPath?.startsWith('./dist/') || !importPath.endsWith('.js')) continue
    const specifier =
      entrypoint === '.' ? '@astrale-os/ui' : `@astrale-os/ui/${entrypoint.slice(2)}`
    const sourceStem = importPath.slice('./dist/'.length, -'.js'.length)
    const candidates = ['tsx', 'ts'].map((extension) =>
      fileURLToPath(new URL(`../packages/ui/src/${sourceStem}.${extension}`, import.meta.url)),
    )
    const expected = candidates.find((candidate) => existsSync(candidate))
    assert.ok(expected, `missing source owner for ${specifier}`)
    assert.equal(resolveAlias(specifier), normalize(expected))
  }

  assert.equal(
    resolveAlias('@astrale-os/ui/theme.css'),
    normalize(fileURLToPath(new URL('../packages/ui/src/theme/theme.css', import.meta.url))),
  )
  assert.equal(
    resolveAlias('@astrale-os/ui/presets/astrale.css'),
    normalize(
      fileURLToPath(new URL('../packages/ui/src/theme/presets/astrale.css', import.meta.url)),
    ),
  )
})
