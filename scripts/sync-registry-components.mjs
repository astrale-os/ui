import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const provenance = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', 'utf8'),
)
const rootPackage = JSON.parse(await readFile('package.json', 'utf8'))
const runtimePackage = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const registryPackage = JSON.parse(await readFile('registry/package.json', 'utf8'))
const versions = {
  ...rootPackage.devDependencies,
  ...rootPackage.dependencies,
  ...runtimePackage.peerDependencies,
  ...runtimePackage.dependencies,
  ...registryPackage.dependencies,
}

function packageName(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/')
  return specifier.split('/')[0]
}

function externalDependencies(source) {
  const specifiers = [
    ...source.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/gu),
    ...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gmu),
  ].map((match) => match[1])
  const packages = new Set(
    specifiers
      .filter(
        (specifier) =>
          specifier !== 'react' &&
          !specifier.startsWith('.') &&
          !specifier.startsWith('@astrale-os/ui'),
      )
      .map(packageName),
  )
  return [...packages].toSorted().map((name) => {
    assert.ok(versions[name], `missing declared version for registry dependency ${name}`)
    return `${name}@${versions[name]}`
  })
}

const items = []
for (const component of provenance.components.filter(
  (entry) => entry.disposition === 'owned-registry-component',
)) {
  const name = component.address.slice('@shadcn/'.length)
  const source = await readFile(component.implementation, 'utf8')
  const nested = name === 'sidebar'
  const files = [
    {
      path: component.implementation.replace(/^registry\/components\//u, ''),
      type: 'registry:component',
      target: nested
        ? `components/astrale/component/${name}/${name}.tsx`
        : `components/astrale/component/${name}.tsx`,
    },
  ]
  if (name === 'sidebar') {
    files.push({
      path: 'sidebar/use-mobile.ts',
      type: 'registry:hook',
      target: 'components/astrale/component/sidebar/use-mobile.ts',
    })
  }
  items.push({
    name: `component-${name}`,
    type: 'registry:component',
    title: `Component · ${name}`,
    description: `Exact @shadcn/${name} Base Nova source with import-only Astrale adaptation.`,
    dependencies: ['@astrale-os/ui@^0.3.0-beta.0', ...externalDependencies(source)],
    files,
    meta: {
      canonicalAddress: `component/${name}`,
      ownership: 'consumer-source',
      provider: '@shadcn',
      upstreamAddress: component.address,
      upstreamDigest: component.sourceDigest,
      adaptation: component.adaptation,
    },
  })
}

assert.equal(items.length, 12)
await writeFile(
  'registry/components/registry.json',
  `${JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'astrale-components',
      homepage: 'https://github.com/astrale-os/ui',
      items,
    },
    null,
    2,
  )}\n`,
)
const format = spawnSync('pnpm', ['exec', 'oxfmt', '--write', 'registry/components'], {
  encoding: 'utf8',
})
assert.equal(format.status, 0, format.stderr || format.stdout)
