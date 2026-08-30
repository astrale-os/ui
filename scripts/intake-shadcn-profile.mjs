import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  adaptShadcnControlSizing,
  shadcnControlRevision,
} from '../tooling/upstream/adapters/shadcn-control-sizing.mjs'
import {
  adaptShadcnComponent,
  adaptShadcnRegistryComponent,
} from '../tooling/upstream/adapters/shadcn.mjs'

const intakeRoot = process.argv[2]
assert.ok(intakeRoot, 'usage: node scripts/intake-shadcn-profile.mjs <shadcn-project>')

const packageJson = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const existingOwners = Object.fromEntries(
  Object.entries(packageJson.exports)
    .filter(
      ([name]) => name.startsWith('./') && !name.endsWith('.css') && name !== './package.json',
    )
    .map(([name, value]) => {
      const exported = name.slice(2)
      const target = value.import.match(/^\.\/dist\/(.+)\/index\.js$/u)?.[1]
      return [exported, target]
    })
    .filter((entry) => entry[1]),
)

const registryComponents = new Set([
  'attachment',
  'bubble',
  'calendar',
  'carousel',
  'chart',
  'combobox',
  'marker',
  'message',
  'message-scroller',
  'questionnaire',
  'sidebar',
  'sonner',
])

const owners = { ...existingOwners }
delete owners['class-name']

const sourceDirectory = path.join(intakeRoot, 'src/components/ui')
const snapshotDirectory = 'tooling/upstream/providers/shadcn/4.18.0/base-nova/components'
const hookSourcePath = path.join(intakeRoot, 'src/hooks/use-mobile.ts')
const hookSnapshot = 'tooling/upstream/providers/shadcn/4.18.0/base-nova/hooks/use-mobile.ts'
const hookTarget = 'registry/components/sidebar/use-mobile.ts'
const styleSourcePath = path.join(intakeRoot, 'node_modules/shadcn/dist/tailwind.css')
const styleSnapshot = 'tooling/upstream/providers/shadcn/4.18.0/base-nova/styles/tailwind.css'
const styleTarget = 'packages/ui/src/theme/shadcn-tailwind.css'
const provenance = []

function digest(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

function adapt(content) {
  return adaptShadcnComponent(content, (name) => owners[name])
}

const emittedNames = (await readdir(sourceDirectory))
  .filter((name) => name.endsWith('.tsx'))
  .map((name) => name.replace(/\.tsx$/u, ''))
  .toSorted()
const snapshotNames = (await readdir(snapshotDirectory))
  .filter((name) => name.endsWith('.tsx'))
  .map((name) => name.replace(/\.tsx$/u, ''))
  .toSorted()
const actualProfile = JSON.parse(await readFile(path.join(intakeRoot, 'components.json'), 'utf8'))
const expectedProfile = JSON.parse(
  await readFile('tooling/upstream/shadcn-profile/components.json', 'utf8'),
)
assert.deepEqual(
  actualProfile,
  expectedProfile,
  'intake project is not the pinned Base/Nova profile',
)
assert.deepEqual(
  emittedNames,
  snapshotNames,
  'intake source inventory differs from the pinned proof',
)

const sources = new Map()
for (const name of emittedNames) {
  const source = await readFile(path.join(sourceDirectory, `${name}.tsx`), 'utf8')
  assert.equal(
    source,
    await readFile(path.join(snapshotDirectory, `${name}.tsx`), 'utf8'),
    `@shadcn/${name} differs from the pinned 4.18.0 Base/Nova source`,
  )
  sources.set(name, source)
}
const hookSource = await readFile(hookSourcePath, 'utf8')
assert.equal(hookSource, await readFile(hookSnapshot, 'utf8'), 'use-mobile source drifted')
const styleSource = await readFile(styleSourcePath, 'utf8')
assert.equal(styleSource, await readFile(styleSnapshot, 'utf8'), 'shadcn Tailwind support drifted')

for (const name of emittedNames) {
  const source = sources.get(name)
  assert.ok(source)
  const snapshotPath = path.join(snapshotDirectory, `${name}.tsx`)
  const registryOwned = registryComponents.has(name)
  const owner = owners[name]
  assert.ok(registryOwned || owner, `no Astrale disposition for @shadcn/${name}`)
  const targetPath = registryOwned
    ? path.join('registry/components', name, `${name}.tsx`)
    : path.join('packages/ui/src', owner, 'index.tsx')
  const adapted = registryOwned
    ? adaptShadcnRegistryComponent(source)
    : adaptShadcnControlSizing(name, adapt(source))
  const revision = shadcnControlRevision(name)

  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, adapted)
  provenance.push({
    provider: '@shadcn',
    address: `@shadcn/${name}`,
    upstreamType: 'registry:ui',
    profile: { cli: '4.18.0', base: 'base', style: 'nova', resolvedStyle: 'base-nova' },
    source: snapshotPath,
    sourceDigest: digest(source),
    owner: registryOwned ? `component/${name}` : `@astrale-os/ui/${name}`,
    implementation: targetPath,
    adaptation: revision?.adaptation ?? 'imports-only',
    ...(revision ? { adaptationNotes: revision.notes } : {}),
    disposition: registryOwned ? 'owned-registry-component' : 'owned-runtime',
  })
}

await mkdir(path.dirname(hookTarget), { recursive: true })
await writeFile(hookTarget, hookSource)

await writeFile(styleTarget, styleSource)

await writeFile(
  'tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json',
  `${JSON.stringify(
    {
      provider: '@shadcn',
      retrievedAt: '2026-08-26',
      profile: { cli: '4.18.0', base: 'base', style: 'nova', resolvedStyle: 'base-nova' },
      components: provenance,
      aliases: [
        {
          address: '@shadcn/form',
          upstreamType: 'registry:ui',
          disposition: 'no-files-for-profile',
        },
      ],
      hooks: [
        {
          provider: '@shadcn',
          address: '@shadcn/use-mobile',
          upstreamType: 'registry:hook',
          source: hookSnapshot,
          sourceDigest: digest(hookSource),
          implementation: hookTarget,
          adaptation: 'verbatim',
        },
      ],
      styles: [
        {
          provider: '@shadcn',
          address: 'shadcn/tailwind.css',
          upstreamType: 'registry:style-support',
          source: styleSnapshot,
          sourceDigest: digest(styleSource),
          implementation: styleTarget,
          adaptation: 'verbatim',
        },
      ],
    },
    null,
    2,
  )}\n`,
)
