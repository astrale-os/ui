import assert from 'node:assert/strict'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const inventory = JSON.parse(await readFile('.history/studio-components-v1/inventory.json', 'utf8'))
const items = []
for (const classification of ['components', 'patterns', 'blocks']) {
  const directory = `.internal/shadcn-studio/manifests/${classification}`
  for (const name of (await readdir(directory)).toSorted()) {
    const manifest = JSON.parse(await readFile(path.join(directory, name), 'utf8'))
    const family = name.replace(/\.json$/u, '')
    for (const item of manifest.items) {
      const upstreamId = item.meta.upstreamAddress.slice('@ss-components/'.length)
      items.push({
        ...item,
        files: item.files.map((file) => ({
          ...file,
          path: path.posix.join(
            '.internal/shadcn-studio/registry',
            classification,
            family,
            upstreamId,
            file.path,
          ),
        })),
      })
    }
  }
}

items.sort((left, right) => left.meta.canonicalAddress.localeCompare(right.meta.canonicalAddress))
assert.equal(items.length, inventory.length)
assert.deepEqual(
  new Set(items.map((item) => item.meta.canonicalAddress)),
  new Set(inventory.map((item) => item.canonicalAddress)),
)
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'astrale-studio-internal',
  homepage: 'https://shadcnstudio.com',
  items,
}
await writeFile('.internal/shadcn-studio/registry.json', `${JSON.stringify(registry, null, 2)}\n`)
await writeFile(
  '.internal/shadcn-studio/catalog.json',
  `${JSON.stringify(
    items.map((item) => ({
      address: item.meta.canonicalAddress,
      title: item.title,
      source: item.meta.upstreamAddress,
    })),
    null,
    2,
  )}\n`,
)
console.log(`PASS Studio registry source (${items.length} items)`)
