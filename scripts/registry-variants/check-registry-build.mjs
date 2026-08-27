import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const registry = JSON.parse(await readFile('registry/variants/registry.json', 'utf8'))
const catalog = JSON.parse(await readFile('registry/variants/catalog.json', 'utf8'))
assert.equal(registry.items.length, 902)
assert.deepEqual(
  new Set(catalog.map((item) => item.address)),
  new Set(registry.items.map((item) => item.meta.canonicalAddress)),
)
const catalogFamilies = Map.groupBy(catalog, (item) => `${item.classification}/${item.family}`)
assert.equal(catalogFamilies.size, 58)
for (const [family, items] of catalogFamilies) {
  assert.equal(
    items.every((item) => item.variantCount === items.length),
    true,
    `${family}: variant count`,
  )
}
const generatedFamilies = await readdir('playground/src/catalog/generated/variant-families')
assert.equal(generatedFamilies.length, catalogFamilies.size)
const generatedIndex = await readFile(
  'playground/src/catalog/generated/variant-families.gen.ts',
  'utf8',
)
for (const family of catalogFamilies.keys()) {
  assert.match(generatedIndex, new RegExp(JSON.stringify(family).replaceAll('/', '\\/'), 'u'))
}

for (const sourceItem of registry.items) {
  const built = JSON.parse(await readFile(`registry/public/r/${sourceItem.name}.json`, 'utf8'))
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
      await readFile(`registry/variants/${sourceFile.path}`, 'utf8'),
      `${sourceItem.name}: built file content`,
    )
  }
}

console.log(
  `PASS variant registry closure (${registry.items.length} items, ${catalogFamilies.size} families)`,
)
