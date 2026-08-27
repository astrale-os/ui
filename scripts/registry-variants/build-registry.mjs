import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const items = []
for (const classification of ['components', 'patterns', 'blocks']) {
  const directory = `registry/variants/manifests/${classification}`
  for (const name of (await readdir(directory)).toSorted()) {
    const manifest = JSON.parse(await readFile(path.join(directory, name), 'utf8'))
    const family = name.replace(/\.json$/u, '')
    for (const item of manifest.items) {
      const itemId = item.meta.canonicalAddress.split('/').at(-1)
      items.push({
        ...item,
        files: item.files.map((file) => ({
          ...file,
          path: path.posix.join('source', classification, family, itemId, file.path),
        })),
      })
    }
  }
}

items.sort((left, right) => left.meta.canonicalAddress.localeCompare(right.meta.canonicalAddress))
if (items.length !== 902) throw new Error(`Expected 902 variants, found ${items.length}.`)
if (new Set(items.map((item) => item.meta.canonicalAddress)).size !== items.length)
  throw new Error('Variant addresses must be unique.')
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'astrale-variants',
  homepage: 'https://github.com/astrale-os/ui',
  items,
}
const familyGroups = Map.groupBy(items, (item) =>
  item.meta.canonicalAddress.split('/').slice(0, 2).join('/'),
)
const generatedRoot = 'playground/src/catalog/generated'
const generatedFamiliesRoot = path.join(generatedRoot, 'variant-families')
await rm(generatedFamiliesRoot, { recursive: true, force: true })
await mkdir(generatedFamiliesRoot, { recursive: true })
const familyLoaderCases = []
const familyPresenceCases = []
for (const [familyKey, familyItems] of [...familyGroups].sort(([left], [right]) =>
  left.localeCompare(right),
)) {
  const [classification, family] = familyKey.split('/')
  const sourceKind = classification === 'component' ? 'components' : `${classification}s`
  const generatedName = `${classification}-${family}.gen.ts`
  const sourceRoot = `../../../../../registry/variants/source/${sourceKind}/${family}`
  const loaderCases = familyItems.map((item) => {
    const itemId = item.meta.canonicalAddress.split('/').at(-1)
    const previewPath = `${sourceRoot}/${itemId}/${itemId}.preview.tsx`
    return `    case ${JSON.stringify(`${item.meta.canonicalAddress}#default`)}:\n      return modules[${JSON.stringify(previewPath)}]!()`
  })
  await writeFile(
    path.join(generatedFamiliesRoot, generatedName),
    `import type { PreviewModule } from '../../previews.js'\n\nconst modules = import.meta.glob<PreviewModule>(${JSON.stringify(`${sourceRoot}/**/*.preview.tsx`)})\n\nexport function loadPreview(id: string): Promise<PreviewModule> {\n  switch (id) {\n${loaderCases.join('\n')}\n    default:\n      return Promise.reject(new Error(\`Unknown variant preview \${id}.\`))\n  }\n}\n`,
  )
  familyLoaderCases.push(
    `    case ${JSON.stringify(familyKey)}:\n      return import('./variant-families/${generatedName.replace(/\.ts$/u, '.js')}')`,
  )
  familyPresenceCases.push(`    case ${JSON.stringify(familyKey)}:`)
}
await writeFile(
  path.join(generatedRoot, 'variant-families.gen.ts'),
  `// Generated from registry/variants/manifests. Do not edit.\nexport function loadGeneratedVariantFamily(family: string) {\n  switch (family) {\n${familyLoaderCases.join('\n')}\n    default:\n      return Promise.reject(new Error(\`Unknown variant family \${family}.\`))\n  }\n}\n\nexport function hasGeneratedVariantFamily(family: string) {\n  switch (family) {\n${familyPresenceCases.join('\n')}\n      return true\n    default:\n      return false\n  }\n}\n`,
)
await writeFile('registry/variants/registry.json', `${JSON.stringify(registry, null, 2)}\n`)
await writeFile(
  'registry/variants/catalog.json',
  `${JSON.stringify(
    items.map((item) => {
      const [classification, family] = item.meta.canonicalAddress.split('/')
      return {
        address: item.meta.canonicalAddress,
        title: item.title,
        classification,
        family,
        source: item.meta.source,
        variantCount: familyGroups.get(`${classification}/${family}`)?.length ?? 0,
      }
    }),
    null,
    2,
  )}\n`,
)
console.log(`PASS variant registry source (${items.length} items, ${familyGroups.size} families)`)
