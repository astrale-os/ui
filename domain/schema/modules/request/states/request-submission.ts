import { stateMachine, type EventOf, type StateOf } from '@astrale-os/sdk/state'

export const requestSubmission = stateMachine({
  initial: 'pending',
  transitions: {
    pending: {
      uncertain: 'outcome-unknown',
    },
    'outcome-unknown': {
      reconcile: 'submitted',
      reject: 'failed',
    },
    failed: { retry: 'pending' },
    submitted: {},
  },
})

export type RequestSubmission = StateOf<typeof requestSubmission>
export type RequestSubmissionEvent = EventOf<typeof requestSubmission>
