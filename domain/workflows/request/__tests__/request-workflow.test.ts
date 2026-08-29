import { NodeId } from '@astrale-os/sdk/graph/node'
import { vi } from 'vitest'

import {
  confirmRequestSubmission,
  createRequest,
  failRequestSubmission,
  reserveRequestSubmission,
  retryRequestSubmission,
} from '#mutations/request'
import { requestByOwnerAndKey, type RequestRecord } from '#queries/request'

import { requestWorkflow } from '../index.js'

const owner = NodeId('owner')
const requestId = NodeId('request')
const input = { intent: 'API status monitor', idempotencyKey: 'request-1' }
const collaborationUrl = 'https://github.com/astrale-os/ui/issues/42'

describe('request Workflow', () => {
  it('creates, reserves, submits, and confirms one new request in exact effect order', async () => {
    const effects = harness()
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'submitted',
      requestId,
      collaborationUrl,
    })
    expect(effects.events).toEqual([
      'step:read-request',
      'query:request',
      'step:create-request',
      'mutation:create',
      'step:reserve-submission',
      'mutation:reserve',
      'step:submit-request',
      'provider:submit',
      'step:confirm-submission-after-create',
      'mutation:confirm',
    ])
    expect(effects.queries).toEqual([
      {
        definition: requestByOwnerAndKey,
        input: { owner, idempotencyKey: input.idempotencyKey },
      },
    ])
    expect(effects.mutations).toEqual([
      { definition: createRequest, input: { owner, ...input } },
      { definition: reserveRequestSubmission, input: { requestId, owner } },
      {
        definition: confirmRequestSubmission,
        input: { requestId, owner, collaborationUrl },
      },
    ])
    expect(effects.submit).toHaveBeenCalledExactlyOnceWith({ requestId, intent: input.intent })
  })

  it('replays an already submitted receipt without another graph or provider effect', async () => {
    const effects = harness({ request: record('submitted') })
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'submitted',
      requestId,
      collaborationUrl,
    })
    expect(effects.events).toEqual(['step:read-request', 'query:request'])
  })

  it('reconciles an uncertain outcome without attempting another submission', async () => {
    const effects = harness({
      request: record('outcome-unknown'),
      reconciliation: { kind: 'submitted', collaborationUrl },
    })
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'submitted',
      requestId,
      collaborationUrl,
    })
    expect(effects.events).toEqual([
      'step:read-request',
      'query:request',
      'step:reconcile-submission',
      'provider:reconcile',
      'step:confirm-submission-after-reconciliation',
      'mutation:confirm',
    ])
    expect(effects.mutations).toEqual([
      {
        definition: confirmRequestSubmission,
        input: { requestId, owner, collaborationUrl },
      },
    ])
    expect(effects.reconcile).toHaveBeenCalledExactlyOnceWith({
      requestId,
      notBefore: '2026-08-29T12:00:00.000Z',
    })
  })

  it('never turns an incomplete read-only reconciliation into permission to resubmit', async () => {
    const effects = harness({
      request: record('outcome-unknown'),
      reconciliation: { kind: 'unresolved' },
    })
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'outcome-unknown',
      requestId,
    })
    expect(effects.events).toEqual([
      'step:read-request',
      'query:request',
      'step:reconcile-submission',
      'provider:reconcile',
    ])
    expect(effects.mutations).toEqual([])
  })

  it('retries only a provider-proven rejection and reserves again before the provider', async () => {
    const effects = harness({ request: record('failed') })
    await requestWorkflow.run(effects.context())
    expect(effects.events).toEqual([
      'step:read-request',
      'query:request',
      'step:retry-submission',
      'mutation:retry',
      'step:reserve-submission',
      'mutation:reserve',
      'step:submit-request',
      'provider:submit',
      'step:confirm-submission-after-create',
      'mutation:confirm',
    ])
    expect(effects.mutations).toEqual([
      { definition: retryRequestSubmission, input: { requestId, owner } },
      { definition: reserveRequestSubmission, input: { requestId, owner } },
      {
        definition: confirmRequestSubmission,
        input: { requestId, owner, collaborationUrl },
      },
    ])
  })

  it('preserves the uncertain reservation when the provider throws', async () => {
    const failure = new Error('transport failed after effect boundary')
    const effects = harness({ submissionFailure: failure })
    await expect(requestWorkflow.run(effects.context())).rejects.toBe(failure)
    expect(effects.events).toEqual([
      'step:read-request',
      'query:request',
      'step:create-request',
      'mutation:create',
      'step:reserve-submission',
      'mutation:reserve',
      'step:submit-request',
      'provider:submit',
    ])
  })

  it('settles only provider-proven rejection and retains uncertain provider outcomes', async () => {
    const rejected = harness({ submission: { kind: 'rejected' } })
    await expect(requestWorkflow.run(rejected.context())).resolves.toEqual({
      state: 'failed',
      requestId,
    })
    expect(rejected.mutations).toEqual([
      { definition: createRequest, input: { owner, ...input } },
      { definition: reserveRequestSubmission, input: { requestId, owner } },
      { definition: failRequestSubmission, input: { requestId, owner } },
    ])
    expect(rejected.events).toEqual([
      'step:read-request',
      'query:request',
      'step:create-request',
      'mutation:create',
      'step:reserve-submission',
      'mutation:reserve',
      'step:submit-request',
      'provider:submit',
      'step:fail-rejected-submission',
      'mutation:fail',
    ])

    const uncertain = harness({ submission: { kind: 'outcome-unknown' } })
    await expect(requestWorkflow.run(uncertain.context())).resolves.toEqual({
      state: 'outcome-unknown',
      requestId,
    })
    expect(uncertain.mutations).toEqual([
      { definition: createRequest, input: { owner, ...input } },
      { definition: reserveRequestSubmission, input: { requestId, owner } },
    ])
    expect(uncertain.events).toEqual([
      'step:read-request',
      'query:request',
      'step:create-request',
      'mutation:create',
      'step:reserve-submission',
      'mutation:reserve',
      'step:submit-request',
      'provider:submit',
    ])
  })

  it('returns an explicit conflict for key reuse before any write or provider effect', async () => {
    const effects = harness({ request: { ...record('pending'), intent: 'Other request' } })
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'conflict',
      requestId,
    })
    expect(effects.events).toEqual(['step:read-request', 'query:request'])
    expect(effects.mutations).toEqual([])
  })

  it('recovers an atomic create collision by rereading the winning request', async () => {
    const collision = new Error('mutation precondition failed')
    const effects = harness({
      requests: [undefined, record('pending')],
      mutationFailures: new Map([[createRequest, [collision]]]),
    })
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'submitted',
      requestId,
      collaborationUrl,
    })
    expect(effects.events.slice(0, 7)).toEqual([
      'step:read-request',
      'query:request',
      'step:create-request',
      'mutation:create',
      'step:read-request-after-create-conflict',
      'query:request',
      'step:reserve-submission',
    ])
    expect(effects.submit).toHaveBeenCalledTimes(1)
  })

  it('loses a concurrent reservation safely without making a second provider call', async () => {
    const collision = new Error('state transition precondition failed')
    const effects = harness({
      requests: [record('pending'), record('outcome-unknown')],
      mutationFailures: new Map([[reserveRequestSubmission, [collision]]]),
    })
    await expect(requestWorkflow.run(effects.context())).resolves.toEqual({
      state: 'outcome-unknown',
      requestId,
    })
    expect(effects.events).toEqual([
      'step:read-request',
      'query:request',
      'step:reserve-submission',
      'mutation:reserve',
      'step:read-request-after-reservation-conflict',
      'query:request',
      'step:reconcile-submission',
      'provider:reconcile',
    ])
    expect(effects.submit).toHaveBeenCalledTimes(0)
  })

  it('rejects a malformed provider receipt before it can enter the graph', async () => {
    const effects = harness({
      submission: { kind: 'submitted', collaborationUrl: 'javascript:alert(1)' },
    })
    await expect(requestWorkflow.run(effects.context())).rejects.toThrow(
      'invalid collaboration URL',
    )
    expect(effects.mutations).toEqual([
      { definition: createRequest, input: { owner, ...input } },
      { definition: reserveRequestSubmission, input: { requestId, owner } },
    ])
  })

  it('rejects meaningless text before any graph or provider effect', async () => {
    const effects = harness()
    const context = effects.context() as unknown as { input: typeof input }
    context.input = { ...input, intent: '   ' }
    await expect(requestWorkflow.run(context as never)).rejects.toThrow('must contain text')
    expect(effects.events).toEqual([])
    expect(effects.mutations).toEqual([])
  })
})

