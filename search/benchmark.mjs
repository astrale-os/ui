import { readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib'

import { budgets } from './.spec/limits.ts'
import { buildSearchDocuments, repositoryFile } from './src/corpus.mjs'
import { buildIndex, loadIndex, searchIndex, serializeIndex } from './src/engine.mjs'

const cases = JSON.parse(
  await readFile(repositoryFile('search/.spec/benchmarks/relevance.cases.json'), 'utf8'),
)

function replicas(documents, scale) {
  if (scale === 1) return documents
  const values = []
  for (let replica = 0; replica < scale; replica += 1) {
    for (const [documentIndex, document] of documents.entries()) {
      values.push(
        replica === 0
          ? document
          : {
              ...document,
              address: `${document.address}~scale-${replica}`,
              identity: [
                ...document.identity,
                `scale${replica.toString(36)}doc${documentIndex.toString(36)}`,
              ],
              command: document.command ? `${document.command}~scale-${replica}` : undefined,
              packageImport: document.packageImport
                ? `${document.packageImport}~scale-${replica}`
                : undefined,
            },
      )
    }
  }
  return values
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]
}

function round(value) {
  return Number(value.toFixed(3))
}

function measure(documents, scale) {
  const scaled = replicas(documents, scale)
  const buildStarted = performance.now()
  const serialized = serializeIndex(buildIndex(scaled))
  const source = Buffer.from(JSON.stringify(serialized) + '\n')
  const buildMs = performance.now() - buildStarted
  const loadStarted = performance.now()
  const index = loadIndex(JSON.parse(source.toString('utf8')))
  const loadMs = performance.now() - loadStarted
  const queries = []
  for (let repetition = 0; repetition < 5; repetition += 1) {
    for (const testCase of cases) {
      const started = performance.now()
      searchIndex(index, testCase.query, { limit: 5 })
      queries.push(performance.now() - started)
    }
  }
  return {
    scale,
    documents: scaled.length,
    terms: index.terms.length,
    buildMs: round(buildMs),
    rawBytes: source.byteLength,
    gzipBytes: gzipSync(source, { level: 9 }).byteLength,
    brotliBytes: brotliCompressSync(source, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 },
    }).byteLength,
    loadMs: round(loadMs),
    queryP50Ms: round(percentile(queries, 0.5)),
    queryP95Ms: round(percentile(queries, 0.95)),
  }
}

const corpus = await buildSearchDocuments()
const results = [1, 10, 100].map((scale) => measure(corpus.documents, scale))
if (results[0].buildMs > budgets.currentCorpusBuildMs) {
  throw new Error('Current search build exceeded its ratified budget')
}
if (results[2].buildMs > budgets.scale100CorpusBuildMs) {
  throw new Error('100x search build exceeded its ratified budget')
}
for (const [result, budget, label] of [
  [results[0], budgets.currentCorpusP95Ms, 'current'],
  [results[1], budgets.scale10CorpusP95Ms, '10x'],
  [results[2], budgets.scale100CorpusP95Ms, '100x'],
]) {
  if (result.queryP95Ms > budget) {
    throw new Error(`${label} search query exceeded its ratified p95 budget`)
  }
}
process.stdout.write(JSON.stringify({ corpus: corpus.counts, results }, null, 2) + '\n')
