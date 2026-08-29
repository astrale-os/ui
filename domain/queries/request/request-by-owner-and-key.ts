import type { NodeId } from '@astrale-os/sdk/graph/node'
import type { QueryResult } from '@astrale-os/sdk/query'

import { Property, Query, defineQuery, queryResult } from '@astrale-os/sdk/query'

import type { UiSchema } from '#schema'

import { projectRequestRecord } from './request-record.js'

export interface RequestByOwnerAndKeyInput {
  readonly owner: NodeId
  readonly idempotencyKey: string
}

export const requestByOwnerAndKey = defineQuery<UiSchema>()((domain) => ({
  id: 'ui.request.by-owner-and-key',
  build(input: RequestByOwnerAndKeyInput) {
    return Query.from({ nodes: [domain.classes.Request] })
      .filter({
        predicate: Property(domain.classes.Request.properties.ownerId.key).equals(input.owner),
      })
      .filter({
        predicate: Property(domain.classes.Request.properties.idempotencyKey.key).equals(
          input.idempotencyKey,
        ),
      })
      .select({ kind: 'nodes', projection: { kind: 'value' } })
  },
  project: (result: QueryResult) => {
    const request = queryResult.optionalNode(result, 'owned Request key lookup')
    return request === undefined ? undefined : projectRequestRecord(domain, request)
  },
}))