function record(state: RequestRecord['submission']): RequestRecord {
  const base = {
    id: requestId,
    ownerId: owner,
    intent: input.intent,
    idempotencyKey: input.idempotencyKey,
    createdAt: '2026-08-29T12:00:00.000Z',
  }
  return state === 'submitted'
    ? { ...base, submission: state, collaborationUrl }
    : { ...base, submission: state }
}

function harness(
  options: {
    readonly request?: RequestRecord
    readonly requests?: readonly (RequestRecord | undefined)[]
    readonly mutationFailures?: ReadonlyMap<unknown, readonly Error[]>
    readonly submissionFailure?: Error
    readonly submission?:
      | { readonly kind: 'submitted'; readonly collaborationUrl: string }
      | { readonly kind: 'rejected' | 'outcome-unknown' }
    readonly reconciliation?:
      | { readonly kind: 'submitted'; readonly collaborationUrl: string }
      | { readonly kind: 'unresolved' }
  } = {},
) {
  const events: string[] = []
  const queries: Array<{ definition: unknown; input: unknown }> = []
  const mutations: Array<{ definition: unknown; input: unknown }> = []
  let queryIndex = 0
  const failureQueues = new Map(
    [...(options.mutationFailures ?? new Map())].map(([definition, failures]) => [
      definition,
      [...failures],
    ]),
  )
  const submit = vi.fn(async () => {
    events.push('provider:submit')
    if (options.submissionFailure !== undefined) throw options.submissionFailure
    return options.submission ?? { kind: 'submitted' as const, collaborationUrl }
  })
  const reconcile = vi.fn(async () => {
    events.push('provider:reconcile')
    return options.reconciliation ?? { kind: 'unresolved' as const }
  })
  return {
    events,
    queries,
    mutations,
    submit,
    reconcile,
    context() {
      const query = async (definition: unknown, value: unknown) => {
        if (definition !== requestByOwnerAndKey) throw new TypeError('Unexpected Query.')
        events.push('query:request')
        queries.push({ definition, input: value })
        const sequence = options.requests ?? [options.request]
        const result = sequence[Math.min(queryIndex, sequence.length - 1)]
        queryIndex += 1
        return result
      }
      return {
        caller: { principal: owner },
        input,
        graph: { self: { query } },
        async mutate(definition: unknown, value: unknown) {
          mutations.push({ definition, input: value })
          events.push(`mutation:${mutationName(definition)}`)
          const failure = failureQueues.get(definition)?.shift()
          if (failure !== undefined) throw failure
          if (definition === createRequest) {
            return { id: requestId, ...input, submission: 'pending' as const }
          }
          if (
            definition !== retryRequestSubmission &&
            definition !== reserveRequestSubmission &&
            definition !== confirmRequestSubmission &&
            definition !== failRequestSubmission
          ) {
            throw new TypeError('Unexpected Mutation.')
          }
        },
        integrations: { requestSubmission: { submit, reconcile } },
        step: {
          run: async (id: string, operation: () => unknown) => {
            events.push(`step:${id}`)
            return operation()
          },
        },
      } as never
    },
  }
}

function mutationName(definition: unknown): string {
  if (definition === createRequest) return 'create'
  if (definition === retryRequestSubmission) return 'retry'
  if (definition === reserveRequestSubmission) return 'reserve'
  if (definition === confirmRequestSubmission) return 'confirm'
  if (definition === failRequestSubmission) return 'fail'
  return 'unexpected'
}
