export const managedAgentCapabilities = {
  dispatch: {
    id: 'AGENT-DISPATCH',
    statement: 'A complete repository job can start one managed coding run.',
  },
  observe: {
    id: 'AGENT-OBSERVE',
    statement:
      'An accepted run can be observed after coordinator restart through an opaque reference.',
  },
  reconcile: {
    id: 'AGENT-RECONCILE',
    statement:
      'A reserved attempt with uncertain acceptance can be resolved as one found run, confirmed absence, or ambiguity without dispatching again.',
  },
  pullRequestDelivery: {
    id: 'AGENT-PR-DELIVERY',
    statement: 'Successful work is delivered as one ordinary GitHub pull request.',
  },
  replace: {
    id: 'AGENT-REPLACE',
    statement:
      'A later attempt can use another conforming provider without changing the request product contract.',
  },
  cancellationAwareness: {
    id: 'AGENT-CANCEL-AWARE',
    statement: 'Cancellation strength is observable and never overstated.',
  },
} as const
