import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const sourcePath = 'registry/registry.source.json'
const rootPath = 'registry/registry.json'
const publicRootPath = 'registry.json'
const provenance = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', 'utf8'),
)
const provenanceByAddress = new Map(
  provenance.components.map((component) => [component.address, component]),
)
const coreCatalog = JSON.parse(await readFile('registry/core-catalog.json', 'utf8'))
const upstreamLedger = JSON.parse(await readFile('tooling/upstream/ledger.json', 'utf8'))
const externalProvenances = await Promise.all(
  (await readdir('tooling/upstream/providers', { recursive: true }))
    .filter((entry) => entry.endsWith('/provenance.json'))
    .map(async (entry) => ({
      path: path.join('tooling/upstream/providers', entry),
      value: JSON.parse(await readFile(path.join('tooling/upstream/providers', entry), 'utf8')),
    })),
)
const registryPackage = JSON.parse(await readFile('registry/package.json', 'utf8'))
const removedCanonicalAddresses = [
  'block/application-shell/compact-command',
  'block/application-shell/responsive-workspace',
  'block/application-shell/sidebar-header',
  'block/communication/composer',
  'block/communication/conversation',
  'block/communication/inbox',
  'block/data-management/collection-browser',
  'block/data-management/details-panel',
  'block/data-management/editor',
  'block/onboarding/empty-first-value',
  'block/onboarding/multi-step',
  'block/onboarding/welcome',
  'block/settings/appearance',
  'block/settings/notifications',
  'block/settings/profile',
  'block/settings/team',
  'pattern/chart/bar-basic',
  'pattern/chart/line-basic',
  'pattern/data-table/basic',
  'pattern/data-table/server-controlled',
  'pattern/form/native',
  'pattern/questionnaire/multi-step',
  'pattern/questionnaire/single-page',
  'pattern/sidebar/application',
  'pattern/sidebar/mobile-controlled',
  'pattern/typography/article',
  'pattern/typography/dense-data',
]

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const current = path.join(root, entry.name)
        return entry.isDirectory() ? filesUnder(current) : [current]
      }),
    )
  ).flat()
}

function packageName(specifier) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0]
}

