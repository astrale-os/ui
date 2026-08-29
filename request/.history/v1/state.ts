export const requestState = {
  initial: 'submitted',
  transitions: {
    submitted: {
      accept: 'accepted',
      requestInput: 'needs-input',
      decline: 'declined',
    },
    accepted: {
      startResearch: 'researching',
      requestInput: 'needs-input',
      decline: 'declined',
    },
    'needs-input': {
      resume: 'accepted',
      decline: 'declined',
    },
    researching: {
      openProposal: 'proposed',
      requestInput: 'needs-input',
      decline: 'declined',
    },
    proposed: {
      merge: 'completed',
      requestInput: 'needs-input',
      decline: 'declined',
    },
    completed: {},
    declined: {},
  },
} as const

export type RequestState = keyof typeof requestState.transitions
