import type { NodeId } from '@astrale-os/sdk/graph/node'

import { LocalBinding } from '@astrale-os/sdk/graph'
import { defineMutation } from '@astrale-os/sdk/mutation'
import { Property, Query } from '@astrale-os/sdk/query'

import type { UiSchema } from '#schema'

import { requestSubmission } from '#schema/modules/request/states'

const createdRequest = LocalBinding('request')

export interface CreateRequestInput {
  readonly owner: NodeId
  readonly intent: string
  readonly idempotencyKey: string
}

export interface CreatedRequest {
  readonly id: NodeId
  readonly intent: string
  readonly idempotencyKey: string
  readonly submission: 'pending'
}

export const createRequest = defineMutation<UiSchema>()((domain) => ({
  id: 'ui.request.create',
  build(input: CreateRequestInput, mutation) {
    const duplicate = Query.from({ nodes: [domain.classes.Request] })
      .filter({
        predicate: Property(domain.classes.Request.properties.ownerId.key).equals(input.owner),
      })
      .filter({
        predicate: Property(domain.classes.Request.properties.idempotencyKey.key).equals(
          input.idempotencyKey,
        ),
      })
      .select({ kind: 'nodes', projection: { kind: 'reference' } })
    mutation.expect.query({ query: duplicate, equals: { kind: 'node', ids: [] } })
    mutation.createNode({
      as: createdRequest,
      class: domain.classes.Request,
      props: {
        ownerId: input.owner,
        intent: input.intent,
        idempotencyKey: input.idempotencyKey,
        submission: requestSubmission.initial,
      },
    })
  },
  project(result, input): CreatedRequest {
    const id = result.createdNodes[createdRequest]
    if (id === undefined) throw new TypeError('Request creation omitted its identity.')
    return Object.freeze({
      id,
      intent: input.intent,
      idempotencyKey: input.idempotencyKey,
      submission: 'pending',
    })
  },
}))
