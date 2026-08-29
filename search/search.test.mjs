import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import { checkCatalogPreviews } from '../scripts/check-catalog-previews.mjs'
import { buildArtifactSet, generateSearchArtifacts } from './generate.mjs'
import { limits } from './src/config.mjs'
import {
  buildSearchDocuments,
  extractBehaviorTerms,
  repositoryFile,
  repositoryRoot,
} from './src/corpus.mjs'
import {
  buildIndex,
  buildPartitions,
  loadIndex,
  searchIndex,
  searchPartitions,
  serializeIndex,
} from './src/engine.mjs'

const corpus = await buildSearchDocuments()
const registry = JSON.parse(await readFile(repositoryFile('registry/registry.json'), 'utf8'))
const cases = JSON.parse(
  await readFile(repositoryFile('search/.spec/benchmarks/relevance.cases.json'), 'utf8'),
)

function addresses(result) {
  return result.results.map(({ document }) => document.address)
}

function relevance(index) {
  const details = cases.map((entry) => {
    const relevant = new Set(entry.relevant)
    const results = searchIndex(index, entry.query, { limit: 10 }).results
    const first = results.findIndex(({ document }) => relevant.has(document.address))
    const count = (limit) =>
      new Set(
        results
          .slice(0, limit)
          .map(({ document }) => document.address)
          .filter((address) => relevant.has(address)),
      ).size
    const gain = (values, limit) =>
      values.slice(0, limit).reduce((total, { document }, position) => {
        return relevant.has(document.address) ? total + 1 / Math.log2(position + 2) : total
      }, 0)
    const ideal = entry.relevant.slice(0, 5).map((address) => ({ document: { address } }))
    return {
      hitAt5: first >= 0 && first < 5,
      recallAt5: count(5) / relevant.size,
      recallAt10: count(10) / relevant.size,
      reciprocalRankAt5: first >= 0 && first < 5 ? 1 / (first + 1) : 0,
      ndcgAt5: gain(results, 5) / gain(ideal, 5),
    }
  })
  const mean = (field) =>
    details.reduce((total, detail) => total + Number(detail[field]), 0) / details.length
  return {
    hitRateAt5: mean('hitAt5'),
    recallAt5: mean('recallAt5'),
    recallAt10: mean('recallAt10'),
    mrrAt5: mean('reciprocalRankAt5'),
    ndcgAt5: mean('ndcgAt5'),
  }
}

test('derives the exact registry and runtime closure with canonical bounded code', async () => {
  const catalog = await checkCatalogPreviews(repositoryRoot)
  const themeCount = registry.items.filter((item) => item.type === 'registry:theme').length
  assert.equal(corpus.counts.registry, registry.items.length)
  assert.equal(corpus.counts.total, catalog.expected + themeCount)
  assert.equal(corpus.counts.runtime, corpus.counts.total - corpus.counts.registry)
  assert.equal(new Set(corpus.documents.map(({ address }) => address)).size, corpus.counts.total)
  assert.deepEqual(
    corpus.documents
      .filter((document) => document.command)
      .map((document) => document.address)
      .sort(),
    registry.items.map((item) => item.meta.canonicalAddress).sort(),
  )
  const searchableVisual = new Set(
    corpus.documents
      .filter((document) => !document.address.startsWith('theme/'))
      .map((document) =>
        document.packageImport
          ? `component/${document.packageImport.slice('@astrale-os/ui/'.length)}`
          : document.address,
      ),
  )
  assert.deepEqual(
    [...searchableVisual].sort(),
    [
      ...new Set(
        catalog.identities.filter((identity) => identity.canonical).map(({ address }) => address),
      ),
    ].sort(),
  )

  for (const document of corpus.documents) {
    const segments = document.address.split('/')
    const subject = segments.at(-1)
    assert.ok(!path.isAbsolute(document.code.path))
    assert.ok(!document.code.path.split('/').includes('..'))
    assert.ok(document.code.bytes <= limits.maxCodeBytes)
    const source = await readFile(repositoryFile(document.code.path))
    assert.equal(source.byteLength, document.code.bytes)
    assert.equal(createHash('sha256').update(source).digest('hex'), document.code.sha256)
    assert.notEqual(Boolean(document.command), Boolean(document.packageImport))
    if (document.packageImport) {
      const runtimeSubject = document.packageImport.slice('@astrale-os/ui/'.length)
      assert.equal(
        document.code.path,
        `packages/ui/previews/${runtimeSubject}/${runtimeSubject}.preview.tsx`,
      )
    } else if (document.address.startsWith('theme/')) {
      assert.equal(document.code.path, `registry/themes/${subject}.css`)
    } else if (document.code.path.startsWith('registry/variants/')) {
      const owner = segments[0] === 'component' ? 'components' : `${segments[0]}s`
      assert.equal(
        document.code.path,
        `registry/variants/source/${owner}/${segments[1]}/${subject}/${subject}.tsx`,
      )
    } else if (segments[0] === 'component') {
      assert.equal(document.code.path, `registry/components/${subject}/${subject}.preview.tsx`)
    } else {
      assert.equal(
        document.code.path,
        `registry/${segments[0]}s/${segments[1]}/${subject}.preview.tsx`,
      )
    }
  }
  assert.throws(() => repositoryFile('../outside.ts'), /escapes root/u)
  assert.throws(() => repositoryFile('/tmp/outside.ts'), /must be relative/u)
})