function componentDependencies(source, styling = []) {
  return [
    '@astrale-os/ui@^0.3.0-beta.0',
    ...new Set(
      [...importSpecifiers(source), ...styling]
        .filter(
          (specifier) =>
            specifier !== 'react' &&
            !specifier.startsWith('.') &&
            !specifier.startsWith('@astrale-os/ui'),
        )
        .map(packageName),
    ),
  ]
    .map((name) => {
      if (name.startsWith('@astrale-os/ui@')) return name
      assert.ok(registryPackage.dependencies[name], `undeclared registry dependency ${name}`)
      return `${name}@${registryPackage.dependencies[name]}`
    })
    .toSorted((a, b) => {
      if (a.startsWith('@astrale-os/ui@')) return -1
      if (b.startsWith('@astrale-os/ui@')) return 1
      return a.localeCompare(b)
    })
}

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
        const singleton =
          new Set(['./patterns/form/registry.json', './themes/registry.json']).has(include) ||
          (manifest.items.length === 1 &&
            manifest.items[0]?.meta?.provider &&
            manifest.items[0].meta.provider !== '@astrale-os/ui')
        assert.ok(
          manifest.items.length >= (singleton ? 1 : 2),
          `${include} must expose owned items`,
        )
        return manifest.items.map((item) => ({
          ...item,
          declaredPath: path.join(path.dirname(manifestPath), item.files[0].path),
          declaredPaths: item.files.map((file) => path.join(path.dirname(manifestPath), file.path)),
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
  assert.ok(source.includes.length >= 1)
  assert.equal(new Set(source.includes).size, source.includes.length)
  assert.equal(publicRoot.include.length, source.includes.length + 1)
  assert.equal(publicRoot.include[0], 'registry/base/registry.json')
  assert.deepEqual(
    publicRoot.include.slice(1).sort(),
    source.includes.map((include) => `registry/${include.replace(/^\.\//u, '')}`).sort(),
  )

  const familyItems = await readFamilyItems()
  assert.equal(root.items.length, familyItems.length)
  assert.deepEqual(
    root.items.map((item) => item.name).sort(),
    familyItems.map((item) => item.name).sort(),
  )
  assert.equal(new Set(root.items.map((item) => item.name)).size, root.items.length)
  assert.equal(
    new Set(root.items.map((item) => item.meta.canonicalAddress)).size,
    root.items.length,
  )
  const targetSources = new Map()
  for (const item of familyItems) {
    for (let index = 0; index < item.files.length; index += 1) {
      const file = item.files[index]
      const sources = targetSources.get(file.target) ?? new Set()
      sources.add((await readFile(item.declaredPaths[index])).toString('hex'))
      targetSources.set(file.target, sources)
    }
  }
  for (const [target, sources] of targetSources) {
    assert.equal(sources.size, 1, `${target} must have one exact source across all owning items`)
  }
})

test('every registry item is independently bounded, controlled, and safe to install', async () => {
  const items = await readFamilyItems()
  for (const item of items) {
    const isTheme = item.meta.canonicalAddress.startsWith('theme/')
    const isComponent = item.meta.canonicalAddress.startsWith('component/')
    const isVariant = item.meta.provider === '@astrale-os/ui'
    assert.match(item.name, /^(?:component|pattern|block|theme)-[a-z0-9-]+$/u)
    assert.match(
      item.meta.canonicalAddress,
      /^(?:component\/[a-z0-9-]+(?:\/[a-z0-9-]+)?|(?:pattern|block)\/[a-z0-9-]+\/[a-z0-9-/]+|theme\/[a-z0-9-]+)$/u,
    )
    assert.equal(
      item.type,
      isTheme ? 'registry:theme' : isComponent ? 'registry:component' : 'registry:block',
    )
    assert.ok(item.files.length >= 1)

    const file = item.files[0]
    assert.match(
      file.path,
      isTheme
        ? /^[a-z0-9-]+\.css$/u
        : isVariant
          ? /[a-z0-9-]+\.tsx?$/u
          : /^(?:[a-z0-9-]+\/)?[a-z0-9-]+\.tsx?$/u,
    )
    for (let index = 0; index < item.files.length; index += 1) {
      assertSafeRelative(item.files[index].path)
      assertSafeRelative(item.files[index].target)
      assert.match(
        item.files[index].target,
        isTheme
          ? /^components\/astrale\/theme\//u
          : index === 0
            ? /^components\/astrale\/components\//u
            : /^(?:components\/(?:astrale\/components|ui)|hooks|lib|utils|assets)\//u,
      )
      await stat(item.declaredPaths[index])
    }

    const itemSource = await readFile(item.declaredPath, 'utf8')
    if (isTheme) {
      assert.deepEqual(item.dependencies, ['@astrale-os/ui@^0.3.0-beta.0'])
      assert.match(itemSource, /Consumer-owned after installation/u)
      assert.match(
        itemSource,
        new RegExp(`\\[data-ui-theme=['"]${item.meta.canonicalAddress.slice(6)}['"]\\]`),
      )
      assert.match(itemSource, /--ui-primary:/u)
      assert.match(itemSource, /--ui-font-heading:/u)
      assert.match(itemSource, /--ui-motion-standard:/u)
      continue
    }
    if (isVariant) {
      assert.equal(item.meta.source, '@astrale-os/ui')
      assert.equal(item.meta.license, 'MIT')
      assert.deepEqual(Object.keys(item.meta).sort(), [
        'canonicalAddress',
        'license',
        'provider',
        'source',
      ])
      assert.ok(item.dependencies.includes('@astrale-os/ui@^0.3.0-beta.0'))
      continue
    }
    if (isComponent && item.meta.provider === '@shadcn') {
      const upstream = provenanceByAddress.get(item.meta.upstreamAddress)
      assert.ok(upstream, `${item.name} has no exact provenance owner`)
      assert.equal(item.meta.upstreamAddress, `@shadcn/${item.meta.canonicalAddress.slice(10)}`)
      assert.equal(item.meta.upstreamDigest, upstream.sourceDigest)
      assert.equal(item.meta.canonicalAddress, upstream.owner)
      assert.equal(item.declaredPath, upstream.implementation)
      assert.equal(item.meta.adaptation, 'imports-only')
      const itemSources = await Promise.all(
        item.declaredPaths.map((declaredPath) => readFile(declaredPath, 'utf8')),
      )
      const styling = item.css
        ? Object.keys(item.css).flatMap((rule) => /["']([^"']+)["']/u.exec(rule)?.[1] ?? [])
        : []
      assert.deepEqual(item.dependencies, componentDependencies(itemSources.join('\n'), styling))
      continue
    }
    if (item.meta.provider && item.meta.provider !== '@astrale-os/ui') {
      const exactProofs = externalProvenances.filter(
        ({ value }) =>
          value.provider === item.meta.provider &&
          value.upstreamAddress === item.meta.upstreamAddress &&
          value.sourceDigest === item.meta.upstreamDigest,
      )
      assert.equal(exactProofs.length, 1, `${item.name} must have one exact provider proof`)
      const external = exactProofs[0].value
      const catalogOwner = coreCatalog.find(
        (entry) => entry.source === external.upstreamAddress,
      )?.address
      assert.equal(item.meta.canonicalAddress, external.owner ?? catalogOwner)
      assert.equal(item.meta.adaptation, external.adaptation ?? 'imports-only')
      const provenImplementations = externalProvenances
        .filter(({ value }) => value.owner === item.meta.canonicalAddress)
        .flatMap(({ value }) => Object.values(value.files ?? {}))
        .flatMap((file) =>
          file && typeof file === 'object' && typeof file.implementation === 'string'
            ? [file.implementation]
            : [],
        )
        .toSorted()
      if (provenImplementations.length > 0) {
        assert.deepEqual([...new Set(provenImplementations)], item.declaredPaths.toSorted())
      } else {
        assert.equal(item.files.length, Object.keys(external.files ?? {}).length)
      }
      const itemSources = await Promise.all(
        item.declaredPaths.map((declaredPath) => readFile(declaredPath, 'utf8')),
      )
      const styling = item.css
        ? Object.keys(item.css).flatMap((rule) => /["']([^"']+)["']/u.exec(rule)?.[1] ?? [])
        : []
      assert.deepEqual(item.dependencies, componentDependencies(itemSources.join('\n'), styling))
      continue
    }
    assert.deepEqual(item.dependencies, ['@astrale-os/ui@^0.3.0-beta.0'])
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
    const presentationOnly = new Set(['pattern/message/bubble-basic'])
    if (!presentationOnly.has(item.meta.canonicalAddress)) {
      const declaredActions = [
        ...itemSource.matchAll(/\b(on[A-Z][A-Za-z]+)\??\s*\([^)]*\)\s*:/gu),
      ].map((match) => match[1])
      assert.ok(
        declaredActions.length > 0,
        `${item.name} must declare injected application actions`,
      )
      assert.ok(
        declaredActions.some(
          (action) => [...itemSource.matchAll(new RegExp(`\\b${action}\\b`, 'gu'))].length >= 3,
        ),
        `${item.name} must consume an injected application action`,
      )
    }
  }
})

