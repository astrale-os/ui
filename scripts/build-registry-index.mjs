import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const source = JSON.parse(await readFile('registry/registry.source.json', 'utf8'))
const items = []
const coreCatalog = []

for (const include of source.includes) {
  const relativeManifest = include.replace(/^\.\//u, '')
  const manifest = JSON.parse(await readFile(path.join('registry', relativeManifest), 'utf8'))
  const directory = path.posix.dirname(relativeManifest)
  for (const item of manifest.items) {
    if (!relativeManifest.startsWith('providers/')) {
      const [classification, family] = item.meta.canonicalAddress.split('/')
      coreCatalog.push({
        address: item.meta.canonicalAddress,
        title: item.title,
        classification,
        family,
        ...('upstreamAddress' in item.meta ? { source: item.meta.upstreamAddress } : {}),
        variantCount: 0,
      })
    }
    items.push({
      ...item,
      files: item.files.map((file) => ({
        ...file,
        path: path.posix.join('registry', directory, file.path),
      })),
    })
  }
}

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: source.name,
  homepage: 'https://github.com/astrale-os/ui',
  items,
}

const formatted = JSON.stringify(registry, null, 2).replace(
  /"dependencies": \[\n\s+"([^"]+)"\n\s+\]/gu,
  '"dependencies": ["$1"]',
)
await writeFile('registry/registry.json', `${formatted}\n`, 'utf8')
coreCatalog.sort((left, right) => left.address.localeCompare(right.address))
const coreFamilies = Map.groupBy(coreCatalog, (item) => `${item.classification}/${item.family}`)
for (const items of coreFamilies.values()) {
  for (const item of items) item.variantCount = items.length
}
await writeFile('registry/core-catalog.json', `${JSON.stringify(coreCatalog, null, 2)}\n`, 'utf8')
const format = spawnSync(
  'pnpm',
  ['exec', 'oxfmt', '--write', 'registry/registry.json', 'registry/core-catalog.json'],
  { encoding: 'utf8' },
)
assert.equal(format.status, 0, format.stderr || format.stdout)
