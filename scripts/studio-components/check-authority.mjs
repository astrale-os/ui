import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const root = '.history/studio-components-v1'
const lock = JSON.parse(await readFile(`${root}/authority-lock.json`, 'utf8'))
const extract = JSON.parse(await readFile(`${root}/authority/workbook-extract.json`, 'utf8'))
const inventory = JSON.parse(await readFile(`${root}/inventory.json`, 'utf8'))

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function slug(value) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '')
}

function excelDate(value) {
  assert.equal(typeof value, 'number', 'verified date must be an Excel serial')
  return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000).toISOString().slice(0, 10)
}

const workbook = await readFile(
  `${root}/authority/shadcn_studio_complete_component_registry_2026-08-26.xlsx`,
)
const extractBody = await readFile(`${root}/authority/workbook-extract.json`)
const inventoryBody = await readFile(`${root}/inventory.json`)
assert.equal(sha256(workbook), lock.workbookSha256, 'workbook digest drift')
assert.equal(sha256(extractBody), lock.extractSha256, 'workbook extract digest drift')
assert.equal(sha256(inventoryBody), lock.inventorySha256, 'normalized inventory digest drift')

const sheets = new Map(extract.sheets.map((sheet) => [sheet.name, sheet]))
const sourceRows = sheets.get('Inventory').rows.filter((row) => row.index >= 5)
const auditRows = sheets.get('Families & Audit').rows.filter((row) => row.index >= 5)

const normalized = sourceRows.map(({ index: row, columns }) => {
  const classification = columns.A.toLowerCase()
  const familySlug = slug(columns.B)
  return {
    row,
    classification,
    family: columns.B,
    familySlug,
    variant: columns.C,
    upstreamId: columns.D,
    upstreamAddress: `@ss-components/${columns.D}`,
    command: columns.E,
    baseUi: columns.F === 'Yes',
    radixUi: columns.G === 'Yes',
    animated: columns.H === 'Yes',
    stream: columns.I.toLowerCase(),
    sourceUrl: columns.J,
    verifiedOn: excelDate(columns.K),
    rationale: columns.L,
    canonicalAddress: `${classification}/${familySlug}/${columns.D}`,
  }
})
assert.deepEqual(inventory, normalized, 'normalized inventory differs from workbook cells')
assert.equal(inventory.length, lock.total)
assert.equal(new Set(inventory.map((item) => item.upstreamId)).size, lock.total)
assert.equal(new Set(inventory.map((item) => item.canonicalAddress)).size, lock.total)

const byFamily = Map.groupBy(inventory, (item) => item.family)
const audit = new Map(auditRows.map((row) => [row.columns.A, row.columns]))
assert.equal(byFamily.size, lock.families)
assert.deepEqual(new Set(byFamily.keys()), new Set(audit.keys()))

for (const [family, items] of byFamily) {
  const expected = audit.get(family)
  assert.ok(expected)
  assert.deepEqual(
    items.map((item) => item.variant),
    Array.from({ length: items.length }, (_, index) => index + 1),
    `${family} variants are not continuous`,
  )
  assert.equal(new Set(items.map((item) => item.classification)).size, 1)
  assert.equal(items[0].classification, expected.B.toLowerCase())
  assert.equal(items.length, expected.C)
  assert.equal(items.length, expected.D)
  assert.equal(items.filter((item) => item.animated).length, expected.E)
  assert.equal(items.filter((item) => item.baseUi).length, expected.F)
  assert.equal(items.filter((item) => item.radixUi).length, expected.G)
  assert.equal(expected.H, 'Yes')
  assert.equal(expected.I, 'PASS')
  assert.deepEqual(new Set(items.map((item) => item.sourceUrl)), new Set([expected.J]))
}

const counts = Object.fromEntries(
  [...Map.groupBy(inventory, (item) => item.classification)]
    .map(([kind, items]) => [kind, items.length])
    .toSorted(),
)
assert.deepEqual(counts, { block: 17, component: 737, pattern: 148 })
assert.equal(inventory.filter((item) => item.animated).length, 68)
for (const item of inventory) {
  assert.equal(item.command, `pnpm dlx shadcn@latest add ${item.upstreamAddress}`)
  assert.equal(item.stream, item.animated ? 'animated' : 'standard')
}

console.log(
  `PASS Studio authority (${inventory.length} variants, ${byFamily.size} families, ${counts.component} components, ${counts.pattern} patterns, ${counts.block} blocks, 68 animated)`,
)
