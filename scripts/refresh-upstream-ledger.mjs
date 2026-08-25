import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ledgerPath = '.history/public-ui-v1/upstream-components.tsv'
const compatibility = JSON.parse(await readFile('tooling/compatibility.json', 'utf8'))

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name)
        return entry.isDirectory() ? files(target) : target
      }),
    )
  ).flat()
}

async function ownerDigest(owner) {
  const segments = owner.split('/')
  const directory =
    segments[0] === 'package'
      ? path.join('packages/ui/src', ...segments.slice(1))
      : path.join('registry/patterns', segments[1])
  assert.equal((await stat(directory)).isDirectory(), true, `missing owner: ${owner}`)
  const hash = createHash('sha256')
  for (const file of (await files(directory)).toSorted()) {
    hash.update(path.relative(directory, file))
    hash.update('\0')
    hash.update(await readFile(file))
    hash.update('\0')
  }
  return 'sha256:' + hash.digest('hex')
}

const current = await readFile(ledgerPath, 'utf8')
const [, ...lines] = current.trimEnd().split('\n')
const output = [
  [
    'surface',
    'docs_index_url',
    'registry_4_18',
    'legacy_d460f71',
    'target_owner',
    'intake_status',
    'shadcn_cli',
    'base',
    'base_ui',
    'style',
    'tailwind',
    'retrieved_at',
    'content_digest',
    'notes',
  ].join('\t'),
]

for (const line of lines) {
  const columns = line.split('\t')
  const [surface, docsUrl, registry, legacy, owner] = columns
  const notes = columns.length === 7 ? columns[6] : columns.at(-1)
  assert.ok(surface && docsUrl && registry && legacy && owner && notes)
  assert.match(owner, /^(?:package|pattern)\//u)
  output.push(
    [
      surface,
      docsUrl,
      registry,
      legacy,
      owner,
      owner.startsWith('package/') ? 'owned-runtime' : 'owned-registry',
      compatibility.shadcn,
      compatibility.base,
      compatibility.baseUi,
      compatibility.style,
      compatibility.tailwind,
      '2026-08-25',
      await ownerDigest(owner),
      notes,
    ].join('\t'),
  )
}

const next = output.join('\n') + '\n'
if (process.argv.includes('--check')) {
  assert.equal(current, next, `${ledgerPath} is stale; run pnpm intake:ledger`)
} else {
  await writeFile(ledgerPath, next)
}
