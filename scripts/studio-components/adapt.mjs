import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { adaptSource, moduleSpecifiers, restoreSource } from './adaptation.mjs'

const inventory = JSON.parse(await readFile('.history/studio-components-v1/inventory.json', 'utf8'))
const packageDocument = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const resolutionPackage = JSON.parse(
  await readFile('.internal/shadcn-studio/stage/package.json', 'utf8'),
)
const arguments_ = process.argv.slice(2)
const familyIndex = arguments_.indexOf('--family')
const requestedFamily = familyIndex >= 0 ? arguments_[familyIndex + 1] : undefined
const all = arguments_.includes('--all')
assert.ok(all || requestedFamily, 'usage: pnpm studio:adapt -- --family Accordion | --all')
assert.ok(!(all && requestedFamily), 'choose --family or --all')

const selected = requestedFamily
  ? inventory.filter((item) => item.family.toLowerCase() === requestedFamily.toLowerCase())
  : inventory
assert.ok(selected.length > 0, `unknown family: ${requestedFamily}`)
const internal = '.internal/shadcn-studio'
const selectedIds = new Set(selected.map((item) => item.upstreamId))
const fullResolution = JSON.parse(await readFile(path.join(internal, 'resolve-all.json'), 'utf8'))
const resolution = {
  ...fullResolution,
  items: fullResolution.items.filter((item) => selectedIds.has(item.upstreamId)),
}
assert.deepEqual(
  new Set(resolution.items.map((item) => item.upstreamId)),
  new Set(selected.map((item) => item.upstreamId)),
  'resolution set differs from selected inventory',
)

const runtimeOwners = new Set(
  Object.keys(packageDocument.exports)
    .filter((entry) => entry.startsWith('./') && !entry.endsWith('.css'))
    .map((entry) => entry.slice(2)),
)
const dependencyVersions = {
  ...packageDocument.dependencies,
  ...packageDocument.peerDependencies,
  ...packageDocument.devDependencies,
  ...resolutionPackage.dependencies,
  ...resolutionPackage.devDependencies,
  // Source: https://github.com/shadcnstudio/shadcn-studio/blob/main/package.json
  // These two imports exist in resolved registry source but are omitted from
  // the affected registry items' dependency declarations.
  next: '^15.3.3',
  vaul: '^1.1.2',
}

