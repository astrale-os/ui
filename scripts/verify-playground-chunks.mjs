import assert from 'node:assert/strict'
import { glob, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const dist = 'playground/dist'
const requirePublic = process.argv.includes('--public')
const requireStudio = process.argv.includes('--studio')
assert.ok(!(requirePublic && requireStudio), 'choose --public or --studio')
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
  /(?:packages\/ui\/previews|registry\/(?:components|patterns|blocks)|\.internal\/shadcn-studio\/registry\/(?:components|patterns|blocks))\/.+\.preview\.tsx$/u.test(
    source,
  ),
)
const previewSources = []
for await (const source of glob(
  [
    'packages/ui/previews/**/*.preview.tsx',
    'registry/**/*.preview.tsx',
    '.internal/shadcn-studio/registry/**/*.preview.tsx',
  ],
  { cwd: process.cwd() },
)) {
  previewSources.push(source)
}
const studioEntryCount = previewEntries.filter(([source]) =>
  source.includes('.internal/shadcn-studio/registry/'),
).length
if (requirePublic) assert.equal(studioEntryCount, 0, 'public build contains Studio preview chunks')
if (requireStudio) assert.equal(studioEntryCount, 902, 'Studio build preview closure')
const admittedPreviewSources =
  studioEntryCount > 0
    ? previewSources
    : previewSources.filter((source) => !source.startsWith('.internal/shadcn-studio/registry/'))
const studioPreviewCount = admittedPreviewSources.filter((source) =>
  source.startsWith('.internal/shadcn-studio/registry/'),
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

const entryBytes = (
  await Promise.all(
    [...initialSources]
      .map((source) => manifest[source]?.file)
      .filter((file) => file?.endsWith('.js'))
      .map((file) => stat(path.join(dist, file))),
  )
).reduce((total, file) => total + file.size, 0)
const entryBudget = studioPreviewCount > 0 ? 1_000_000 : 600_000
assert.ok(
  entryBytes < entryBudget,
  `initial playground JavaScript ${entryBytes} exceeds the ${entryBudget}-byte ${studioPreviewCount > 0 ? 'internal Studio' : 'public'} budget`,
)

console.log(
  `PASS playground chunks (${previewEntries.length} dynamic previews, ${studioPreviewCount} Studio previews, ${entryBytes}/${entryBudget} entry bytes)`,
)
