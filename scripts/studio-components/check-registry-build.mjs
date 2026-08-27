import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const registry = JSON.parse(await readFile('.internal/shadcn-studio/registry.json', 'utf8'))
const catalog = JSON.parse(await readFile('.internal/shadcn-studio/catalog.json', 'utf8'))
assert.equal(registry.items.length, 902)
assert.deepEqual(
  new Set(catalog.map((item) => item.address)),
  new Set(registry.items.map((item) => item.meta.canonicalAddress)),
)

for (const sourceItem of registry.items) {
  const built = JSON.parse(
    await readFile(`.internal/shadcn-studio/public/r/${sourceItem.name}.json`, 'utf8'),
  )
  for (const field of [
    'name',
    'type',
    'title',
    'description',
    'dependencies',
    'registryDependencies',
    'css',
    'meta',
  ]) {
    assert.deepEqual(built[field], sourceItem[field], `${sourceItem.name}: built ${field}`)
  }
  assert.equal(built.files.length, sourceItem.files.length, `${sourceItem.name}: built files`)
  for (const [index, sourceFile] of sourceItem.files.entries()) {
    const builtFile = built.files[index]
    assert.deepEqual(
      { type: builtFile.type, target: builtFile.target },
      { type: sourceFile.type, target: sourceFile.target },
      `${sourceItem.name}: built file contract`,
    )
    assert.equal(
      builtFile.content,
      await readFile(sourceFile.path, 'utf8'),
      `${sourceItem.name}: built file content`,
    )
  }
}

console.log(`PASS Studio built registry closure (${registry.items.length} items)`)