function digest(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function externalImports(content) {
  const packages = new Set()
  const imports = [
    ...content.matchAll(/^import[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gmu),
    ...content.matchAll(/^import\s+['"]([^'"]+)['"]/gmu),
  ]
  for (const match of imports) {
    const specifier = match[1]
    if (specifier.startsWith('.') || specifier.startsWith('@/')) continue
    packages.add(
      specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0],
    )
  }
  return packages
}

function pinDeclaredDependency(dependency) {
  const versionSeparator = dependency.lastIndexOf('@')
  if (versionSeparator > 0) return dependency
  const version = dependencyVersions[dependency]
  return version ? `${dependency}@${version}` : dependency
}

const resolvedById = new Map(resolution.items.map((item) => [item.upstreamId, item]))
const records = []
const manifests = new Map()
for (const expected of selected) {
  const resolved = resolvedById.get(expected.upstreamId)
  assert.ok(resolved)
  const upstream = JSON.parse(
    await readFile(
      path.join(internal, 'upstream/base-nova', `${expected.upstreamId}.json`),
      'utf8',
    ),
  )
  const directoryKind = `${expected.classification}s`
  const itemRoot = path.join(
    internal,
    'registry',
    directoryKind,
    expected.familySlug,
    expected.upstreamId,
  )
  await mkdir(itemRoot, { recursive: true })
  const files = []
  const dependencies = new Set([
    `@astrale-os/ui@^${packageDocument.version.replace(/-beta\.\d+$/u, '-beta.0')}`,
    ...(upstream.dependencies ?? []).map(pinDeclaredDependency),
  ])
  const sourceQueue = resolved.files.map((source) => ({ ...source, authority: 'item' }))
  const queuedTargets = new Set(sourceQueue.map((source) => source.target))
  for (let sourceIndex = 0; sourceIndex < sourceQueue.length; sourceIndex += 1) {
    const source = sourceQueue[sourceIndex]
    const content = await readFile(source.resolvedSnapshot, 'utf8')
    const context = { upstreamId: expected.upstreamId, target: source.target }
    const adaptationResult = adaptSource(content, context, runtimeOwners)
    const adapted = adaptationResult.content
    assert.equal(
      restoreSource(adapted, context, runtimeOwners),
      content,
      `${expected.upstreamId}: adaptation is not reversible`,
    )
    for (const packageName of externalImports(adapted)) {
      if (packageName === '@astrale-os/ui') continue
      const version = dependencyVersions[packageName]
      assert.ok(version, `${expected.upstreamId}: no pinned version for ${packageName}`)
      dependencies.add(`${packageName}@${version}`)
    }
    for (const specifier of moduleSpecifiers(adapted).filter((value) => value.startsWith('@/'))) {
      const targetBase = specifier.slice(2)
      const candidates = ['', '.tsx', '.ts', '.jsx', '.js'].map((extension) =>
        path.join(internal, 'stage/src', `${targetBase}${extension}`),
      )
      const snapshot = candidates.find((candidate) => existsSync(candidate))
      assert.ok(snapshot, `${expected.upstreamId}: missing stage support for ${specifier}`)
      const target = path
        .relative(path.join(internal, 'stage/src'), snapshot)
        .split(path.sep)
        .join('/')
      if (!queuedTargets.has(target)) {
        queuedTargets.add(target)
        sourceQueue.push({
          target,
          type: 'registry:lib',
          resolvedSnapshot: snapshot,
          authority: 'stage-support',
        })
      }
    }
    const isMain =
      source.authority === 'item' && path.basename(source.target) === `${expected.upstreamId}.tsx`
    const localName = isMain ? `${expected.upstreamId}.tsx` : path.join('support', source.target)
    const implementation = path.join(itemRoot, localName)
    await mkdir(path.dirname(implementation), { recursive: true })
    await writeFile(implementation, adapted)
    files.push({
      path: localName.split(path.sep).join('/'),
      type: source.type,
      target: isMain ? `components/astrale/${expected.canonicalAddress}.tsx` : source.target,
      sourceTarget: source.target,
      resolvedDigest: digest(content),
      implementationDigest: digest(adapted),
      sourceSnapshot: source.resolvedSnapshot,
      authority: source.authority,
      adaptation:
        adaptationResult.transformations.filter((value) => value.endsWith('-bridge')).join('+') ||
        (adapted === content ? 'verbatim' : 'imports-only'),
      main: isMain,
    })
  }
  assert.equal(files.filter((file) => file.main).length, 1, `${expected.upstreamId}: main file`)
  const previewPath = path.join(itemRoot, `${expected.upstreamId}.preview.tsx`)
  await writeFile(
    previewPath,
    `export { default } from './${expected.upstreamId}'\n\nexport const preview = {\n  source: '${expected.upstreamAddress}',\n} as const\n`,
  )
  const unresolvedRegistryDependencies = (upstream.registryDependencies ?? []).filter(
    (dependency) =>
      dependency !== 'utils' &&
      !runtimeOwners.has(dependency) &&
      !files.some(
        (file) => path.basename(file.target).replace(/\.(?:tsx?|jsx?)$/u, '') === dependency,
      ),
  )
  const manifestItem = {
    name: `studio-${expected.classification}-${expected.familySlug}-${expected.upstreamId}`,
    type: expected.classification === 'component' ? 'registry:component' : 'registry:block',
    title: upstream.title,
    description: upstream.description,
    dependencies: [...dependencies].sort(),
    ...(unresolvedRegistryDependencies.length > 0
      ? { registryDependencies: unresolvedRegistryDependencies }
      : {}),
    files: files.map(({ path: filePath, type, target }) => ({ path: filePath, type, target })),
    ...(upstream.css ? { css: upstream.css } : {}),
    meta: {
      canonicalAddress: expected.canonicalAddress,
      ownership: 'licensed-internal-source',
      provider: '@ss-components',
      upstreamAddress: expected.upstreamAddress,
      profile: 'base-nova',
      adaptation: files.some((file) => file.adaptation.endsWith('-bridge'))
        ? [
            ...new Set(
              files.map((file) => file.adaptation).filter((value) => value.endsWith('-bridge')),
            ),
          ].join('+')
        : files.every((file) => file.adaptation === 'verbatim')
          ? 'verbatim'
          : 'imports-only',
    },
  }
  const manifestKey = `${directoryKind}/${expected.familySlug}`
  const familyManifest = manifests.get(manifestKey) ?? []
  familyManifest.push(manifestItem)
  manifests.set(manifestKey, familyManifest)
  records.push({
    upstreamId: expected.upstreamId,
    canonicalAddress: expected.canonicalAddress,
    implementationRoot: itemRoot,
    preview: previewPath,
    files,
  })
}

for (const [key, items] of manifests) {
  const manifestPath = path.join(internal, 'manifests', `${key}.json`)
  await mkdir(path.dirname(manifestPath), { recursive: true })
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: `astrale-studio-${key.replaceAll('/', '-')}`,
        homepage: 'https://shadcnstudio.com',
        items,
      },
      null,
      2,
    )}\n`,
  )
}

records.sort((left, right) => left.upstreamId.localeCompare(right.upstreamId))
const reportPath = path.join(
  internal,
  requestedFamily ? `adapt-${selected[0].familySlug}.json` : 'adapt-all.json',
)
await writeFile(
  reportPath,
  `${JSON.stringify({ expected: selected.length, adapted: records.length, items: records }, null, 2)}\n`,
)
console.log(`PASS Studio adaptation (${records.length}/${selected.length}; ${reportPath})`)
