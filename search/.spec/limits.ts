export const limits = {
  queryCodePoints: 256,
  defaultResults: 5,
  maxResults: 10,
  maxOffset: 1_009,
  rerankCandidates: 1_010,
  prefixTermsPerQueryTerm: 8,
  fuzzyTermsPerQueryTerm: 8,
  behaviorTermsPerDocument: 16,
  maxCodeBytes: 64 * 1_024,
  maxSingleArtifactRawBytes: 1 * 1_024 * 1_024,
  maxPartitionRawBytes: 4 * 1_024 * 1_024,
} as const

/** Local decode plus retrieval; release resolution, transfer, and code hydration are separate. */
export const budgets = {
  currentCorpusP95Ms: 10,
  scale10CorpusP95Ms: 25,
  scale100CorpusP95Ms: 150,
  currentCorpusBuildMs: 2_000,
  scale100CorpusBuildMs: 10_000,
} as const
