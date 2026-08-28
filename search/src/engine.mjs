import { fieldNames, limits, scoringFingerprint, scoringParameters } from './config.mjs'
import { tokenize } from './corpus.mjs'

function fieldTokens(document) {
  return [
    document.identity,
    tokenize(document.description),
    document.behavior.slice(0, limits.behaviorTermsPerDocument),
    [...new Set(document.dependencies.flatMap(tokenize))],
  ]
}

function frequencies(tokens) {
  const result = new Map()
  for (const token of tokens) result.set(token, (result.get(token) ?? 0) + 1)
  return result
}

export function buildIndex(documents) {
  const postings = new Map()
  const stored = []
  const totals = Array(fieldNames.length).fill(0)
  const ordered = [...documents].sort((left, right) => left.address.localeCompare(right.address))
  for (const [id, document] of ordered.entries()) {
    const fields = fieldTokens(document)
    const lengths = fields.map((field) => field.length)
    lengths.forEach((length, field) => (totals[field] += length))
    const { identity: _identity, behavior: _behavior, ...resultDocument } = document
    stored.push({ ...resultDocument, lengths })
    const byTerm = new Map()
    for (const [field, tokens] of fields.entries()) {
      for (const [term, count] of frequencies(tokens)) {
        const values = byTerm.get(term) ?? Array(fieldNames.length).fill(0)
        values[field] = count
        byTerm.set(term, values)
      }
    }
    for (const [term, values] of byTerm) {
      const termPostings = postings.get(term) ?? []
      termPostings.push([id, ...values])
      postings.set(term, termPostings)
    }
  }
  return {
    version: 1,
    scoringFingerprint,
    fieldNames,
    averageLengths: totals.map((total) => total / Math.max(ordered.length, 1)),
    documents: stored,
    postings,
    terms: [...postings.keys()].sort(),
  }
}

export function serializeIndex(index) {
  return {
    version: index.version,
    scoringFingerprint: index.scoringFingerprint,
    fieldNames: index.fieldNames,
    averageLengths: index.averageLengths,
    documents: index.documents,
    terms: index.terms.map((term) => [term, index.postings.get(term).flat()]),
  }
}

export function loadIndex(serialized) {
  if (
    serialized?.version !== 1 ||
    serialized?.scoringFingerprint !== scoringFingerprint ||
    JSON.stringify(serialized?.fieldNames) !== JSON.stringify(fieldNames) ||
    !Array.isArray(serialized?.averageLengths) ||
    !Array.isArray(serialized?.documents) ||
    !Array.isArray(serialized?.terms)
  ) {
    throw new Error('Incompatible or malformed lexical-v1 artifact')
  }
  const width = 1 + fieldNames.length
  const postings = new Map()
  for (const entry of serialized.terms) {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !Array.isArray(entry[1])) {
      throw new Error('Incompatible or malformed lexical-v1 artifact')
    }
    const values = []
    for (let offset = 0; offset < entry[1].length; offset += width) {
      const posting = entry[1].slice(offset, offset + width)
      if (posting.length !== width || posting.some((value) => !Number.isFinite(value))) {
        throw new Error('Incompatible or malformed lexical-v1 artifact')
      }
      values.push(posting)
    }
    postings.set(entry[0], values)
  }
  return { ...serialized, postings, terms: serialized.terms.map(([term]) => term) }
}

function withinOneEdit(left, right) {
  if (Math.abs(left.length - right.length) > 1) return false
  if (left === right) return true
  let leftIndex = 0
  let rightIndex = 0
  let edits = 0
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1
      rightIndex += 1
      continue
    }
    edits += 1
    if (edits > 1) return false
    if (left.length > right.length) leftIndex += 1
    else if (right.length > left.length) rightIndex += 1
    else {
      leftIndex += 1
      rightIndex += 1
    }
  }
  return edits + Number(leftIndex < left.length || rightIndex < right.length) <= 1
}

