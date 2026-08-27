import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { glob, readFile } from 'node:fs/promises'

import { moduleSpecifiers, proveImportTransformScope, restoreSource } from './adaptation.mjs'

const inventory = JSON.parse(await readFile('.history/studio-components-v1/inventory.json', 'utf8'))
const resolution = JSON.parse(await readFile('.internal/shadcn-studio/resolve-all.json', 'utf8'))
const adaptation = JSON.parse(await readFile('.internal/shadcn-studio/adapt-all.json', 'utf8'))
const packageDocument = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const runtimeOwners = new Set(
  Object.keys(packageDocument.exports)
    .filter((entry) => entry.startsWith('./') && !entry.endsWith('.css'))
    .map((entry) => entry.slice(2)),
)

function digest(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

const expectedIds = new Set(inventory.map((item) => item.upstreamId))
const expectedAddresses = new Set(inventory.map((item) => item.canonicalAddress))
assert.deepEqual(new Set(resolution.items.map((item) => item.upstreamId)), expectedIds)
assert.deepEqual(new Set(adaptation.items.map((item) => item.upstreamId)), expectedIds)
assert.deepEqual(new Set(adaptation.items.map((item) => item.canonicalAddress)), expectedAddresses)

const resolvedById = new Map(resolution.items.map((item) => [item.upstreamId, item]))
const transformScope = proveImportTransformScope(runtimeOwners)
assert.deepEqual(transformScope.adapted, transformScope.expected)
const manifestsByAddress = new Map()
for await (const file of glob('.internal/shadcn-studio/manifests/**/*.json')) {
  const manifest = JSON.parse(await readFile(file, 'utf8'))
  for (const item of manifest.items) {
    assert.ok(
      !manifestsByAddress.has(item.meta.canonicalAddress),
      `duplicate manifest ${item.meta.canonicalAddress}`,
    )
    manifestsByAddress.set(item.meta.canonicalAddress, item)
  }
}
assert.deepEqual(new Set(manifestsByAddress.keys()), expectedAddresses)
let sourceFiles = 0
const expectedGeneratedFiles = new Set()
for (const item of adaptation.items) {
  const resolved = resolvedById.get(item.upstreamId)
  assert.ok(resolved)
  assert.deepEqual(
    new Set(
      item.files.filter((file) => file.authority === 'item').map((file) => file.sourceTarget),
    ),
    new Set(resolved.files.map((file) => file.target)),
    `${item.upstreamId}: resolved item files`,
  )
  const manifest = manifestsByAddress.get(item.canonicalAddress)
  assert.ok(manifest, `${item.upstreamId}: missing manifest`)
  assert.deepEqual(
    manifest.files,
    item.files.map(({ path, type, target }) => ({ path, type, target })),
    `${item.upstreamId}: manifest files`,
  )
  const installTargets = new Set(
    manifest.files.map((file) => file.target.replace(/\.(?:tsx?|jsx?|css)$/u, '')),
  )
  const registryDependencies = new Set(manifest.registryDependencies ?? [])
  for (const file of item.files) {
    sourceFiles += 1
    const resolvedBody = await readFile(file.sourceSnapshot, 'utf8')
    const implementation = await readFile(`${item.implementationRoot}/${file.path}`, 'utf8')
    assert.equal(digest(resolvedBody), file.resolvedDigest)
    assert.equal(digest(implementation), file.implementationDigest)
    expectedGeneratedFiles.add(`${item.implementationRoot}/${file.path}`)
    assert.equal(
      restoreSource(
        implementation,
        { upstreamId: item.upstreamId, target: file.sourceTarget },
        runtimeOwners,
      ),
      resolvedBody,
      `${item.upstreamId}: source fidelity`,
    )
    for (const specifier of moduleSpecifiers(implementation).filter((value) =>
      value.startsWith('@/'),
    )) {
      const target = specifier.slice(2)
      const dependency = target.split('/').at(-1)
      assert.ok(
        installTargets.has(target) || (dependency && registryDependencies.has(dependency)),
        `${item.upstreamId}: unresolved install alias ${specifier}`,
      )
    }
  }
  const preview = await readFile(item.preview, 'utf8')
  expectedGeneratedFiles.add(item.preview)
  assert.equal(
    preview,
    `export { default } from './${item.upstreamId}'\n\nexport const preview = {\n  source: '@ss-components/${item.upstreamId}',\n} as const\n`,
  )
}

const actualGeneratedFiles = new Set()
for await (const file of glob('.internal/shadcn-studio/registry/**/*.{ts,tsx,js,jsx,css}')) {
  actualGeneratedFiles.add(file)
}
assert.deepEqual(
  actualGeneratedFiles,
  expectedGeneratedFiles,
  'generated registry filesystem closure',
)

console.log(
  `PASS Studio adaptation closure (${adaptation.items.length} items, ${sourceFiles} source files, ${adaptation.items.length} canonical previews)`,
)
