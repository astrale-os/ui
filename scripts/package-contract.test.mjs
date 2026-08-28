import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const packageRoot = 'packages/ui'
const forbiddenRuntimeDependencies = [
  'shadcn',
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

function cssBlock(source, prelude) {
  const preludeStart = source.indexOf(prelude)
  assert.notEqual(preludeStart, -1, `missing CSS prelude ${prelude}`)
  const blockStart = source.indexOf('{', preludeStart + prelude.length)
  assert.notEqual(blockStart, -1, `missing CSS block for ${prelude}`)
  let depth = 1
  for (let index = blockStart + 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(blockStart + 1, index)
  }
  assert.fail(`unclosed CSS block for ${prelude}`)
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
  assert.deepEqual(manifest.files, [
    'dist',
    'CHANGELOG.md',
    'README.md',
    'LICENSE',
    'THIRD-PARTY-NOTICES.md',
  ])
  assert.equal(manifest.dependencies?.['@babel/parser'], undefined)
  assert.equal(root.devDependencies?.['@babel/parser'], '8.0.4')
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

  const { runtimeComponentNames } = await import('../playground/src/catalog/inventory.ts')
  const publicComponents = Object.entries(manifest.exports)
    .filter(
      ([subpath, target]) =>
        subpath.startsWith('./') &&
        subpath !== './class-name' &&
        target &&
        typeof target === 'object' &&
        typeof target.import === 'string' &&
        target.import.endsWith('/index.js'),
    )
    .map(([subpath]) => subpath.slice(2))
    .toSorted()
  assert.deepEqual([...runtimeComponentNames].toSorted(), publicComponents)
})

test('runtime dependencies exclude optional composition and umbrella libraries', async () => {
  const manifest = JSON.parse(await readFile(`${packageRoot}/package.json`, 'utf8'))
  const installed = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ])
  assert.equal(manifest.dependencies?.['@base-ui/react'], '^1.7.0')
  assert.deepEqual(Object.keys(manifest.dependencies).toSorted(), [
    '@base-ui/react',
    'class-variance-authority',
    'clsx',
    'cmdk',
    'input-otp',
    'lucide-react',
    'react-resizable-panels',
    'tailwind-merge',
  ])
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
})

test('the exact shadcn support layer maps orientation shorthand to Base UI state', async () => {
  const support = await readFile(`${packageRoot}/src/theme/shadcn-tailwind.css`, 'utf8')
  assert.match(
    support,
    /@custom-variant data-horizontal\s*\{\s*&:where\(\[data-orientation="horizontal"\]\)/u,
  )
  assert.match(
    support,
    /@custom-variant data-vertical\s*\{\s*&:where\(\[data-orientation="vertical"\]\)/u,
  )
  const owners = [
    'action/button-group',
    'action/toggle-group',
    'content/separator',
    'input/field',
    'input/slider',
    'layout/scroll-area',
    'navigation/tabs',
  ]
  for (const owner of owners) {
    const source = await readFile(`${packageRoot}/src/${owner}/index.tsx`, 'utf8')
    assert.match(source, /(?:group-)?data-(?:horizontal|vertical)(?:[/:]|\b)/u, owner)
  }
})

test('theme has an opt-in reset and all public presets own the same character vocabulary', async () => {
  const theme = await readFile(`${packageRoot}/src/theme/theme.css`, 'utf8')
  const reset = await readFile(`${packageRoot}/src/theme/reset.css`, 'utf8')
  assert.match(theme, /@import 'tailwindcss\/utilities\.css' source\(none\);/u)
  assert.match(theme, /@source '\.\.\/\*\*\/\*\.\{ts,tsx\}';/u)
  assert.doesNotMatch(theme, /tailwindcss\/preflight/u)
  assert.doesNotMatch(theme, /@import\s+["']\.\/reset/u)
  const resetSupportStart = reset.indexOf('\n* {\n')
  assert.notEqual(resetSupportStart, -1, 'missing universal reset support selector')
  const resetSupport = cssBlock(reset.slice(resetSupportStart + 1), '*')
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
  assert.deepEqual(resetSupport, [
    'border-color: var(--ui-border)',
    'outline-color: color-mix(in oklab, var(--ui-ring) 50%, transparent)',
  ])
  const reducedMotion = cssBlock(theme, '@media (prefers-reduced-motion: reduce)')
  const slotMotion = cssBlock(reducedMotion, ":where([data-slot]:not([data-slot='spinner']))")
  assert.deepEqual(
    [...slotMotion.matchAll(/(?:animation|transition)-duration:\s*[^;]+/gu)].map(
      (match) => match[0],
    ),
    ['animation-duration: 1ms !important', 'transition-duration: 1ms !important'],
  )
  const accordionMotion = cssBlock(reducedMotion, ":where([data-slot='accordion-content'])")
  assert.deepEqual(
    [...accordionMotion.matchAll(/(?:animation|transition)-duration:\s*[^;]+/gu)].map(
      (match) => match[0],
    ),
    ['animation-duration: 0s !important', 'transition-duration: 0s !important'],
  )

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
