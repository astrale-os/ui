export const uiRequestLimits = {
  maxIssueBodyUtf8Bytes: 48 * 1024,
  maxAcceptedCommentCount: 50,
  maxAcceptedCommentBodyUtf8Bytes: 8 * 1024,
  maxRecordCommentUtf8Bytes: 32 * 1024,
  maxRecordCommentPages: 10,
  minUnknownReconcileAgeMs: 30_000,
  pollIntervalMs: 15_000,
  maxWaitMs: 90 * 60 * 1000,
} as const