function matchingTerms(index, queryTerm, parameters = scoringParameters) {
  if (index.postings.has(queryTerm)) return [[queryTerm, 1]]
  const matches = new Map()
  if (queryTerm.length >= 3) {
    const prefix = index.terms
      .filter((term) => term.startsWith(queryTerm))
      .sort(
        (left, right) =>
          left.length - right.length ||
          index.postings.get(left).length - index.postings.get(right).length ||
          left.localeCompare(right),
      )
      .slice(0, parameters.prefixTermLimit)
    for (const term of prefix) matches.set(term, parameters.prefixWeight)
  }
  if (queryTerm.length >= 5) {
    const fuzzy = index.terms
      .filter(
        (term) => Math.abs(term.length - queryTerm.length) <= 1 && withinOneEdit(term, queryTerm),
      )
      .sort(
        (left, right) =>
          Math.abs(left.length - queryTerm.length) - Math.abs(right.length - queryTerm.length) ||
          index.postings.get(left).length - index.postings.get(right).length ||
          left.localeCompare(right),
      )
      .slice(0, parameters.fuzzyTermLimit)
    for (const term of fuzzy) {
      matches.set(term, Math.max(parameters.fuzzyWeight, matches.get(term) ?? 0))
    }
  }
  return [...matches]
}

export function resolveQueryTerms(index, query, parameters = scoringParameters) {
  const queryTerms = [...new Set(tokenize(query))]
  const matches = []
  for (const [queryPosition, queryTerm] of queryTerms.entries()) {
    for (const [term, weight] of matchingTerms(index, queryTerm, parameters)) {
      matches.push({ queryPosition, queryTerm, term, weight })
    }
  }
  return { queryTerms, matches }
}

function normalizedText(value) {
  return tokenize(value).join(' ')
}

function popcount(value) {
  let count = 0
  let remaining = value >>> 0
  while (remaining !== 0) {
    remaining &= remaining - 1
    count += 1
  }
  return count
}

function less(left, right) {
  return left.score < right.score || (left.score === right.score && left.id > right.id)
}

function heapPush(heap, candidate, limit) {
  if (heap.length < limit) {
    heap.push(candidate)
    let index = heap.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (!less(heap[index], heap[parent])) break
      ;[heap[index], heap[parent]] = [heap[parent], heap[index]]
      index = parent
    }
    return
  }
  if (!less(heap[0], candidate)) return
  heap[0] = candidate
  let index = 0
  for (;;) {
    const left = index * 2 + 1
    const right = left + 1
    let smallest = index
    if (left < heap.length && less(heap[left], heap[smallest])) smallest = left
    if (right < heap.length && less(heap[right], heap[smallest])) smallest = right
    if (smallest === index) return
    ;[heap[index], heap[smallest]] = [heap[smallest], heap[index]]
    index = smallest
  }
}

export function searchIndex(index, query, options = {}) {
  const parameters = options.parameters ?? scoringParameters
  const exactQuery = query.trim().normalize('NFKC').toLowerCase()
  let low = 0
  let high = index.documents.length - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const document = index.documents[middle]
    const compared = document.address.normalize('NFKC').toLowerCase().localeCompare(exactQuery)
    if (compared === 0) {
      const offset = options.offset ?? 0
      return {
        total: 1,
        results: offset === 0 ? [{ score: Number.POSITIVE_INFINITY, document }] : [],
      }
    }
    if (compared < 0) low = middle + 1
    else high = middle - 1
  }
  const resolution = resolveQueryTerms(index, query, parameters)
  const { queryTerms } = resolution
  if (queryTerms.length === 0) return { total: 0, results: [] }
  const count = index.documents.length
  const scores = new Float64Array(count)
  const matchMasks = new Uint32Array(count)
  const touched = []
  for (const { queryPosition, term, weight: matchWeight } of resolution.matches) {
    const termPostings = index.postings.get(term)
    const documentFrequency = termPostings.length
    const inverseFrequency = Math.log(
      1 + (count - documentFrequency + 0.5) / (documentFrequency + 0.5),
    )
    for (const [id, ...fieldFrequencies] of termPostings) {
      const document = index.documents[id]
      let combinedFrequency = 0
      for (const [field, frequency] of fieldFrequencies.entries()) {
        if (frequency === 0) continue
        const average = Math.max(index.averageLengths[field], 1)
        const normalization =
          1 -
          parameters.lengthNormalization[field] +
          parameters.lengthNormalization[field] * (document.lengths[field] / average)
        combinedFrequency += (parameters.boosts[field] * frequency) / normalization
      }
      const contribution =
        inverseFrequency *
        ((combinedFrequency * (parameters.saturation + 1)) /
          (combinedFrequency + parameters.saturation)) *
        matchWeight
      if (scores[id] === 0) touched.push(id)
      scores[id] += contribution
      matchMasks[id] |= 1 << (queryPosition % 31)
    }
  }
  const preliminary = []
  for (const id of touched) {
    const coverage = popcount(matchMasks[id]) / queryTerms.length
    let score = scores[id] * (0.5 + coverage)
    if (index.documents[id].address.normalize('NFKC').toLowerCase() === exactQuery) score *= 100
    heapPush(preliminary, { id, score }, parameters.rerankCandidates)
  }
  const phrase = queryTerms.join(' ')
  const ranked = preliminary
    .map(({ id, score: initialScore }) => {
      const document = index.documents[id]
      const title = normalizedText(document.title)
      const description = normalizedText(document.description)
      const address = normalizedText(document.address)
      let score = initialScore
      if (title.includes(phrase)) score *= 1.35
      if (description.includes(phrase)) score *= 1.25
      if (document.address.normalize('NFKC').toLowerCase() !== exactQuery) {
        if (address === phrase || normalizedText(query) === address) score *= 4
      }
      return { score, document }
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.document.title.localeCompare(right.document.title) ||
        left.document.address.localeCompare(right.document.address),
    )
  const offset = options.offset ?? 0
  const limit = options.limit ?? limits.defaultResults
  return {
    total: ranked.length,
    results: ranked.slice(offset, offset + limit),
  }
}

