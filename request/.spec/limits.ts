export const uiRequestLimits = {
  maxIssueBodyUtf8Bytes: 48 * 1024,
  maxAcceptedCommentCount: 50,
  maxAcceptedCommentBodyUtf8Bytes: 8 * 1024,
  maxAcceptedDiscussionUtf8Bytes: 32 * 1024,
  maxPreviewCount: 64,
  maxPreviewArtifactFiles: 8_192,
  maxPreviewArtifactBytes: 128 * 1024 * 1024,
  maxPreviewFileBytes: 16 * 1024 * 1024,
  maxRecordCommentUtf8Bytes: 32 * 1024,
  maxRecordCommentPages: 10,
  minUnknownReconcileAgeMs: 30_000,
  pollIntervalMs: 15_000,
  maxWaitMs: 90 * 60 * 1000,
  candidateCheckpointRetentionDays: 30,
  maxEscalationsPerObjective: 1,
  fullQualificationShardCount: 4,
} as const

/**
 * Measured reporting thresholds. Crossing a hard value records an SLO violation but never
 * terminates the job or discards its candidate checkpoint.
 */
export const uiRequestLatencyBudgets = {
  admission: { targetMs: 3_000, hardMs: 5_000 },
  warmProposal: { targetMs: 8 * 60_000, hardMs: 12 * 60_000 },
  coldProposal: { targetMs: 15 * 60_000, hardMs: 20 * 60_000 },
  revision: { targetMs: 4 * 60_000, hardMs: 6 * 60_000 },
  fastGate: { targetMs: 90_000, hardMs: 2 * 60_000 },
  mergeReady: { targetMs: 4 * 60_000, hardMs: 5 * 60_000 },
  releaseCompute: { targetMs: 2 * 60_000, hardMs: 3 * 60_000 },
} as const
