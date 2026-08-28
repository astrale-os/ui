import { createHash } from 'node:crypto'

import { limits } from '../.spec/limits.ts'

export const fieldNames = Object.freeze(['identity', 'description', 'behavior', 'dependencies'])

export const scoringParameters = Object.freeze({
  boosts: Object.freeze([4, 5, 0.25, 0.4]),
  lengthNormalization: Object.freeze([0.25, 0.65, 0.2, 0.1]),
  saturation: 1.2,
  prefixWeight: 0.55,
  fuzzyWeight: 0.2,
  prefixTermLimit: limits.prefixTermsPerQueryTerm,
  fuzzyTermLimit: limits.fuzzyTermsPerQueryTerm,
  rerankCandidates: limits.rerankCandidates,
})

export const scoringFingerprint = createHash('sha256')
  .update(JSON.stringify({ engine: 'lexical-v1', fieldNames, ...scoringParameters }))
  .digest('hex')

export { limits }