test('generates a byte-stable admitted single release artifact', async () => {
  const first = await buildArtifactSet()
  const second = await buildArtifactSet()
  assert.equal(first.manifest.layout.kind, 'single')
  assert.equal(JSON.stringify([...second.files]), JSON.stringify([...first.files]))
  const indexContent = first.files.get(first.manifest.layout.index.path)
  assert.equal(Buffer.byteLength(indexContent), first.manifest.layout.index.bytes)
  assert.equal(
    createHash('sha256').update(indexContent).digest('hex'),
    first.manifest.layout.index.sha256,
  )
  await generateSearchArtifacts({ check: true })
})

test('preserves rank, exact identity, normalization, and full pagination boundary', () => {
  const index = buildIndex(corpus.documents)
  const loaded = loadIndex(JSON.parse(JSON.stringify(serializeIndex(index))))
  for (const document of corpus.documents) {
    for (const executor of [index, loaded]) {
      assert.equal(
        addresses(searchIndex(executor, document.address, { limit: 1 }))[0],
        document.address,
      )
      assert.equal(
        addresses(searchIndex(executor, document.address.toUpperCase(), { limit: 1 }))[0],
        document.address,
      )
      assert.equal(
        addresses(
          searchIndex(
            executor,
            document.address.replace(/[!-~]/gu, (character) =>
              String.fromCodePoint(character.codePointAt(0) + 0xfee0),
            ),
            { limit: 1 },
          ),
        )[0],
        document.address,
      )
    }
  }
  for (const [query, expected] of [
    ['button-17', 'component/button/button-17'],
    ['input-41', 'component/input/input-41'],
  ]) {
    assert.equal(addresses(searchIndex(index, query, { limit: 1 }))[0], expected)
  }

  const ties = Array.from({ length: 1_050 }, (_, value) => {
    const suffix = String(value).padStart(4, '0')
    return {
      address: `component/widget-${suffix}`,
      title: 'Widget',
      description: '',
      dependencies: [],
      behavior: [],
      identity: ['widget', suffix],
      family: 'component/widget',
      command: `astrale ui add component/widget-${suffix}`,
      code: { language: 'tsx', path: 'fixture.tsx', bytes: 1, sha256: 'a'.repeat(64) },
    }
  }).reverse()
  const tieIndex = buildIndex(ties)
  assert.deepEqual(
    addresses(searchIndex(tieIndex, 'widget', { offset: 1_000, limit: 10 })),
    Array.from(
      { length: 10 },
      (_, value) => `component/widget-${String(value + 1_000).padStart(4, '0')}`,
    ),
  )
  const tiePartitions = buildPartitions(tieIndex, { maxPartitionRawBytes: 18 * 1_024 })
  assert.deepEqual(
    addresses(searchPartitions(tiePartitions, 'widget', { offset: 1_000, limit: 10 })),
    addresses(searchIndex(tieIndex, 'widget', { offset: 1_000, limit: 10 })),
  )
  assert.deepEqual(addresses(searchIndex(tieIndex, 'widget', { offset: 1_009, limit: 1 })), [
    'component/widget-1009',
  ])
  assert.deepEqual(
    addresses(searchPartitions(tiePartitions, 'widget', { offset: 1_009, limit: 1 })),
    ['component/widget-1009'],
  )
})

