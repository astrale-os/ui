import type { Node } from '@astrale-os/sdk/graph/node'

import { NodeId, node } from '@astrale-os/sdk/graph/node'
import { normalizeProperties } from '@astrale-os/sdk/graph/properties'
import { executeQuery } from '@astrale-os/sdk/query'
import { schema as language } from '@astrale-os/sdk/schema'
import { vi } from 'vitest'

import { schema } from '#schema'

import { requestByOwnerAndKey } from '../index.js'

describe('Request Query', () => {
  it('reads at most one exact caller-owned idempotency key', async () => {
    const domain = language.resolve(schema)
    const query = vi.fn(async (_ast: unknown, _options: unknown) => nodePage([requestNode(domain)]))
    await expect(
      executeQuery({ query: query as never }, domain, requestByOwnerAndKey, {
        owner: NodeId('owner'),
        idempotencyKey: 'request-1',
      }),
    ).resolves.toEqual({
      id: 'request',
      ownerId: 'owner',
      intent: 'API status monitor',
      idempotencyKey: 'request-1',
      submission: 'pending',
      createdAt: '2026-08-29T12:00:00.000Z',
    })
    expect(query.mock.calls[0]?.[0]).toEqual({
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
      select: { kind: 'nodes', binding: 'n0', projection: { kind: 'value' } },
    })
  })

  it('returns absence and rejects ambiguous or incoherent receipts', async () => {
    const domain = language.resolve(schema)
    const input = { owner: NodeId('owner'), idempotencyKey: 'request-1' }
    await expect(
      executeQuery(
        { query: vi.fn(async () => nodePage([])) as never },
        domain,
        requestByOwnerAndKey,
        input,
      ),
    ).resolves.toBeUndefined()
    await expect(
      executeQuery(
        {
          query: vi.fn(async () =>
            nodePage([requestNode(domain), requestNode(domain, 'other')]),
          ) as never,
        },
        domain,
        requestByOwnerAndKey,
        input,
      ),
    ).rejects.toThrow('at most one')
    await expect(
      executeQuery(
        {
          query: vi.fn(async () =>
            nodePage([
              requestNode(domain, 'broken', {
                [domain.classes.Request.properties.submission.key]: 'submitted',
              }),
            ]),
          ) as never,
        },
        domain,
        requestByOwnerAndKey,
        input,
      ),
    ).rejects.toThrow('invalid properties')
  })
})

function requestNode(
  domain: ReturnType<typeof language.resolve<typeof schema>>,
  id = 'request',
  overrides: Record<string, unknown> = {},
): Node {
  const properties = domain.classes.Request.properties
  return node({
    id: NodeId(id),
    class: domain.classes.Request.key,
    props: normalizeProperties({
      [properties.ownerId.key]: 'owner',
      [properties.intent.key]: 'API status monitor',
      [properties.idempotencyKey.key]: 'request-1',
      [properties.submission.key]: 'pending',
      [properties.createdAt.key]: '2026-08-29T12:00:00.000Z',
      [properties.updatedAt.key]: '2026-08-29T12:00:00.000Z',
      ...overrides,
    }),
  })
}

function nodePage(nodes: readonly Node[]) {
  return {
    result: {
      kind: 'nodes' as const,
      nodes: nodes.map((value) => ({ kind: 'value' as const, value })),
    },
    page: {},
  }
}
