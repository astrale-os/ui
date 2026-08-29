import type { ManagedAgent, ManagedAgentRun } from '../api.js'

declare const agent: ManagedAgent

const dispatched = await agent.dispatch(
  {
    request: 'https://github.com/astrale-os/ui/issues/123',
    objective: 'Faithfully adapt the selected source and open one qualified pull request.',
    target: {
      kind: 'repository',
      repository: 'https://github.com/astrale-os/ui',
      baseRef: 'main',
    },
  },
  { idempotencyKey: 'ui-request:123:attempt:1' },
)

if (dispatched.kind === 'failed') throw new Error(dispatched.failure.message)

let run: ManagedAgentRun = dispatched.run
const observed = await agent.observe(run.ref)
if (observed.kind === 'observed') run = observed.run

if (run.state === 'succeeded') {
  await agent.dispatch(
    {
      request: 'https://github.com/astrale-os/ui/issues/123',
      objective: 'Address the accepted review without changing source-faithful defaults.',
      target: { kind: 'pull-request', pullRequest: run.pullRequest },
    },
    { idempotencyKey: 'ui-request:123:attempt:2' },
  )
}