function hash(value) {
  let result = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16_777_619)
  }
  return result >>> 0
}

function normalizedFrequency(index, document, fieldFrequencies, parameters) {
  let combined = 0
  for (const [field, frequency] of fieldFrequencies.entries()) {
    if (frequency === 0) continue
    const average = Math.max(index.averageLengths[field], 1)
    const normalization =
      1 -
      parameters.lengthNormalization[field] +
      parameters.lengthNormalization[field] * (document.lengths[field] / average)
    combined += (parameters.boosts[field] * frequency) / normalization
  }
  return Number(combined.toFixed(6))
}

function rawBytes(value) {
  return Buffer.byteLength(JSON.stringify(value) + '\n')
}

export function buildPartitions(
  index,
  { termShardCount = 32, maxPartitionRawBytes = limits.maxPartitionRawBytes } = {},
) {
  let currentTermShardCount = termShardCount
  let termValues
  let termShardByTerm
  for (;;) {
    termValues = Array.from({ length: currentTermShardCount }, () => [])
    termShardByTerm = new Map()
    for (const term of index.terms) {
      const shard = hash(term) % currentTermShardCount
      termShardByTerm.set(term, shard)
      const flat = []
      for (const [id, ...fieldFrequencies] of index.postings.get(term)) {
        flat.push(
          id,
          normalizedFrequency(index, index.documents[id], fieldFrequencies, scoringParameters),
        )
      }
      termValues[shard].push([term, flat])
    }
    for (const [id, document] of index.documents.entries()) {
      const exactTerm = `\0${document.address.normalize('NFKC').toLowerCase()}`
      termValues[hash(exactTerm) % currentTermShardCount].push([exactTerm, [id, 1]])
    }
    for (const values of termValues) {
      values.sort(([left], [right]) => left.localeCompare(right))
    }
    if (termValues.every((value) => rawBytes(value) <= maxPartitionRawBytes)) break
    currentTermShardCount *= 2
    if (currentTermShardCount > 65_536) {
      throw new Error('Unable to satisfy the term partition bound')
    }
  }

  const families = [...new Set(index.documents.map((document) => document.family))].sort()
  const familyId = new Map(families.map((value, id) => [value, id]))
  const logicalFamilyValues = families.map(() => [])
  for (const [id, document] of index.documents.entries()) {
    const currentFamilyId = familyId.get(document.family)
    const { lengths: _lengths, ...metadata } = document
    logicalFamilyValues[currentFamilyId].push([id, metadata])
  }
  const metadataValues = []
  const documentMetadataParts = Array(index.documents.length)
  for (const values of logicalFamilyValues) {
    let part = []
    let partBytes = 2
    const flush = () => {
      if (part.length === 0) return
      const partId = metadataValues.length
      metadataValues.push(part)
      for (const [documentId] of part) documentMetadataParts[documentId] = partId
      part = []
      partBytes = 2
    }
    for (const value of values) {
      const valueBytes = Buffer.byteLength(JSON.stringify(value))
      if (valueBytes + 3 > maxPartitionRawBytes) {
        throw new Error(`Document ${value[0]} exceeds the metadata partition bound`)
      }
      const separatorBytes = part.length === 0 ? 0 : 1
      if (part.length > 0 && partBytes + separatorBytes + valueBytes + 1 > maxPartitionRawBytes) {
        flush()
      }
      part.push(value)
      partBytes += (part.length === 1 ? 0 : 1) + valueBytes
    }
    flush()
  }
  return {
    documents: index.documents.length,
    terms: index.terms.map((term) => [
      term,
      termShardByTerm.get(term),
      index.postings.get(term).length,
    ]),
    documentMetadataParts,
    termValues,
    metadataValues,
  }
}

