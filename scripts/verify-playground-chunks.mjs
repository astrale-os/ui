import assert from 'node:assert/strict'
import { glob, readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = 'playground/dist'
const requirePublic = process.argv.includes('--public')
const requireStudio = process.argv.includes('--studio')
assert.notEqual(
  requirePublic,
  requireStudio,
  'usage: verify-playground-chunks.mjs --public | --studio',
)
const manifest = JSON.parse(await readFile(path.join(dist, '.vite/manifest.json'), 'utf8'))
const entry = Object.values(manifest).find((item) => item.isEntry)
assert.ok(entry, 'playground manifest has no entry')

const initialSources = new Set()
function visitInitial(source) {
  if (initialSources.has(source)) return
  initialSources.add(source)
  for (const dependency of manifest[source]?.imports ?? []) visitInitial(dependency)
}
const entrySource = Object.entries(manifest).find(([, item]) => item === entry)?.[0]
assert.ok(entrySource, 'playground entry has no source key')
visitInitial(entrySource)

const previewEntries = Object.entries(manifest).filter(([source]) =>
  /(?:packages\/ui\/previews|registry\/(?:components|patterns|blocks)|registry\/variants\/source\/(?:components|patterns|blocks))\/.+\.preview\.tsx$/u.test(
    source,
  ),
)
const previewSources = []
for await (const source of glob(
  ['packages/ui/previews/**/*.preview.tsx', 'registry/**/*.preview.tsx'],
  { cwd: process.cwd() },
)) {
  previewSources.push(source)
}
const studioEntryCount = previewEntries.filter(([source]) =>
  source.includes('registry/variants/source/'),
).length
if (requirePublic) assert.equal(studioEntryCount, 0, 'public build contains Studio preview chunks')
if (requireStudio) assert.equal(studioEntryCount, 902, 'Studio build preview closure')
const familyLoaderEntries = Object.keys(manifest).filter((source) =>
  source.includes('src/catalog/generated/variant-families/'),
)
if (requirePublic)
  assert.equal(familyLoaderEntries.length, 0, 'public build contains variant family loaders')
if (requireStudio) {
  const manifestFamilies = []
  for await (const source of glob('registry/variants/manifests/**/*.json')) {
    manifestFamilies.push(source)
  }
  assert.equal(
    familyLoaderEntries.length,
    manifestFamilies.length,
    'one generated loader per variant family',
  )
  assert.equal(
    familyLoaderEntries.every((source) => manifest[source].isDynamicEntry === true),
    true,
    'variant family loaders must be dynamic entries',
  )
  assert.equal(
    familyLoaderEntries.some((source) => initialSources.has(source)),
    false,
    'variant family loaders must not be reachable from the initial graph',
  )
}
const admittedPreviewSources =
  studioEntryCount > 0
    ? previewSources
    : previewSources.filter((source) => !source.startsWith('registry/variants/source/'))
const studioPreviewCount = admittedPreviewSources.filter((source) =>
  source.startsWith('registry/variants/source/'),
).length
if (requirePublic) assert.equal(studioPreviewCount, 0, 'public build admitted Studio sources')
if (requireStudio) assert.equal(studioPreviewCount, 902, 'Studio source preview closure')
assert.equal(
  previewEntries.length,
  admittedPreviewSources.length,
  'every discovered preview must retain a lazy manifest entry',
)
assert.equal(
  previewEntries.every(([, item]) => item.isDynamicEntry === true),
  true,
  'preview entries must be dynamic',
)
assert.equal(
  previewEntries.some(([source]) => initialSources.has(source)),
  false,
  'preview modules must not be reachable from the initial graph',
)
const themeStudioSource = Object.keys(manifest).find((source) =>
  source.endsWith('src/theme/studio.tsx'),
)
assert.ok(themeStudioSource, 'theme studio must retain a production manifest entry')
assert.equal(manifest[themeStudioSource].isDynamicEntry, true, 'theme studio must load on demand')
assert.equal(
  initialSources.has(themeStudioSource),
  false,
  'theme studio must not be reachable from the initial graph',
)

const initialJavaScript = await Promise.all(
  [...initialSources]
    .map((source) => manifest[source]?.file)
    .filter((file) => file?.endsWith('.js'))
    .map((file) => readFile(path.join(dist, file))),
)
const entryBytes = initialJavaScript.reduce((total, file) => total + file.length, 0)
const entryGzipBytes = initialJavaScript.reduce((total, file) => total + gzipSync(file).length, 0)
const initialSource = Buffer.concat(initialJavaScript).toString('utf8')
assert.doesNotMatch(
  initialSource,
  /registry\/variants\/source\/.+?\.preview\.tsx/u,
  'initial graph must not contain individual variant preview loader paths',
)
const entryBudget = studioPreviewCount > 0 ? 1_000_000 : 650_000
assert.ok(
  entryBytes < entryBudget,
  `initial playground JavaScript ${entryBytes} exceeds the ${entryBudget}-byte ${studioPreviewCount > 0 ? 'internal Studio' : 'public'} budget`,
)

console.log(
  `PASS playground chunks (${previewEntries.length} dynamic previews, ${studioPreviewCount} adapted Studio previews, ${familyLoaderEntries.length} family loaders, ${entryBytes} raw / ${entryGzipBytes} gzip initial bytes; ${entryBudget} raw budget)`,
)
