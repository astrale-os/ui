import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'

const cli = '4.18.0'
const provider = '@shadcn'
const limit = 100
const retrievedAt = '2026-08-26'
const profile = { base: 'base', style: 'nova', resolvedStyle: 'base-nova' }
const profileCwd = 'tooling/upstream/shadcn-profile'
const provenancePath = 'tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json'
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'))
const owned = new Map(provenance.components.map((item) => [item.address, item]))

function search(cwd) {
  const items = []
  for (let offset = 0; ; offset += limit) {
    const args = ['dlx', `shadcn@${cli}`, 'search', provider]
    if (cwd) args.push('--cwd', cwd)
    args.push('--limit', String(limit), '--offset', String(offset), '--json')
    const result = spawnSync('pnpm', args, { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    const page = JSON.parse(result.stdout)
    items.push(...page.items)
    if (!page.pagination.hasMore) break
  }
  return items
}

const globalItems = search()
const profileItems = search(profileCwd)
assert.equal(globalItems.length, 471)
assert.equal(profileItems.length, 216)
const items = [
  ...new Map(
    [...globalItems, ...profileItems].map((item) => [item.addCommandArgument, item]),
  ).values(),
]
assert.equal(items.length, 543)
assert.equal(new Set(items.map((item) => item.addCommandArgument)).size, items.length)

function classify(type) {
  switch (type) {
    case 'registry:ui':
    case 'registry:component':
      return 'component'
    case 'registry:block':
      return 'block'
    case 'registry:example':
      return 'specimen'
    case 'registry:hook':
    case 'registry:lib':
      return 'headless'
    case 'registry:font':
    case 'registry:style':
    case 'registry:theme':
      return 'theme-asset'
    case 'registry:internal':
      return 'internal'
    default:
      throw new Error(`unclassified upstream type: ${type}`)
  }
}

const crosswalk = items.map((item) => {
  const source = owned.get(item.addCommandArgument)
  if (source) {
    return {
      provider,
      address: item.addCommandArgument,
      name: item.name,
      upstreamType: item.type,
      astraleKind: 'component',
      disposition: source.disposition,
      owner: source.owner,
      proof: source.source,
    }
  }
  if (item.addCommandArgument === '@shadcn/form') {
    return {
      provider,
      address: item.addCommandArgument,
      name: item.name,
      upstreamType: item.type,
      astraleKind: 'component',
      disposition: 'no-files-for-profile',
    }
  }
  if (item.type === 'registry:hook' && item.name === 'use-mobile') {
    return {
      provider,
      address: item.addCommandArgument,
      name: item.name,
      upstreamType: item.type,
      astraleKind: 'headless',
      disposition: 'owned-registry-component',
      owner: provenance.hooks[0].implementation,
      proof: provenance.hooks[0].source,
    }
  }
  return {
    provider,
    address: item.addCommandArgument,
    name: item.name,
    upstreamType: item.type,
    astraleKind: classify(item.type),
    disposition: 'upstream-reference',
  }
})

const snapshot = {
  provider,
  tool: 'shadcn',
  version: cli,
  profile,
  retrievedAt,
  total: items.length,
  scopes: {
    global: globalItems.length,
    'base-nova': profileItems.length,
    union: items.length,
  },
  counts: Object.fromEntries(
    [...Map.groupBy(items, (item) => item.type)]
      .map(([type, values]) => [type, values.length])
      .toSorted(),
  ),
  items,
}
const document = {
  $schema: '../../../../../schemas/upstream-crosswalk.schema.json',
  provider,
  snapshot: { tool: 'shadcn', version: cli, profile, retrievedAt },
  items: crosswalk,
}

await writeFile(
  'tooling/upstream/providers/shadcn/4.18.0/catalog.json',
  `${JSON.stringify(snapshot, null, 2)}\n`,
)
await writeFile(
  'tooling/upstream/providers/shadcn/4.18.0/crosswalk.json',
  `${JSON.stringify(document, null, 2)}\n`,
)
