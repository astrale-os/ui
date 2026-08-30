import assert from 'node:assert/strict'
import { mkdtemp, readFile, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createCandidateCheckpoint, verifyCandidateCheckpoint } from './candidate-checkpoint.mjs'

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-checkpoint-'))
  await writeFile(path.join(root, 'candidate.patch'), 'patch bytes')
  await writeFile(path.join(root, 'source.json'), '{"source":true}')
  const checkpoint = await createCandidateCheckpoint({
    root,
    request: 'https://github.com/astrale-os/ui/issues/123',
    attempt: 'ui-request:123:attempt:1',
    objectiveSha256: 'a'.repeat(64),
    baseSha: 'b'.repeat(40),
    patch: 'candidate.patch',
    sourceEvidence: 'source.json',
    provider: 'github-actions-codex',
    model: 'gpt-5.6-luna',
    reasoningEffort: 'max',
    escalation: 0,
    qualificationState: 'failed',
    plan: 'family-scoped',
    diagnostic: 'focused test failed',
    createdAt: '2026-08-30T00:00:00.000Z',
    expiresAt: '2026-09-29T00:00:00.000Z',
  })
  const manifest = path.join(root, 'checkpoint.json')
  await writeFile(manifest, `${JSON.stringify(checkpoint)}\n`)
  return { root, manifest, checkpoint }
}

test('round-trips one cumulative checkpoint with exact digests', async () => {
  const { root, manifest, checkpoint } = await fixture()
  const verified = await verifyCandidateCheckpoint({
    root,
    manifest,
    request: 'https://github.com/astrale-os/ui/issues/123',
    objectiveSha256: 'a'.repeat(64),
    baseSha: 'b'.repeat(40),
    now: new Date('2026-08-31T00:00:00.000Z'),
  })
  assert.deepEqual(verified, checkpoint)
})

test('rejects tampering, expiry, objective drift, and base mismatch', async () => {
  const { root, manifest } = await fixture()
  await writeFile(path.join(root, 'candidate.patch'), 'tampered')
  await assert.rejects(
    verifyCandidateCheckpoint({
      root,
      manifest,
      request: 'https://github.com/astrale-os/ui/issues/123',
      objectiveSha256: 'a'.repeat(64),
      baseSha: 'b'.repeat(40),
      now: new Date('2026-08-31T00:00:00.000Z'),
    }),
    /digest mismatch/u,
  )
  const parsed = JSON.parse(await readFile(manifest, 'utf8'))
  await writeFile(path.join(root, 'candidate.patch'), 'patch bytes')
  await assert.rejects(
    verifyCandidateCheckpoint({
      root,
      manifest,
      request: 'https://github.com/astrale-os/ui/issues/123',
      objectiveSha256: 'c'.repeat(64),
      baseSha: parsed.baseSha,
      now: new Date('2026-08-31T00:00:00.000Z'),
    }),
    /objective/u,
  )
  await assert.rejects(
    verifyCandidateCheckpoint({
      root,
      manifest,
      request: 'https://github.com/astrale-os/ui/issues/123',
      objectiveSha256: parsed.objectiveSha256,
      baseSha: 'd'.repeat(40),
      now: new Date('2026-08-31T00:00:00.000Z'),
    }),
    /base/u,
  )
  await assert.rejects(
    verifyCandidateCheckpoint({
      root,
      manifest,
      request: 'https://github.com/astrale-os/ui/issues/123',
      objectiveSha256: parsed.objectiveSha256,
      baseSha: parsed.baseSha,
      now: new Date('2026-10-01T00:00:00.000Z'),
    }),
    /expired/u,
  )
})

test('admits a changed objective only when the trusted caller intentionally continues the patch', async () => {
  const { root, manifest, checkpoint } = await fixture()
  const continued = await verifyCandidateCheckpoint({
    root,
    manifest,
    request: checkpoint.request,
    baseSha: checkpoint.baseSha,
    now: new Date('2026-08-31T00:00:00.000Z'),
  })
  assert.equal(continued.objectiveSha256, checkpoint.objectiveSha256)
  await assert.rejects(
    verifyCandidateCheckpoint({
      root,
      manifest,
      request: 'https://github.com/astrale-os/ui/issues/999',
      baseSha: checkpoint.baseSha,
      now: new Date('2026-08-31T00:00:00.000Z'),
    }),
    /request does not match/u,
  )
})

test('runtime verification rejects schema-invalid escalation metadata', async () => {
  const { root, manifest, checkpoint } = await fixture()
  await writeFile(
    manifest,
    JSON.stringify({ ...checkpoint, worker: { ...checkpoint.worker, escalation: 2 } }),
  )
  await assert.rejects(
    verifyCandidateCheckpoint({
      root,
      manifest,
      request: checkpoint.request,
      baseSha: checkpoint.baseSha,
      now: new Date('2026-08-31T00:00:00.000Z'),
    }),
    /schema admission failed/u,
  )
})

test('does not admit traversal paths', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-checkpoint-'))
  await writeFile(path.join(root, 'candidate.patch'), 'patch')
  await assert.rejects(
    createCandidateCheckpoint({
      root,
      request: 'https://github.com/astrale-os/ui/issues/1',
      attempt: 'attempt',
      objectiveSha256: 'a'.repeat(64),
      baseSha: 'b'.repeat(40),
      patch: '../candidate.patch',
      provider: 'github-actions-codex',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'max',
      escalation: 0,
      qualificationState: 'pending',
      plan: 'global-ui',
      createdAt: '2026-08-30T00:00:00.000Z',
      expiresAt: '2026-09-29T00:00:00.000Z',
    }),
    /safe relative file path/u,
  )
})

test('does not admit an escalation beyond the sole fallback', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-checkpoint-'))
  await writeFile(path.join(root, 'candidate.patch'), 'patch')
  await assert.rejects(
    createCandidateCheckpoint({
      root,
      request: 'https://github.com/astrale-os/ui/issues/1',
      attempt: 'attempt',
      objectiveSha256: 'a'.repeat(64),
      baseSha: 'b'.repeat(40),
      patch: 'candidate.patch',
      provider: 'github-actions-codex',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'max',
      escalation: 2,
      qualificationState: 'pending',
      plan: 'global-ui',
      createdAt: '2026-08-30T00:00:00.000Z',
      expiresAt: '2026-09-29T00:00:00.000Z',
    }),
    /escalation/u,
  )
})

test('rejects a patch above the 16 MiB checkpoint boundary', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-checkpoint-'))
  const patch = path.join(root, 'candidate.patch')
  await writeFile(patch, 'x')
  await truncate(patch, 16 * 1024 * 1024 + 1)
  await assert.rejects(
    createCandidateCheckpoint({
      root,
      request: 'https://github.com/astrale-os/ui/issues/1',
      attempt: 'attempt',
      objectiveSha256: 'a'.repeat(64),
      baseSha: 'b'.repeat(40),
      patch: 'candidate.patch',
      provider: 'github-actions-codex',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'max',
      escalation: 0,
      qualificationState: 'pending',
      plan: 'global-ui',
      createdAt: '2026-08-30T00:00:00.000Z',
      expiresAt: '2026-09-29T00:00:00.000Z',
    }),
    /size is outside/u,
  )
})