export function termShard(value, count) {
  return hash(value) % count
}

/** Generator-side conformance executor for partitioned artifacts. */
export function searchPartitions(partitions, query, options = {}) {
  const terms = partitions.terms.map(([term]) => term)
  const frequencies = new Map(
    partitions.terms.map(([term, _shard, frequency]) => [term, frequency]),
  )
  const resolver = {
    terms,
    postings: {
      has: (term) => frequencies.has(term),
      get: (term) => ({ length: frequencies.get(term) }),
    },
  }
  const resolution = resolveQueryTerms(resolver, query)
  if (resolution.queryTerms.length === 0) return { total: 0, results: [] }
  const termShardByTerm = new Map(partitions.terms.map(([term, shard]) => [term, shard]))
  const selectedTermIds = new Set(resolution.matches.map(({ term }) => termShardByTerm.get(term)))
  const normalizedQuery = query.trim().normalize('NFKC').toLowerCase()
  const exactTerm = `\0${normalizedQuery}`
  const mayBeAddress = /^(?:@astrale-os\/ui\/|(?:component|pattern|block|theme)\/)/u.test(
    normalizedQuery,
  )
  if (mayBeAddress) selectedTermIds.add(termShard(exactTerm, partitions.termValues.length))
  const postings = new Map()
  for (const shardId of selectedTermIds) {
    for (const [term, flat] of partitions.termValues[shardId]) postings.set(term, flat)
  }
  if (mayBeAddress && postings.has(exactTerm)) {
    const [id] = postings.get(exactTerm)
    const partId = partitions.documentMetadataParts[id]
    const document = partitions.metadataValues[partId].find(
      ([documentId]) => documentId === id,
    )?.[1]
    const offset = options.offset ?? 0
    return {
      total: 1,
      results: offset === 0 && document ? [{ score: Number.POSITIVE_INFINITY, document }] : [],
    }
  }
  const scores = new Float64Array(partitions.documents)
  const masks = new Uint32Array(partitions.documents)
  const touched = []
  for (const { queryPosition, term, weight } of resolution.matches) {
    const flat = postings.get(term)
    if (!flat) continue
    const documentFrequency = flat.length / 2
    const inverseFrequency = Math.log(
      1 + (partitions.documents - documentFrequency + 0.5) / (documentFrequency + 0.5),
    )
    for (let offset = 0; offset < flat.length; offset += 2) {
      const id = flat[offset]
      const frequency = flat[offset + 1]
      const contribution =
        inverseFrequency *
        ((frequency * (scoringParameters.saturation + 1)) /
          (frequency + scoringParameters.saturation)) *
        weight
      if (scores[id] === 0) touched.push(id)
      scores[id] += contribution
      masks[id] |= 1 << (queryPosition % 31)
    }
  }
  const preliminary = touched
    .map((id) => ({
      id,
      score: scores[id] * (0.5 + popcount(masks[id]) / Math.max(resolution.queryTerms.length, 1)),
    }))
    .sort((left, right) => right.score - left.score || left.id - right.id)
    .slice(0, scoringParameters.rerankCandidates)
  const metadataPartIds = new Set(preliminary.map(({ id }) => partitions.documentMetadataParts[id]))
  const documents = new Map()
  for (const partId of metadataPartIds) {
    for (const [id, document] of partitions.metadataValues[partId]) documents.set(id, document)
  }
  const phrase = resolution.queryTerms.join(' ')
  const ranked = preliminary
    .map(({ id, score: initialScore }) => {
      const document = documents.get(id)
      const title = tokenize(document.title).join(' ')
      const description = tokenize(document.description).join(' ')
      const address = tokenize(document.address).join(' ')
      let score = initialScore
      if (title.includes(phrase)) score *= 1.35
      if (description.includes(phrase)) score *= 1.25
      if (document.address.normalize('NFKC').toLowerCase() === normalizedQuery) score *= 100
      else if (address === phrase || tokenize(query).join(' ') === address) score *= 4
      return { score, document }
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.document.title.localeCompare(right.document.title) ||
        left.document.address.localeCompare(right.document.address),
    )
  const offset = options.offset ?? 0
  const limit = options.limit ?? limits.defaultResults
  return { total: ranked.length, results: ranked.slice(offset, offset + limit) }
}
