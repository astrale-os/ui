import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const sourceEvidenceLimits = Object.freeze({
  sources: 12,
  urlBytes: 2_048,
  pathBytes: 256,
  sourceBytes: 1_048_576,
  totalBytes: 4_194_304,
  timeoutMs: 20_000,
})

export function acceptSourceManifest(input) {
  const candidate = structuredOutput(input)
  if (!isRecord(candidate) || !hasExactKeys(candidate, ['sources'])) {
    throw new TypeError('source evidence manifest must contain only sources')
  }
  if (
    !Array.isArray(candidate.sources) ||
    candidate.sources.length > sourceEvidenceLimits.sources
  ) {
    throw new TypeError('source evidence manifest exceeds its source bound')
  }
  const seenPaths = new Set()
  const sources = candidate.sources.map((source) => {
    if (!isRecord(source) || !hasExactKeys(source, ['path', 'url'])) {
      throw new TypeError('source evidence entry is malformed')
    }
    const url = acceptUrl(source.url)
    const relativePath = acceptPath(source.path)
    if (seenPaths.has(relativePath)) throw new TypeError('source evidence paths must be unique')
    seenPaths.add(relativePath)
    return Object.freeze({ url, path: relativePath })
  })
  return Object.freeze({ sources: Object.freeze(sources) })
}

export async function fetchSourceEvidence(manifestInput, outputRoot, dependencies = {}) {
  const manifest = acceptSourceManifest(manifestInput)
  if (manifest.sources.length === 0) {
    throw new TypeError('source discovery produced no immutable evidence')
  }
  const fetcher = dependencies.fetcher ?? globalThis.fetch
  const root = path.resolve(outputRoot)
  const records = []
  let totalBytes = 0
  for (const source of manifest.sources) {
    const response = await fetcher(source.url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(sourceEvidenceLimits.timeoutMs),
      headers: {
        accept: 'application/octet-stream',
        'user-agent': 'astrale-ui-request-evidence/1',
      },
    })
    if (!response.ok || response.status !== 200 || response.type === 'opaqueredirect') {
      throw new TypeError(`source evidence fetch failed with status ${response.status}`)
    }
    const declared = response.headers.get('content-length')
    if (
      declared !== null &&
      (!/^\d+$/.test(declared) || Number(declared) > sourceEvidenceLimits.sourceBytes)
    ) {
      await response.body?.cancel()
      throw new TypeError('source evidence exceeds its per-file bound')
    }
    const bytes = await boundedBody(response, sourceEvidenceLimits.sourceBytes)
    totalBytes += bytes.byteLength
    if (totalBytes > sourceEvidenceLimits.totalBytes) {
      throw new TypeError('source evidence exceeds its total bound')
    }
    const target = path.resolve(root, source.path)
    if (target === root || !target.startsWith(`${root}${path.sep}`)) {
      throw new TypeError('source evidence target escapes its root')
    }
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, bytes, { flag: 'wx', mode: 0o600 })
    records.push(
      Object.freeze({
        ...source,
        bytes: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      }),
    )
  }
  const index = Object.freeze({ version: 1, sources: Object.freeze(records) })
  await writeFile(path.join(root, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  })
  return index
}

function structuredOutput(input) {
  if (isRecord(input) && isRecord(input.structured_output)) return input.structured_output
  if (isRecord(input) && typeof input.result === 'string') {
    try {
      const parsed = JSON.parse(input.result)
      if (isRecord(parsed)) return parsed
    } catch {
      // The exact manifest admission below owns the diagnostic.
    }
  }
  return input
}

function acceptUrl(value) {
  if (typeof value !== 'string' || Buffer.byteLength(value) > sourceEvidenceLimits.urlBytes) {
    throw new TypeError('source evidence URL is invalid')
  }
  const parsed = new URL(value)
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'raw.githubusercontent.com' ||
    parsed.port ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.href !== value
  ) {
    throw new TypeError('source evidence URL must be one canonical raw GitHub URL')
  }
  const parts = parsed.pathname.slice(1).split('/')
  if (
    parts.length < 4 ||
    !parts.slice(0, 2).every((part) => /^[A-Za-z0-9_.-]+$/.test(part)) ||
    !/^[a-f0-9]{40}$/.test(parts[2]) ||
    parts.slice(3).some((part) => !part || part === '.' || part === '..')
  ) {
    throw new TypeError('source evidence URL must pin one file to a full Git commit')
  }
  return value
}

function acceptPath(value) {
  if (
    typeof value !== 'string' ||
    Buffer.byteLength(value) > sourceEvidenceLimits.pathBytes ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) ||
    value.includes('\\') ||
    path.posix.normalize(value) !== value ||
    value.split('/').some((part) => part === '.' || part === '..')
  ) {
    throw new TypeError('source evidence path is invalid')
  }
  return value
}

async function boundedBody(response, limit) {
  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks = []
  let length = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > limit) throw new TypeError('source evidence exceeds its per-file bound')
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

function hasExactKeys(value, expected) {
  return Object.keys(value).toSorted().join('\0') === expected.toSorted().join('\0')
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function main() {
  const arguments_ = process.argv.slice(2)
  const manifestPath = option(arguments_, '--manifest')
  const outputRoot = option(arguments_, '--output')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const index = await fetchSourceEvidence(manifest, outputRoot)
  process.stdout.write(`${JSON.stringify(index)}\n`)
}

function option(arguments_, name) {
  const index = arguments_.indexOf(name)
  if (index === -1 || index + 1 >= arguments_.length) throw new TypeError(`${name} is required`)
  return arguments_[index + 1]
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main()
}
