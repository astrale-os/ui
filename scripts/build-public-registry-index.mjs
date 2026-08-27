import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

const source = JSON.parse(await readFile('registry/registry.json', 'utf8'))
assert.equal(new Set(source.items.map((item) => item.name)).size, source.items.length)
assert.equal(
  new Set(source.items.map((item) => item.meta?.canonicalAddress).filter(Boolean)).size,
  source.items.filter((item) => item.meta?.canonicalAddress).length,
)

await writeFile('registry/public/r/registry.json', `${JSON.stringify(source, null, 2)}\n`)
console.log(`PASS public registry index (${source.items.length} items)`)
