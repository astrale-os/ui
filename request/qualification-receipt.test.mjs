import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createQualificationReceipt, verifyQualificationReceipt } from './qualification-receipt.mjs'

test('binds qualification evidence to the exact commit, tree, and artifact bytes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-receipt-'))
  const files = Object.fromEntries(
    await Promise.all(
      ['package', 'registry', 'catalog'].map(async (name) => {
        const file = path.join(root, name)
        await writeFile(file, name)
        return [name, file]
      }),
    ),
  )
  const receipt = await createQualificationReceipt({
    commitSha: 'a'.repeat(40),
    treeSha: 'b'.repeat(40),
    packageFile: files.package,
    registryFile: files.registry,
    catalogFile: files.catalog,
    browserShards: [1, 2, 3, 4].map((index) => ({ index, total: 4, state: 'passed' })),
    toolchain: { node: '24.7.0', pnpm: '12.0.0', playwright: '1.61.1' },
    qualifiedAt: '2026-08-30T00:00:00.000Z',
  })
  const manifest = path.join(root, 'receipt.json')
  await writeFile(manifest, JSON.stringify(receipt))
  assert.deepEqual(
    await verifyQualificationReceipt({
      receipt: manifest,
      commitSha: 'a'.repeat(40),
      treeSha: 'b'.repeat(40),
      packageFile: files.package,
      registryFile: files.registry,
      catalogFile: files.catalog,
    }),
    receipt,
  )
  await assert.rejects(
    verifyQualificationReceipt({
      receipt: manifest,
      commitSha: 'c'.repeat(40),
      treeSha: receipt.treeSha,
      packageFile: files.package,
      registryFile: files.registry,
      catalogFile: files.catalog,
    }),
    /exact revision/u,
  )
  await assert.rejects(
    verifyQualificationReceipt({
      receipt: manifest,
      commitSha: receipt.commitSha,
      treeSha: 'd'.repeat(40),
      packageFile: files.package,
      registryFile: files.registry,
      catalogFile: files.catalog,
    }),
    /exact revision/u,
  )
  await writeFile(files.catalog, 'changed')
  await assert.rejects(
    verifyQualificationReceipt({
      receipt: manifest,
      commitSha: 'a'.repeat(40),
      treeSha: 'b'.repeat(40),
      packageFile: files.package,
      registryFile: files.registry,
      catalogFile: files.catalog,
    }),
    /catalog digest mismatch/u,
  )
})

test('requires the exact complete successful shard set during creation and verification', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-receipt-'))
  const files = {}
  for (const name of ['package', 'registry', 'catalog']) {
    files[name] = path.join(root, name)
    await writeFile(files[name], name)
  }
  const common = {
    commitSha: 'a'.repeat(40),
    treeSha: 'b'.repeat(40),
    packageFile: files.package,
    registryFile: files.registry,
    catalogFile: files.catalog,
    toolchain: { node: '24', pnpm: '12', playwright: '1.61' },
    qualifiedAt: '2026-08-30T00:00:00.000Z',
  }
  await assert.rejects(
    createQualificationReceipt({
      ...common,
      browserShards: [{ index: 1, total: 4, state: 'passed' }],
    }),
    /four browser shards/u,
  )
  await assert.rejects(
    createQualificationReceipt({
      ...common,
      browserShards: [1, 2, 3, 4].map((index) => ({
        index,
        total: 4,
        state: index === 4 ? 'failed' : 'passed',
      })),
    }),
    /shards are incomplete/u,
  )
  const receipt = await createQualificationReceipt({
    ...common,
    browserShards: [1, 2, 3, 4].map((index) => ({ index, total: 4, state: 'passed' })),
  })
  receipt.browserShards[3].index = 3
  const manifest = path.join(root, 'receipt.json')
  await writeFile(manifest, JSON.stringify(receipt))
  await assert.rejects(
    verifyQualificationReceipt({
      receipt: manifest,
      commitSha: receipt.commitSha,
      treeSha: receipt.treeSha,
      packageFile: files.package,
      registryFile: files.registry,
      catalogFile: files.catalog,
    }),
    /shards are incomplete/u,
  )
})
