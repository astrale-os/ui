export const uiRequestLaws = {
  reserveBeforeDispatch: {
    id: 'REQ-AGENT-RESERVE',
    statement: 'The exact attempt and objective digest are persisted before remote dispatch.',
  },
  oneWriter: {
    id: 'REQ-AGENT-ONE-WRITER',
    statement:
      'Trusted composition serializes each canonical request key so one request or pull-request branch has at most one non-terminal managed writer.',
  },
  unknownOutcomeBlocks: {
    id: 'REQ-AGENT-UNKNOWN-BLOCKS',
    statement:
      'An uncertain dispatch outcome blocks automatic retry, revision, and provider replacement.',
  },
  reconciliationIsReadOnly: {
    id: 'REQ-AGENT-RECONCILE-READONLY',
    statement:
      'Only explicit trusted reconciliation may resolve an unknown outcome, and it cannot dispatch another writer.',
  },
  proposalNotAcceptance: {
    id: 'REQ-AGENT-PROPOSAL-ONLY',
    statement:
      'Managed-agent success records a proposal PR but never implies CI, review, merge, or publication acceptance.',
  },
  reviewIsFreshRun: {
    id: 'REQ-AGENT-REVIEW-RUN',
    statement: 'A review revision is a fresh normalized run targeting the existing proposal PR.',
  },
} as const
