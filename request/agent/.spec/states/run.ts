export const managedAgentRunState = {
  initial: 'queued',
  transitions: {
    queued: {
      begin: 'running',
      requestInput: 'waiting-for-input',
      requestApproval: 'waiting-for-approval',
      block: 'blocked',
      succeed: 'succeeded',
      fail: 'failed',
      cancel: 'cancelled',
      expire: 'expired',
    },
    running: {
      requestInput: 'waiting-for-input',
      requestApproval: 'waiting-for-approval',
      block: 'blocked',
      succeed: 'succeeded',
      fail: 'failed',
      cancel: 'cancelled',
      expire: 'expired',
    },
    'waiting-for-input': {
      resume: 'running',
      fail: 'failed',
      cancel: 'cancelled',
      expire: 'expired',
    },
    'waiting-for-approval': {
      resume: 'running',
      fail: 'failed',
      cancel: 'cancelled',
      expire: 'expired',
    },
    blocked: {
      resume: 'queued',
      fail: 'failed',
      cancel: 'cancelled',
      expire: 'expired',
    },
    succeeded: {},
    failed: {},
    cancelled: {},
    expired: {},
  },
} as const

export type ManagedAgentRunState = keyof typeof managedAgentRunState.transitions
