import assert from 'node:assert/strict'
import { glob, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const dist = 'playground/dist'
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
  /(?:packages\/ui\/previews|registry\/(?:components|patterns|blocks))\/.+\.preview\.tsx$/u.test(
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
assert.equal(
  previewEntries.length,
  previewSources.length,
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

const entryBytes = (
  await Promise.all(
    [...initialSources]
      .map((source) => manifest[source]?.file)
      .filter((file) => file?.endsWith('.js'))
      .map((file) => stat(path.join(dist, file))),
  )
).reduce((total, file) => total + file.size, 0)
assert.ok(
  entryBytes < 600_000,
  `initial playground JavaScript ${entryBytes} exceeds the 600000-byte migration budget`,
)

console.log(
  `PASS playground chunks (${previewEntries.length} dynamic previews, ${entryBytes} entry bytes)`,
)
