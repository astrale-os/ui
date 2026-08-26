import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const packageRoot = 'packages/ui'
const forbiddenRuntimeDependencies = [
  'shadcn',
  'cmdk',
  'lucide-react',
  'radix-ui',
  'recharts',
  'react-day-picker',
  'embla-carousel-react',
  'react-hook-form',
  'sonner',
  'next-themes',
]

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name)
        if (
          entry.isDirectory() &&
          ['node_modules', 'dist', 'artifacts', '.git'].includes(entry.name)
        ) {
          return []
        }
        return entry.isDirectory() ? walk(target) : target
      }),
    )
  ).flat()
}

test('the workspace has one public runtime package with a flat supported API', async () => {
  const root = JSON.parse(await readFile('package.json', 'utf8'))
  const manifest = JSON.parse(await readFile(`${packageRoot}/package.json`, 'utf8'))
  const workspace = await readFile('pnpm-workspace.yaml', 'utf8')

  assert.equal(root.private, true)
  assert.match(root.scripts.check, /^pnpm build && /u)
  assert.equal(manifest.name, '@astrale-os/ui')
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.license, 'MIT')
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org')
  assert.equal(manifest.publishConfig.access, 'public')
  assert.deepEqual(manifest.sideEffects, ['**/*.css'])
  assert.match(workspace, /^  - 'packages\/\*'$/mu)
  assert.doesNotMatch(workspace, /^  - '(components|constants|preset|styles|ui|utils)'$/mu)

  const manifests = (await walk('.')).filter(
    (file) =>
      file.endsWith('package.json') &&
      !file
        .split(path.sep)
        .some((part) => ['node_modules', 'dist', 'artifacts', '.git'].includes(part)),
  )
  const publishable = []
  for (const file of manifests) {
    const candidate = JSON.parse(await readFile(file, 'utf8'))
    if (candidate.private !== true) publishable.push({ file, name: candidate.name })
  }
  assert.deepEqual(publishable, [{ file: 'packages/ui/package.json', name: '@astrale-os/ui' }])

  assert.deepEqual(Object.keys(manifest.imports).toSorted(), [
    '#astrale-ui/*',
    '#astrale-ui/class-name',
    '#astrale-ui/icon',
  ])

  for (const [subpath, target] of Object.entries(manifest.exports)) {
    if (subpath === './package.json') continue
    const targets = typeof target === 'string' ? [target] : Object.values(target)
    for (const value of targets) {
      assert.match(value, /^\.\/dist\//u, `${subpath} must resolve inside dist`)
      assert.doesNotMatch(value, /\/src\//u)
    }
  }
})

test('runtime dependencies exclude optional composition and umbrella libraries', async () => {
  const manifest = JSON.parse(await readFile(`${packageRoot}/package.json`, 'utf8'))
  const lockfile = await readFile('pnpm-lock.yaml', 'utf8')
  const installed = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ])
  assert.equal(manifest.dependencies?.['@base-ui/react'], '^1.7.0')
  for (const dependency of forbiddenRuntimeDependencies)
    assert.equal(installed.has(dependency), false)
  assert.equal(
    [...installed].some((name) => name.startsWith('@radix-ui/')),
    false,
  )
  assert.equal(
    [...installed].some((name) => name.startsWith('@astrale-os/sdk')),
    false,
  )
  assert.doesNotMatch(lockfile, /['"]?@radix-ui\//u)
  assert.doesNotMatch(lockfile, /\n  cmdk@/u)
})

test('production source follows semantic owners and contains no hidden application effects', async () => {
  const files = (await walk(`${packageRoot}/src`)).filter((file) => /\.(?:ts|tsx|css)$/u.test(file))
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n')

  for (const bucket of ['primitives', 'common', 'shared', 'helpers', 'utils']) {
    assert.equal(
      files.some((file) => file.split(path.sep).includes(bucket)),
      false,
    )
  }
  assert.doesNotMatch(source, /@astrale-os\/(?:ui-components|ui-utils|ui-styles)/u)
  assert.doesNotMatch(source, /(?:from|import\()\s*['"]#ui\//u)
  assert.doesNotMatch(
    source,
    /(?:localStorage|sessionStorage|document\.cookie|\bfetch\(|XMLHttpRequest|EventSource|WebSocket)/u,
  )
  assert.doesNotMatch(source, /(?:Dock|Taskbar|WindowManager|macOS)/u)
})

test('every runtime-owned intrinsic visual part has a stable slot', async () => {
  const files = (await walk(`${packageRoot}/src`)).filter(
    (file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'),
  )
  const missing = []
  const visualTags = new Set([
    'a',
    'button',
    'div',
    'fieldset',
    'form',
    'input',
    'label',
    'li',
    'nav',
    'ol',
    'option',
    'select',
    'span',
    'svg',
    'table',
    'tbody',
    'td',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
  ])

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(/<([a-z][a-z0-9-]*)\b([^<>]*?)\/?\s*>/gsu)) {
      if (!visualTags.has(match[1])) continue
      if (/\bdata-slot\s*=/u.test(match[2])) continue
      const line = source.slice(0, match.index).split('\n').length
      missing.push(`${file}:${line} <${match[1]}>`)
    }
  }

  assert.deepEqual(missing, [])
})

test('theme has an opt-in reset and all public presets own the same character vocabulary', async () => {
  const theme = await readFile(`${packageRoot}/src/theme/theme.css`, 'utf8')
  assert.doesNotMatch(theme, /tailwindcss\/preflight/u)
  assert.doesNotMatch(theme, /@import\s+["']\.\/reset/u)
  assert.match(theme, /prefers-reduced-motion:\s*reduce/u)

  const presets = await Promise.all(
    ['astrale', 'compact', 'expressive'].map((name) =>
      readFile(`${packageRoot}/src/theme/presets/${name}.css`, 'utf8'),
    ),
  )
  for (const preset of presets) {
    for (const token of [
      '--ui-primary',
      '--ui-radius',
      '--ui-control-height',
      '--ui-font-body',
      '--ui-shadow-panel',
      '--ui-motion-fast',
    ]) {
      assert.match(preset, new RegExp(token))
    }
    assert.match(preset, /\.dark/u)
  }
  assert.equal(new Set(presets).size, presets.length)
})

test('upstream intake ledger is closed and content-addressed to current owners', () => {
  const result = spawnSync(process.execPath, ['scripts/refresh-upstream-ledger.mjs', '--check'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
})
