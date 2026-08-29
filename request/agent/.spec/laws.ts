export const managedAgentLaws = {
  terminalMonotonic: {
    id: 'AGENT-RUN-TERMINAL',
    statement: 'A terminal normalized run never resumes; further work is a new run.',
  },
  successPullRequest: {
    id: 'AGENT-SUCCESS-PR',
    statement:
      'A succeeded run contains exactly one pull request in the repository admitted by its target.',
  },
  unknownOutcome: {
    id: 'AGENT-OUTCOME-UNKNOWN',
    statement:
      'When remote acceptance may have occurred but no run reference is known, retry and provider fallback are unsafe.',
  },
  reconcileDoesNotDispatch: {
    id: 'AGENT-RECONCILE-READONLY',
    statement: 'Reconciliation never starts, resumes, or mutates a remote managed run.',
  },
  abortIsLocal: {
    id: 'AGENT-ABORT-LOCAL',
    statement:
      'Aborting a local adapter operation never establishes that the remote run was cancelled.',
  },
  providerOpaque: {
    id: 'AGENT-PROVIDER-OPAQUE',
    statement:
      'Provider sessions, models, tools, environments, credentials, and response payloads never enter the normalized job.',
  },
} as const
