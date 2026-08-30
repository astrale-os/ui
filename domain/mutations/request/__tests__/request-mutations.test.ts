import { NodeId } from '@astrale-os/sdk/graph/node'
import { MutationResult, executeMutation, type MutationClient } from '@astrale-os/sdk/mutation'
import { schema as language } from '@astrale-os/sdk/schema'
import { vi } from 'vitest'

import { schema } from '#schema'

import {
  confirmRequestSubmission,
  createRequest,
  failRequestSubmission,
  reserveRequestSubmission,
  retryRequestSubmission,
} from '../index.js'

describe('Request Mutations', () => {
  it('creates one private Request behind an atomic per-owner key precondition', async () => {
    const domain = language.resolve(schema)
    const mutate = mutationClient({ request: NodeId('request') })
    await expect(
      executeMutation({ mutate }, domain, createRequest, {
        owner: NodeId('owner'),
        intent: 'API status monitor',
        idempotencyKey: 'request-1',
      }),
    ).resolves.toEqual({
      id: 'request',
      intent: 'API status monitor',
      idempotencyKey: 'request-1',
      submission: 'pending',
    })
    expect(mutate.mock.calls[0]?.[0]).toEqual({
      format: 'astrale.graph.mutation',
      version: 'v3',
      preconditions: [
        {
          kind: 'query',
          query: {
            format: 'astrale.graph.query',
            version: 'v6',
            source: {
              kind: 'node',
              terms: [{ kind: 'class', class: domain.classes.Request.ref }],
              binding: 'n0',
            },
            steps: [
              {
                op: 'filter',
                binding: 'n0',
                predicate: {
                  kind: 'property.equal',
                  property: domain.classes.Request.properties.ownerId.key,
                  value: 'owner',
                },
              },
              {
                op: 'filter',
                binding: 'n0',
                predicate: {
                  kind: 'property.equal',
                  property: domain.classes.Request.properties.idempotencyKey.key,
                  value: 'request-1',
                },
              },
            ],
            select: { kind: 'nodes', binding: 'n0', projection: { kind: 'reference' } },
          },
          equals: { kind: 'node', ids: [] },
        },
      ],
      operations: [
        {
          op: 'node.create',
          as: 'request',
          class: domain.classes.Request.key,
          props: {
            [domain.classes.Request.properties.intent.key]: 'API status monitor',
            [domain.classes.Request.properties.ownerId.key]: 'owner',
            [domain.classes.Request.properties.idempotencyKey.key]: 'request-1',
            [domain.classes.Request.properties.submission.key]: 'pending',
          },
        },
      ],
    })
  })

  it('reserves the uncertain boundary before the external effect', async () => {
    const domain = language.resolve(schema)
    const mutate = mutationClient()
    await executeMutation({ mutate }, domain, reserveRequestSubmission, {
      requestId: NodeId('request'),
      owner: NodeId('owner'),
    })
    expect(mutate.mock.calls[0]?.[0]).toEqual({
      format: 'astrale.graph.mutation',
      version: 'v3',
      preconditions: [
        {
          kind: 'node',
          node: '@request',
          class: domain.classes.Request.key,
          props: {
            equals: {
              [domain.classes.Request.properties.ownerId.key]: 'owner',
              [domain.classes.Request.properties.submission.key]: 'pending',
            },
            absent: [domain.classes.Request.properties.collaborationUrl.key],
          },
        },
      ],
      operations: [
        {
          op: 'node.update',
          node: '@request',
          class: domain.classes.Request.key,
          props: {
            set: { [domain.classes.Request.properties.submission.key]: 'outcome-unknown' },
            unset: [],
          },
        },
      ],
    })
  })

  it('atomically confirms the receipt only from the uncertain reservation', async () => {
    const domain = language.resolve(schema)
    const mutate = mutationClient()
    await executeMutation({ mutate }, domain, confirmRequestSubmission, {
      requestId: NodeId('request'),
      owner: NodeId('owner'),
      collaborationUrl: 'https://github.com/astrale-os/ui/issues/42',
    })
    const ast = mutate.mock.calls[0]?.[0]
    expect(ast).toEqual({
      format: 'astrale.graph.mutation',
      version: 'v3',
      preconditions: [
        {
          kind: 'node',
          node: '@request',
          class: domain.classes.Request.key,
          props: {
            equals: {
              [domain.classes.Request.properties.ownerId.key]: 'owner',
              [domain.classes.Request.properties.submission.key]: 'outcome-unknown',
            },
            absent: [domain.classes.Request.properties.collaborationUrl.key],
          },
        },
      ],
      operations: [
        {
          op: 'node.update',
          node: '@request',
          class: domain.classes.Request.key,
          props: {
            set: {
              [domain.classes.Request.properties.submission.key]: 'submitted',
              [domain.classes.Request.properties.collaborationUrl.key]:
                'https://github.com/astrale-os/ui/issues/42',
            },
            unset: [],
          },
        },
      ],
    })
  })

  it('moves a provider-proven rejection to failed and permits an explicit retry', async () => {
    const domain = language.resolve(schema)
    const failed = mutationClient()
    await executeMutation({ mutate: failed }, domain, failRequestSubmission, {
      requestId: NodeId('request'),
      owner: NodeId('owner'),
    })
    expect(failed.mock.calls[0]?.[0]).toEqual(
      transitionDocument(domain, 'outcome-unknown', 'failed'),
    )

    const retry = mutationClient()
    await executeMutation({ mutate: retry }, domain, retryRequestSubmission, {
      requestId: NodeId('request'),
      owner: NodeId('owner'),
    })
    expect(retry.mock.calls[0]?.[0]).toEqual(transitionDocument(domain, 'failed', 'pending'))
  })
})

function mutationClient(createdNodes: Record<string, ReturnType<typeof NodeId>> = {}) {
  return vi.fn<MutationClient['mutate']>(async () => MutationResult.decode({ createdNodes }))
}

function transitionDocument(
  domain: ReturnType<typeof language.resolve<typeof schema>>,
  from: 'outcome-unknown' | 'failed',
  to: 'failed' | 'pending',
) {
  return {
    format: 'astrale.graph.mutation',
    version: 'v3',
    preconditions: [
      {
        kind: 'node',
        node: '@request',
        class: domain.classes.Request.key,
        props: {
          equals: {
            [domain.classes.Request.properties.ownerId.key]: 'owner',
            [domain.classes.Request.properties.submission.key]: from,
          },
          absent: [domain.classes.Request.properties.collaborationUrl.key],
        },
      },
    ],
    operations: [
      {
        op: 'node.update',
        node: '@request',
        class: domain.classes.Request.key,
        props: {
          set: { [domain.classes.Request.properties.submission.key]: to },
          unset: [],
        },
      },
    ],
  }
}