test('registry guards reject traversal and observe every executable import form', () => {
  for (const target of [
    '../escape.tsx',
    'components/astrale/components/../../escape.tsx',
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

test('externally sourced compositions are exact admitted intake owners', async () => {
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const addresses = root.items.map((item) => item.meta.canonicalAddress)
  assert.deepEqual(
    addresses.filter((address) => address.startsWith('theme/')),
    ['theme/observatory'],
  )
  const externalOwners = root.items
    .filter(
      (item) =>
        item.meta.provider &&
        item.meta.provider !== '@astrale-os/ui' &&
        /^(?:pattern|block)\//u.test(item.meta.canonicalAddress),
    )
    .map((item) => item.meta.canonicalAddress)
    .toSorted()
  const admittedOwners = upstreamLedger.entries
    .filter(
      (entry) =>
        entry.decision.status === 'admitted' && /^(?:pattern|block)\//u.test(entry.decision.owner),
    )
    .map((entry) => entry.decision.owner)
  assert.deepEqual(externalOwners, [...new Set(admittedOwners)].toSorted())
  for (const removed of removedCanonicalAddresses) assert.equal(addresses.includes(removed), false)
})

test('registry source tree is closed to included manifests and declared implementations', async () => {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  const includedCompositionManifests = source.includes
    .filter((include) => /^\.\/(?:blocks|patterns)\//u.test(include))
    .map((include) => path.join('registry', include.replace(/^\.\//u, '')))
    .sort()
  const compositionFiles = [
    ...(await filesUnder('registry/blocks')),
    ...(await filesUnder('registry/patterns')),
  ]
  assert.deepEqual(
    compositionFiles.filter((file) => file.endsWith('/registry.json')).sort(),
    includedCompositionManifests,
  )
  const declaredImplementations = (await readFamilyItems())
    .filter((item) => /^(?:registry\/blocks|registry\/patterns)\//u.test(item.declaredPath))
    .flatMap((item) => item.declaredPaths)
    .sort()
  assert.deepEqual(
    compositionFiles
      .filter(
        (file) =>
          /\.tsx?$/u.test(file) && !file.endsWith('.preview.tsx') && !file.endsWith('.fixture.ts'),
      )
      .sort(),
    declaredImplementations,
  )
  for (const removedRoot of [
    'registry/blocks/application-shell',
    'registry/blocks/communication',
    'registry/blocks/data-management',
    'registry/blocks/onboarding',
    'registry/blocks/settings',
    'registry/patterns/chart',
    'registry/patterns/data-table',
    'registry/patterns/questionnaire',
    'registry/patterns/sidebar',
    'registry/patterns/typography',
    'registry/patterns/form/native.tsx',
    'registry/patterns/form/native.preview.tsx',
  ]) {
    await assert.rejects(stat(removedRoot), { code: 'ENOENT' })
  }
})

test('every built install item is exact current source rather than stale generated output', async () => {
  for (const item of await readFamilyItems()) {
    const built = JSON.parse(await readFile(`registry/public/r/${item.name}.json`, 'utf8'))
    for (const field of ['name', 'type', 'title', 'description']) {
      assert.equal(built[field], item[field], `${item.name} stale ${field}`)
    }
    assert.deepEqual(built.dependencies, item.dependencies, `${item.name} stale dependencies`)
    assert.deepEqual(built.registryDependencies, item.registryDependencies)
    assert.deepEqual(built.css, item.css)
    assert.deepEqual(built.meta, item.meta, `${item.name} stale metadata`)
    assert.equal(built.files.length, item.files.length)
    for (let index = 0; index < item.files.length; index += 1) {
      assert.equal(built.files[index].type, item.files[index].type)
      assert.equal(built.files[index].target, item.files[index].target)
      assert.equal(built.files[index].content, await readFile(item.declaredPaths[index], 'utf8'))
    }
  }
})

test('public registry leaves are the exact built catalog with no removed endpoint', async () => {
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const base = JSON.parse(await readFile('registry/base/registry.json', 'utf8'))
  const publicRegistry = JSON.parse(await readFile('registry/public/r/registry.json', 'utf8'))
  assert.deepEqual(publicRegistry, root)
  assert.deepEqual(
    (await readdir('registry/public/r')).filter((file) => file.endsWith('.json')).sort(),
    [
      ...base.items.map((item) => `${item.name}.json`),
      ...root.items.map((item) => `${item.name}.json`),
      'registry.json',
    ].sort(),
  )
  for (const address of removedCanonicalAddresses) {
    await assert.rejects(stat(`registry/public/r/${address.replaceAll('/', '-')}.json`), {
      code: 'ENOENT',
    })
  }
})
