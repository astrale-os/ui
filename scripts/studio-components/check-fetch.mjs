import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'

const inventory = JSON.parse(await readFile('.history/studio-components-v1/inventory.json', 'utf8'))
const report = JSON.parse(await readFile('.internal/shadcn-studio/fetch-all.json', 'utf8'))

function digest(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

assert.equal(report.expected, inventory.length)
assert.equal(report.fetched, inventory.length)
assert.deepEqual(
  new Set(report.items.map((item) => item.upstreamId)),
  new Set(inventory.map((item) => item.upstreamId)),
  'fetched registry IDs differ from workbook IDs',
)
const snapshots = (await readdir('.internal/shadcn-studio/upstream/base-nova'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/u, ''))
assert.deepEqual(new Set(snapshots), new Set(inventory.map((item) => item.upstreamId)))

let fileCount = 0
const targets = new Map()
for (const record of report.items) {
  const file = `.internal/shadcn-studio/upstream/base-nova/${record.upstreamId}.json`
  const body = await readFile(file, 'utf8')
  assert.equal(digest(body), record.responseDigest, `${record.upstreamId} response digest drift`)
  const item = JSON.parse(body)
  assert.equal(item.name, record.upstreamId)
  assert.equal(item.files.length, record.files.length)
  for (const [index, source] of item.files.entries()) {
    fileCount += 1
    assert.equal(digest(source.content), record.files[index].sourceDigest)
    assert.equal(source.path, record.files[index].path)
    assert.equal(source.target, record.files[index].target)
    assert.equal(source.type, record.files[index].type)
    const existing = targets.get(source.target)
    if (existing) {
      assert.equal(
        existing.digest,
        digest(source.content),
        `unequal shared target ${source.target}`,
      )
      existing.items.push(item.name)
    } else {
      targets.set(source.target, { digest: digest(source.content), items: [item.name] })
    }
  }
}

console.log(
  `PASS Studio fetch closure (${report.items.length} items, ${fileCount} files, ${targets.size} unique targets)`,
)
