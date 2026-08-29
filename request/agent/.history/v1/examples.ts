import type { ManagedAgent, ManagedAgentRun } from './api.js'

declare const agent: ManagedAgent

const first = await agent.dispatch(
  {
    request: 'https://github.com/astrale-os/ui/issues/123',
    objective: 'Find and faithfully adapt an MIT async combobox matching the request.',
    target: {
      kind: 'repository',
      repository: 'https://github.com/astrale-os/ui',
      baseRef: 'main',
    },
  },
  { idempotencyKey: 'ui-request:123:attempt:1' },
)

if (first.kind === 'failed') throw new Error(first.failure.message)

let run: ManagedAgentRun = first.run
const observation = await agent.observe(run.ref)
if (observation.kind === 'observed') run = observation.run

if (run.state === 'succeeded') {
  const { pullRequest } = run

  await agent.dispatch(
    {
      request: 'https://github.com/astrale-os/ui/issues/123',
      objective: 'Address the accepted PR review and preserve all source-fidelity constraints.',
      target: { kind: 'pull-request', pullRequest },
    },
    { idempotencyKey: 'ui-request:123:attempt:2' },
  )
}
