export const uiRequestLaws = {
  acceptedDiscussionSnapshot: {
    id: 'REQ-AGENT-DISCUSSION-SNAPSHOT',
    statement:
      'Each attempt includes the issue body and a bounded chronological snapshot of eligible issue and bound pull-request discussion selected before reservation; later discussion can affect only a later attempt.',
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
  proposalEvidenceMatchesRevision: {
    id: 'REQ-PREVIEW-REVISION',
    statement:
      'The pull request evidence comment, screenshots, deployment, and direct preview links identify the exact qualified proposal revision they render.',
  },
  previewBytesAreInert: {
    id: 'REQ-PREVIEW-INERT-PUBLISH',
    statement:
      'Candidate code builds and renders without publication credentials; the publisher admits and transfers bounded static bytes without executing them.',
  },
  reviewTargetsBoundProposal: {
    id: 'REQ-REVIEW-BOUND-PROPOSAL',
    statement:
      'A pull-request ui:ready signal may revise only the open same-repository proposal already bound to its originating request record.',
  },
  readyLabelIsOneWriter: {
    id: 'REQ-AGENT-READY-ONE-WRITER',
    statement:
      'One authorized ui:ready label resolves to initial work, observation, or revision from the trusted attempt record without creating a parallel writer.',
  },
  checkpointContinuation: {
    id: 'REQ-CANDIDATE-CONTINUE',
    statement:
      'A valid cumulative checkpoint is the sole continuation authority after interruption or failed qualification; an expired, base-mismatched, request-mismatched, or tampered checkpoint requires operator input and is never silently reconstructed. A newly accepted objective may retain the patch but must discard and reacquire objective-specific source evidence and reset escalation.',
  },
  boundedEscalation: {
    id: 'REQ-AGENT-ESCALATION-BOUND',
    statement:
      'One unchanged objective may use the fast worker and at most one qualified fallback worker; permission, authentication, quota, and unknown-outcome failures never trigger provider escalation.',
  },
  fastGateIsNotAcceptance: {
    id: 'REQ-QUALIFY-FAST-NOT-ACCEPT',
    statement:
      'A revision fast gate proves only its diff-derived scope; merge-ready acceptance requires one full qualification receipt for the exact proposal commit and tree.',
  },
  latencyBreachesPreserveWork: {
    id: 'REQ-LATENCY-PRESERVE',
    statement:
      'Crossing a target or hard latency reporting threshold records an SLO breach but never requests cancellation, invalidates candidate work, or removes the latest recoverable checkpoint.',
  },
} as const
