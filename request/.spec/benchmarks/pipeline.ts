import { uiRequestLatencyBudgets } from '../limits.js'

export const uiRequestPipelineWorkloads = {
  admission: {
    sampleCount: 5,
    startsAt: 'authorized label event',
    endsAt: 'durable reservation and exact workflow dispatch acceptance',
    budget: uiRequestLatencyBudgets.admission,
  },
  warmProposal: {
    sampleCount: 5,
    startsAt: 'accepted request reservation with dependencies cached',
    endsAt: 'exact-revision playground preview availability',
    budget: uiRequestLatencyBudgets.warmProposal,
  },
  coldProposal: {
    sampleCount: 5,
    startsAt: 'accepted request reservation without runner caches',
    endsAt: 'exact-revision playground preview availability',
    budget: uiRequestLatencyBudgets.coldProposal,
  },
  revision: {
    sampleCount: 5,
    startsAt: 'accepted maintainer revision reservation',
    endsAt: 'refreshed exact-revision playground preview availability',
    budget: uiRequestLatencyBudgets.revision,
  },
  fastGate: {
    sampleCount: 5,
    startsAt: 'qualified candidate checkout',
    endsAt: 'diff-derived gate completion',
    budget: uiRequestLatencyBudgets.fastGate,
  },
  mergeReady: {
    sampleCount: 5,
    startsAt: 'authorized ui:merge-ready label',
    endsAt: 'exact-revision receipt availability',
    budget: uiRequestLatencyBudgets.mergeReady,
  },
  releaseCompute: {
    sampleCount: 5,
    startsAt: 'trusted publish job dependency installation complete',
    endsAt: 'public package upload accepted, excluding registry propagation',
    budget: uiRequestLatencyBudgets.releaseCompute,
  },
} as const
