import { schema as language } from '@astrale-os/sdk/schema'

import { schema } from '#schema'

function validate(candidate: unknown, value: unknown): readonly unknown[] {
  if (typeof candidate !== 'object' || candidate === null || !('validate' in candidate)) {
    throw new TypeError('Expected a compiled value schema')
  }

  return (candidate as { validate: (input: unknown) => readonly unknown[] }).validate(value)
}

describe('Request contract', () => {
  it('owns one Request identity and one request entry operation', () => {
    const domain = language.resolve(schema)
    expect(domain.source).toBe(schema)
    expect(domain.origin).toBe('ui.astrale.ai')
    expect(Object.keys(domain.dependencies)).toEqual(['kernel'])
    expect(Object.keys(domain.classes).sort()).toEqual(['Request', 'request_owned_by'])
    expect(Object.keys(domain.functions)).toEqual(['request'])
    expect(Object.keys(domain.views)).toEqual([])

    const request = domain.classes.Request
    expect(Object.keys(request.properties).sort()).toEqual([
      'byKey',
      'collaborationUrl',
      'createdAt',
      'from',
      'get',
      'idempotencyKey',
      'intent',
      'ownerId',
      'submission',
      'updatedAt',
    ])
    const submission = request.properties.submission
    const topology = submission.definition.state
    if (topology === undefined) throw new TypeError('Expected portable State topology')
    expect(topology).toEqual({
      initial: 'pending',
      transitions: {
        failed: { retry: 'pending' },
        'outcome-unknown': { reconcile: 'submitted', reject: 'failed' },
        pending: { uncertain: 'outcome-unknown' },
        submitted: {},
      },
    })
    for (const state of Object.keys(topology.transitions)) {
      expect(validate(submission, state), state).toEqual([])
    }
    expect(validate(submission, 'accepted')).not.toEqual([])
    expect(request.policies.read).toEqual([
      { origin: 'ui.astrale.ai', kind: 'policy', name: 'ManageRequest' },
    ])
    expect(domain.policies.ManageRequest.expression).toEqual({
      match: {
        source: { kind: 'subject' },
        class: { origin: 'ui.astrale.ai', kind: 'class', name: 'request_owned_by' },
        target: { kind: 'object' },
      },
    })

    const ownership = domain.classes.request_owned_by
    expect(ownership.definition.endpoints).toEqual({
      source: {
        role: 'owner',
        accepts: [{ origin: 'kernel.astrale.ai', kind: 'class', name: 'Identity' }],
        outgoing: '0..*',
      },
      target: {
        role: 'request',
        accepts: [{ origin: 'ui.astrale.ai', kind: 'class', name: 'Request' }],
        incoming: '0..1',
      },
    })
    expect(ownership.policies.traverse).toEqual([
      { origin: 'ui.astrale.ai', kind: 'policy', name: 'TraverseOwnedRequest' },
    ])
    expect(domain.policies.TraverseOwnedRequest.expression).toEqual({
      match: {
        allOf: [
          {
            source: { kind: 'source' },
            class: { origin: 'ui.astrale.ai', kind: 'class', name: 'request_owned_by' },
            target: { kind: 'target' },
          },
          {
            source: { kind: 'subject' },
            class: { origin: 'ui.astrale.ai', kind: 'class', name: 'request_owned_by' },
            target: { kind: 'target' },
          },
        ],
      },
    })

    expect(domain.functions.request.auth).toBe('authenticated')
    expect(
      domain.functions.request.validateInput({
        intent: 'API status monitor',
        idempotencyKey: 'request-1',
      }),
    ).toEqual([])
    expect(
      domain.functions.request.validateInput({ intent: '', idempotencyKey: 'request-1' }),
    ).not.toEqual([])
    expect(
      domain.functions.request.validateInput({
        intent: 'API status monitor',
        idempotencyKey: '',
      }),
    ).not.toEqual([])
    expect(
      domain.functions.request.validateOutput({
        state: 'submitted',
        requestId: 'request-node-id',
        collaborationUrl: 'https://github.com/astrale-os/ui/issues/1',
      }),
    ).toEqual([])
    expect(
      domain.functions.request.validateOutput({
        state: 'submitted',
        requestId: 'request-node-id',
      }),
    ).not.toEqual([])
    expect(
      domain.functions.request.validateOutput({
        state: 'conflict',
        requestId: 'request-node-id',
      }),
    ).toEqual([])
  })
})
