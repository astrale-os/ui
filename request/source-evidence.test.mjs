import assert from 'node:assert/strict'
import { access, chmod, lstat, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  acceptSourceManifest,
  fetchSourceEvidence,
  verifySourceEvidence,
} from './source-evidence.mjs'

const revision = '6cdef1109364760536410d5325ac0d1af451196e'
const source = `https://raw.githubusercontent.com/rutopio/shadcn-heatmap/${revision}/src/status.tsx`

async function evidenceRoot() {
  return path.join(await mkdtemp(path.join(tmpdir(), 'ui-request-source-evidence-')), 'evidence')
}

test('admits exact immutable raw GitHub evidence from a structured agent envelope', () => {
  assert.deepEqual(
    acceptSourceManifest({
      structured_output: { sources: [{ url: source, path: 'upstream/status.tsx' }] },
    }),
    { sources: [{ url: source, path: 'upstream/status.tsx' }] },
  )
  assert.deepEqual(acceptSourceManifest({ sources: [{ url: source, path: 'source.tsx' }] }), {
    sources: [{ url: source, path: 'source.tsx' }],
  })
  assert.deepEqual(
    acceptSourceManifest({
      result: JSON.stringify({ sources: [{ url: source, path: 'result.tsx' }] }),
    }),
    { sources: [{ url: source, path: 'result.tsx' }] },
  )
  assert.throws(() => acceptSourceManifest({ result: '{' }), TypeError)
})

test('rejects mutable, redirected, widened, duplicate, and escaping evidence', () => {
  const malformed = [
    { sources: [{ url: source.replace(revision, 'main'), path: 'source.tsx' }] },
    { sources: [{ url: source.replace('raw.githubusercontent.com', 'github.com'), path: 'x' }] },
    { sources: [{ url: `${source}?token=secret`, path: 'x' }] },
    { sources: [{ url: source, path: '../x' }] },
    { sources: [{ url: source, path: 'index.json' }] },
    {
      sources: [
        { url: source, path: 'upstream' },
        { url: source, path: 'upstream/status.tsx' },
      ],
    },
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
  const root = await evidenceRoot()
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
  assert.deepEqual(
    [...new Headers(calls[0].options.headers).entries()],
    [
      ['accept', 'application/octet-stream'],
      ['user-agent', 'astrale-ui-request-evidence/1'],
    ],
  )
  assert.equal(
    await readFile(path.join(root, 'upstream/status.tsx'), 'utf8'),
    'export const status = true\n',
  )
  assert.equal(index.sources[0].bytes, 27)
  assert.equal(
    index.sources[0].sha256,
    '46db18bffef1e8cf9c74a0b603c8f4489599618ac3132e37925546a2c65c83de',
  )
  assert.deepEqual(JSON.parse(await readFile(path.join(root, 'index.json'), 'utf8')), index)
  assert.deepEqual(await verifySourceEvidence(root), index)
  assert.equal((await lstat(root)).mode & 0o777, 0o500)
  assert.equal((await lstat(path.join(root, 'upstream'))).mode & 0o777, 0o500)
  assert.equal((await lstat(path.join(root, 'upstream/status.tsx'))).mode & 0o777, 0o400)
  assert.equal((await lstat(path.join(root, 'index.json'))).mode & 0o777, 0o400)

  await chmod(path.join(root, 'upstream/status.tsx'), 0o600)
  await writeFile(path.join(root, 'upstream/status.tsx'), 'tampered\n')
  await assert.rejects(() => verifySourceEvidence(root), /not sealed/u)
})

test('rejects empty discovery and declared or streamed oversized evidence', async () => {
  const root = await evidenceRoot()
  await assert.rejects(() => fetchSourceEvidence({ sources: [] }, root), /no immutable evidence/u)
  const existing = await mkdtemp(path.join(tmpdir(), 'ui-request-source-evidence-existing-'))
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources: [{ url: source, path: 'source.tsx' }] }, existing, {
        fetcher: async () => new Response('source'),
      }),
    { code: 'EEXIST' },
  )
  const declaredRoot = await evidenceRoot()
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources: [{ url: source, path: 'declared' }] }, declaredRoot, {
        fetcher: async () =>
          new Response('x', { headers: { 'content-length': String(1_048_577) } }),
      }),
    /per-file bound/u,
  )
})

test('rejects aggregate overflow and redirects without writing an index', async () => {
  const aggregateRoot = await evidenceRoot()
  const sources = Array.from({ length: 5 }, (_, index) => ({
    url: source,
    path: `source-${index}.tsx`,
  }))
  let call = 0
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources }, aggregateRoot, {
        fetcher: async () => {
          call += 1
          return new Response(new Uint8Array(call === 5 ? 1 : 1_048_576))
        },
      }),
    /total bound/u,
  )
  await assert.rejects(() => access(path.join(aggregateRoot, 'index.json')), { code: 'ENOENT' })

  const redirectRoot = await evidenceRoot()
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources: [{ url: source, path: 'redirect.tsx' }] }, redirectRoot, {
        fetcher: async () =>
          new Response(null, {
            status: 302,
            headers: { location: 'https://example.com/untrusted.tsx' },
          }),
      }),
    /status 302/u,
  )
  await assert.rejects(() => access(path.join(redirectRoot, 'redirect.tsx')), { code: 'ENOENT' })
  await assert.rejects(() => access(path.join(redirectRoot, 'index.json')), { code: 'ENOENT' })
})

test('verifier rejects injected inventory and symlinks', async () => {
  async function createEvidence() {
    const root = await evidenceRoot()
    await fetchSourceEvidence({ sources: [{ url: source, path: 'source.tsx' }] }, root, {
      fetcher: async () => new Response('source'),
    })
    return root
  }

  const extraRoot = await createEvidence()
  await chmod(extraRoot, 0o700)
  await writeFile(path.join(extraRoot, 'extra.tsx'), 'extra', { mode: 0o400 })
  await chmod(extraRoot, 0o500)
  await assert.rejects(() => verifySourceEvidence(extraRoot), /inventory differs/u)

  const symlinkRoot = await createEvidence()
  await chmod(symlinkRoot, 0o700)
  await symlink(path.join(symlinkRoot, 'source.tsx'), path.join(symlinkRoot, 'alias.tsx'))
  await chmod(symlinkRoot, 0o500)
  await assert.rejects(() => verifySourceEvidence(symlinkRoot), /must not contain symlinks/u)
})

test('cancels a streamed response when its body exceeds the bound', async () => {
  const root = await evidenceRoot()
  let cancelled = false
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1_048_577))
    },
    cancel() {
      cancelled = true
    },
  })
  await assert.rejects(
    () =>
      fetchSourceEvidence({ sources: [{ url: source, path: 'stream.tsx' }] }, root, {
        fetcher: async () => new Response(body),
      }),
    /per-file bound/u,
  )
  assert.equal(cancelled, true)
})
