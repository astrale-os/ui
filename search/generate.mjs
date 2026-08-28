import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { scoringFingerprint, scoringParameters, limits } from './src/config.mjs'
import { buildSearchDocuments, repositoryRoot } from './src/corpus.mjs'
import { buildIndex, buildPartitions, serializeIndex } from './src/engine.mjs'

const publicRoot = path.join(repositoryRoot, 'search/public')

function encode(value) {
  return JSON.stringify(value) + '\n'
}

function descriptor(file, content) {
  return {
    path: file,
    bytes: Buffer.byteLength(content),
    sha256: createHash('sha256').update(content).digest('hex'),
  }
}

export async function buildArtifactSet(options = {}) {
  const corpus = await buildSearchDocuments()
  const index = buildIndex(corpus.documents)
  const serialized = serializeIndex(index)
  const singleContent = encode(serialized)
  const files = new Map()
  let layout

  if (
    Buffer.byteLength(singleContent) <=
    (options.maxSingleArtifactRawBytes ?? limits.maxSingleArtifactRawBytes)
  ) {
    const file = 'search/public/index.json'
    files.set(file, singleContent)
    layout = { kind: 'single', index: descriptor(file, singleContent) }
  } else {
    const partitions = buildPartitions(index, {
      maxPartitionRawBytes:
        options.maxShardRawBytes ?? options.maxPartitionRawBytes ?? limits.maxPartitionRawBytes,
      termShardCount: options.termShardCount,
    })
    const width = String(
      Math.max(partitions.termValues.length, partitions.metadataValues.length),
    ).length
    const termFiles = partitions.termValues.map((value, id) => {
      const file = `search/public/terms/${String(id).padStart(width, '0')}.json`
      const content = encode(value)
      files.set(file, content)
      return descriptor(file, content)
    })
    const metadataFiles = partitions.metadataValues.map((value, id) => {
      const file = `search/public/metadata/${String(id).padStart(width, '0')}.json`
      const content = encode(value)
      files.set(file, content)
      return descriptor(file, content)
    })
    layout = {
      kind: 'partitioned',
      documents: partitions.documents,
      terms: partitions.terms,
      documentMetadataParts: partitions.documentMetadataParts,
      termFiles,
      metadataFiles,
    }
  }

  const manifest = {
    version: 1,
    engine: 'lexical-v1',
    scoring: { fingerprint: scoringFingerprint, parameters: scoringParameters },
    corpus: corpus.counts,
    layout,
  }
  const manifestContent = encode(manifest)
  assert.ok(
    Buffer.byteLength(manifestContent) <=
      (options.maxPartitionRawBytes ?? limits.maxPartitionRawBytes),
    'Search manifest exceeds the partition bound',
  )
  files.set('search/public/manifest.json', manifestContent)
  return { corpus, index, manifest, files }
}

async function observedFiles(directory, relative = directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name)
        return entry.isDirectory()
          ? observedFiles(target, relative)
          : [path.relative(repositoryRoot, target).split(path.sep).join('/')]
      }),
    )
  ).flat()
}

export async function generateSearchArtifacts({ check = false } = {}) {
  const artifact = await buildArtifactSet()
  if (check) {
    const expected = [...artifact.files].sort(([left], [right]) => left.localeCompare(right))
    const observed = (await observedFiles(publicRoot)).sort()
    assert.deepEqual(
      observed,
      expected.map(([file]) => file),
      'Generated search file set is stale',
    )
    for (const [file, content] of expected) {
      assert.equal(
        await readFile(path.join(repositoryRoot, file), 'utf8'),
        content,
        `${file} is stale`,
      )
    }
    return artifact
  }
  await rm(publicRoot, { recursive: true, force: true })
  for (const [file, content] of artifact.files) {
    const target = path.join(repositoryRoot, file)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, content)
  }
  return artifact
}

const isMain = import.meta.url === new URL(process.argv[1], 'file:').href
if (isMain) {
  const artifact = await generateSearchArtifacts({ check: process.argv.includes('--check') })
  process.stdout.write(
    `PASS search ${artifact.manifest.layout.kind} (${artifact.corpus.counts.total} documents)\n`,
  )
}
