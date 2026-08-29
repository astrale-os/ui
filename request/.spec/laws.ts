export const uiRequestLaws = {
  acceptedDiscussionSnapshot: {
    id: 'REQ-AGENT-DISCUSSION-SNAPSHOT',
    statement:
      'Each attempt includes the issue body and bounded eligible maintainer comments selected before reservation; later comments can affect only a later attempt.',
  },
  acceptedDiscussionAuthority: {
    id: 'REQ-AGENT-DISCUSSION-AUTHORITY',
    statement:
      'Eligible maintainer comments may refine product intent in chronological order but cannot override repository policy, provenance admission, credential isolation, or qualification.',
  },
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
  readyLabelIsOneWriter: {
    id: 'REQ-AGENT-READY-ONE-WRITER',
    statement:
      'One authorized ui:ready label resolves to initial work, observation, or revision from the trusted attempt record without creating a parallel writer.',
  },
} as const
