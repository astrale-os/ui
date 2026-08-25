import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const sourcePath = 'registry/registry.source.json'
const rootPath = 'registry/registry.json'
const publicRootPath = 'registry.json'

function importSpecifiers(source) {
  return [
    ...source.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/gu),
    ...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gmu),
  ].map((match) => match[1])
}

function assertSafeRelative(target) {
  assert.equal(path.isAbsolute(target), false)
  assert.equal(target.includes('\\'), false)
  assert.equal(target.split('/').includes('..'), false)
}

async function readFamilyItems() {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  return (
    await Promise.all(
      source.includes.map(async (include) => {
        const manifestPath = path.join('registry', include.replace(/^\.\//u, ''))
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
        assert.ok(manifest.items.length >= 2, `${include} must be a real family`)
        return manifest.items.map((item) => ({
          ...item,
          declaredPath: path.join(path.dirname(manifestPath), item.files[0].path),
        }))
      }),
    )
  ).flat()
}

test('registry aggregation explicitly owns every family and exact item once', async () => {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const publicRoot = JSON.parse(await readFile(publicRootPath, 'utf8'))
  assert.equal(source.shadcn, '4.18.0')
  assert.equal(source.includes.length, 20)
  assert.equal(new Set(source.includes).size, source.includes.length)
  assert.equal(publicRoot.include.length, 21)
  assert.equal(publicRoot.include[0], 'registry/base/registry.json')
  assert.deepEqual(
    publicRoot.include.slice(1).sort(),
    source.includes.map((include) => `registry/${include.replace(/^\.\//u, '')}`).sort(),
  )

  const familyItems = await readFamilyItems()
  assert.equal(root.items.length, 49)
  assert.deepEqual(
    root.items.map((item) => item.name).sort(),
    familyItems.map((item) => item.name).sort(),
  )
  assert.equal(new Set(root.items.map((item) => item.name)).size, root.items.length)
  assert.equal(
    new Set(root.items.map((item) => item.meta.canonicalAddress)).size,
    root.items.length,
  )
})

test('every registry item is independently bounded, controlled, and safe to install', async () => {
  const items = await readFamilyItems()
  for (const item of items) {
    assert.match(item.name, /^(?:pattern|block)-[a-z0-9-]+$/u)
    assert.match(item.meta.canonicalAddress, /^(?:pattern|block)\/[a-z0-9-]+\/[a-z0-9-/]+$/u)
    assert.equal(item.files.length, 1)
    assert.deepEqual(item.dependencies, ['@astrale-os/ui@^0.3.0-beta.0'])

    const file = item.files[0]
    assert.match(file.path, /^[a-z0-9-]+\.tsx$/u)
    assert.match(file.target, /^components\/astrale\/(?:pattern|block)\//u)
    assertSafeRelative(file.path)
    assertSafeRelative(file.target)
    await stat(item.declaredPath)

    const itemSource = await readFile(item.declaredPath, 'utf8')
    const imports = importSpecifiers(itemSource)
    assert.equal(
      imports.every(
        (specifier) =>
          specifier === 'react' ||
          specifier === '@astrale-os/ui' ||
          specifier.startsWith('@astrale-os/ui/'),
      ),
      true,
      `${item.name} imports only public runtime owners`,
    )
    assert.doesNotMatch(
      itemSource,
      /(?:\bfetch\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|document\.cookie|@astrale-os\/sdk|next\/router|react-router)/u,
    )
    assert.match(itemSource, /\bclassName\?: string/u)
    assert.match(itemSource, /\bstyle\?: React\.CSSProperties/u)
    assert.match(
      itemSource,
      new RegExp(`data-slot=["']${item.meta.canonicalAddress.replaceAll('/', '-')}["']`),
    )
    for (const match of itemSource.matchAll(/<([a-z][a-z0-9-]*)(?=[\s/>])/gu)) {
      const closing = itemSource.indexOf('>', match.index + match[0].length)
      assert.ok(closing >= 0)
      assert.match(
        itemSource.slice(match.index, closing),
        /\sdata-slot=["'][^"']+["']/u,
        `${item.name} exposes ${match[1]} as a host-addressable part`,
      )
    }
    assert.doesNotMatch(itemSource, /Object\.(?:freeze|seal)|as const satisfies Readonly/u)
    const presentationOnly = new Set([
      'pattern/chart/line-basic',
      'pattern/chart/bar-basic',
      'pattern/data-table/basic',
      'pattern/message/bubble-basic',
      'pattern/typography/article',
      'pattern/typography/dense-data',
    ])
    if (!presentationOnly.has(item.meta.canonicalAddress)) {
      assert.match(
        itemSource,
        /\bon[A-Z][A-Za-z]+/u,
        `${item.name} must inject application actions`,
      )
    }
  }
})

test('registry guards reject traversal and observe every executable import form', () => {
  for (const target of [
    '../escape.tsx',
    'components/astrale/pattern/../../escape.tsx',
    '/tmp/x',
    'C:\\x',
  ]) {
    assert.throws(() => assertSafeRelative(target))
  }
  assert.deepEqual(
    importSpecifiers(
      "import '@evil/side-effect'\nimport value from '@astrale-os/ui/button'\nconst lazy = import('@evil/dynamic')\n",
    ).sort(),
    ['@astrale-os/ui/button', '@evil/dynamic', '@evil/side-effect'],
  )
})

test('registry inventory covers all locked V1 families and block compositions', async () => {
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const addresses = new Set(root.items.map((item) => item.meta.canonicalAddress))
  const patternFamilies = [
    'calendar',
    'carousel',
    'chart',
    'combobox',
    'command-palette',
    'data-table',
    'date-picker',
    'form',
    'message',
    'questionnaire',
    'sidebar',
    'toast',
    'typography',
  ]
  for (const family of patternFamilies) {
    assert.ok(
      [...addresses].filter((address) => address.startsWith(`pattern/${family}/`)).length >= 2,
      family,
    )
  }
  for (const required of [
    'block/application-shell/sidebar-header',
    'block/application-shell/compact-command',
    'block/application-shell/responsive-workspace',
    'block/authentication/sign-in-card',
    'block/authentication/sign-up-card',
    'block/authentication/recovery',
    'block/authentication/verification',
    'block/communication/inbox',
    'block/communication/conversation',
    'block/communication/composer',
    'block/dashboard/overview',
    'block/dashboard/analytics',
    'block/dashboard/operations',
    'block/data-management/collection-browser',
    'block/data-management/details-panel',
    'block/data-management/editor',
    'block/onboarding/welcome',
    'block/onboarding/multi-step',
    'block/onboarding/empty-first-value',
    'block/settings/profile',
    'block/settings/appearance',
    'block/settings/team',
    'block/settings/notifications',
  ]) {
    assert.ok(addresses.has(required), required)
  }
})

test('every built install item is exact current source rather than stale generated output', async () => {
  for (const item of await readFamilyItems()) {
    const built = JSON.parse(await readFile(`registry/public/r/${item.name}.json`, 'utf8'))
    assert.equal(built.name, item.name)
    assert.deepEqual(built.dependencies, item.dependencies)
    assert.equal(built.meta.canonicalAddress, item.meta.canonicalAddress)
    assert.equal(built.files.length, item.files.length)
    assert.equal(built.files[0].target, item.files[0].target)
    assert.equal(built.files[0].content, await readFile(item.declaredPath, 'utf8'))
  }
})
