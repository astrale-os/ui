import assert from 'node:assert/strict'
import test from 'node:test'

import { uiRequestLatencyBudgets } from './.spec/limits.ts'
import { observeUiRequestLatency } from './latency.mjs'

test('classifies target and hard thresholds without ever requesting cancellation', () => {
  const budget = uiRequestLatencyBudgets.fastGate
  assert.deepEqual(observeUiRequestLatency('fast-gate', budget.targetMs), {
    phase: 'fast-gate',
    elapsedMs: budget.targetMs,
    targetMs: budget.targetMs,
    hardMs: budget.hardMs,
    status: 'within-target',
    cancellationRequested: false,
  })
  assert.equal(observeUiRequestLatency('fast-gate', budget.targetMs + 1).status, 'target-breached')
  const hard = observeUiRequestLatency('fast-gate', budget.hardMs + 1)
  assert.equal(hard.status, 'hard-breached')
  assert.equal(hard.cancellationRequested, false)
})
