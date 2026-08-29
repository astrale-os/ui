import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { acceptSourceManifest, fetchSourceEvidence } from './source-evidence.mjs'

const revision = '6cdef1109364760536410d5325ac0d1af451196e'
const source = `https://raw.githubusercontent.com/rutopio/shadcn-heatmap/${revision}/src/status.tsx`

test('admits exact immutable raw GitHub evidence from a structured agent envelope', () => {
  assert.deepEqual(
    acceptSourceManifest({
      structured_output: { sources: [{ url: source, path: 'upstream/status.tsx' }] },
    }),
    { sources: [{ url: source, path: 'upstream/status.tsx' }] },
  )
})

test('rejects mutable, redirected, widened, duplicate, and escaping evidence', () => {
  const malformed = [
    { sources: [{ url: source.replace(revision, 'main'), path: 'source.tsx' }] },
    { sources: [{ url: source.replace('raw.githubusercontent.com', 'github.com'), path: 'x' }] },
    { sources: [{ url: `${source}?token=secret`, path: 'x' }] },
    { sources: [{ url: source, path: '../x' }] },
    { sources: [{ url: source, path: 'x', digest: 'invented' }] },
    {
      sources: [
        { url: source, path: 'x' },
        { url: source, path: 'x' },
      ],
    },
  ]
  for (const value of malformed) assert.throws(() => acceptSourceManifest(value), TypeError)
})

test('fetches bounded public bytes without credentials and writes a digest index', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'ui-request-source-evidence-'))
  const calls = []
  const index = await fetchSourceEvidence(
    { sources: [{ url: source, path: 'upstream/status.tsx' }] },
    root,
    {
      fetcher: async (url, options) => {
        calls.push({ url, options })
        return new Response('export const status = true\n', {
          status: 200,
          headers: { 'content-length': '27' },
        })
      },
    },
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.redirect, 'manual')
  assert.equal('authorization' in calls[0].options.headers, false)
  assert.equal(
    await readFile(path.join(root, 'upstream/status.tsx'), 'utf8'),
    'export const status = true\n',
  )
  assert.equal(index.sources[0].bytes, 27)
  assert.match(index.sources[0].sha256, /^[a-f0-9]{64}$/)
  assert.deepEqual(JSON.parse(await readFile(path.join(root, 'index.json'), 'utf8')), index)
})

test('rejects empty discovery and declared or streamed oversized evidence', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'ui-request-source-evidence-'))
  await assert.rejects(() => fetchSourceEvidence({ sources: [] }, root), /no immutable evidence/u)
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources: [{ url: source, path: 'declared' }] }, root, {
        fetcher: async () =>
          new Response('x', { headers: { 'content-length': String(1_048_577) } }),
      }),
    /per-file bound/u,
  )
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources: [{ url: source, path: 'streamed' }] }, root, {
        fetcher: async () => new Response(new Uint8Array(1_048_577)),
      }),
    /per-file bound/u,
  )
})