test('partition generation exercises serialized descriptors with retrieval parity', async () => {
  const index = buildIndex(corpus.documents)
  const artifact = await buildArtifactSet({
    maxSingleArtifactRawBytes: 1,
    maxShardRawBytes: 18 * 1_024,
  })
  assert.equal(artifact.manifest.layout.kind, 'partitioned')
  const layout = artifact.manifest.layout
  const decode = (descriptor) => {
    const content = artifact.files.get(descriptor.path)
    assert.equal(Buffer.byteLength(content), descriptor.bytes)
    assert.equal(createHash('sha256').update(content).digest('hex'), descriptor.sha256)
    return JSON.parse(content)
  }
  const partitions = {
    documents: layout.documents,
    terms: layout.terms,
    documentMetadataParts: layout.documentMetadataParts,
    termValues: layout.termFiles.map(decode),
    metadataValues: layout.metadataFiles.map(decode),
  }
  assert.ok(partitions.termValues.length > 32)
  assert.ok(partitions.metadataValues.length > 1)
  assert.ok(partitions.metadataValues.every((part) => part.length > 0))
  const reconstructedMetadata = partitions.metadataValues.flatMap((part, partId) =>
    part.map(([documentId, metadata]) => ({ documentId, metadata, partId })),
  )
  assert.equal(reconstructedMetadata.length, index.documents.length)
  assert.deepEqual(
    reconstructedMetadata.map(({ documentId }) => documentId).sort((left, right) => left - right),
    Array.from({ length: index.documents.length }, (_, documentId) => documentId),
  )
  for (const { documentId, metadata, partId } of reconstructedMetadata) {
    const { lengths: _lengths, ...expectedMetadata } = index.documents[documentId]
    assert.deepEqual(metadata, expectedMetadata)
    assert.equal(partitions.documentMetadataParts[documentId], partId)
  }
  for (const descriptor of [...layout.termFiles, ...layout.metadataFiles]) {
    assert.ok(descriptor.bytes <= 18 * 1_024)
  }
  for (const testCase of cases) {
    assert.deepEqual(
      addresses(searchPartitions(partitions, testCase.query, { limit: 10 })),
      addresses(searchIndex(index, testCase.query, { limit: 10 })),
      testCase.query,
    )
  }
  for (const document of corpus.documents) {
    assert.equal(
      addresses(searchPartitions(partitions, document.address, { limit: 1 }))[0],
      document.address,
    )
  }
})

test('meets the ratified relevance floor with syntax-derived behavior', () => {
  const report = relevance(buildIndex(corpus.documents))
  assert.equal(report.hitRateAt5, 1)
  assert.ok(report.recallAt5 >= 0.9, JSON.stringify(report))
  assert.equal(report.recallAt10, 1)
  assert.ok(report.mrrAt5 >= 0.95, JSON.stringify(report))
  assert.ok(report.ndcgAt5 >= 0.9, JSON.stringify(report))
})

test('extracts semantic behavior without visual, address, or module boilerplate', () => {
  const terms = extractBehaviorTerms(
    `
      import { cn } from './utils'
      export function Demo() {
        const email = 'owner@example.com'
        const website = 'https://example.com/hidden-path'
        return (
          <a
            aria-label="Export payments"
            className="bg-red-500 data-[state=open]:opacity-100 px-4"
            data-slot="secret-slot"
            href="https://example.com/private"
          >
            Contact owner@example.com
          </a>
        )
      }
    `,
    'fixture.tsx',
  )
  assert.ok(terms.includes('payments'))
  for (const excluded of [
    'bg',
    'red',
    '500',
    'opacity',
    'secret',
    'slot',
    'https',
    'example',
    'com',
    'owner',
    'import',
    'function',
  ]) {
    assert.ok(!terms.includes(excluded), `${excluded}: ${terms.join(', ')}`)
  }
  assert.ok(terms.length <= limits.behaviorTermsPerDocument)
})
