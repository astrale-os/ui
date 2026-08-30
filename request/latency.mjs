import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { uiRequestLatencyBudgets } from './.spec/limits.ts'

const phaseBudgets = Object.freeze({
  admission: uiRequestLatencyBudgets.admission,
  'warm-proposal': uiRequestLatencyBudgets.warmProposal,
  'cold-proposal': uiRequestLatencyBudgets.coldProposal,
  revision: uiRequestLatencyBudgets.revision,
  'fast-gate': uiRequestLatencyBudgets.fastGate,
  'merge-ready': uiRequestLatencyBudgets.mergeReady,
  'release-compute': uiRequestLatencyBudgets.releaseCompute,
})

export function observeUiRequestLatency(phase, elapsedMs) {
  const budget = phaseBudgets[phase]
  if (!budget) throw new TypeError(`Unknown UI request latency phase: ${phase}`)
  if (!Number.isSafeInteger(elapsedMs) || elapsedMs < 0) {
    throw new TypeError('elapsedMs must be a non-negative safe integer')
  }
  const status =
    elapsedMs > budget.hardMs
      ? 'hard-breached'
      : elapsedMs > budget.targetMs
        ? 'target-breached'
        : 'within-target'
  return Object.freeze({
    phase,
    elapsedMs,
    targetMs: budget.targetMs,
    hardMs: budget.hardMs,
    status,
    cancellationRequested: false,
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const phase = process.argv[2]
  const elapsedMs = Number(process.argv[3])
  const output = process.argv[4]
  Promise.resolve(observeUiRequestLatency(phase, elapsedMs))
    .then(async (observation) => {
      const serialized = `${JSON.stringify(observation, null, 2)}\n`
      if (output) await writeFile(output, serialized)
      process.stdout.write(serialized)
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : 'latency failed'}\n`)
      process.exitCode = 1
    })
}
