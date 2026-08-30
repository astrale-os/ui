import type { Node } from '@astrale-os/sdk/graph/node'

import { NodeId } from '@astrale-os/sdk/graph/node'

import type { UiDomain } from '#schema'
import type { RequestSubmission } from '#schema/request/states'

interface RequestRecordBase {
  readonly id: NodeId
  readonly ownerId: NodeId
  readonly intent: string
  readonly idempotencyKey: string
  readonly createdAt: string
}

export type RequestRecord =
  | (RequestRecordBase & {
      readonly submission: 'submitted'
      readonly collaborationUrl: string
    })
  | (RequestRecordBase & {
      readonly submission: Exclude<RequestSubmission, 'submitted'>
      readonly collaborationUrl?: never
    })

export function projectRequestRecord(domain: UiDomain, node: Node): RequestRecord {
  const properties = domain.classes.Request.properties
  const ownerId = node.props[properties.ownerId.key]
  const intent = node.props[properties.intent.key]
  const idempotencyKey = node.props[properties.idempotencyKey.key]
  const submission = node.props[properties.submission.key]
  const createdAt = node.props[properties.createdAt.key]
  const collaborationUrl = node.props[properties.collaborationUrl.key]
  if (
    typeof ownerId !== 'string' ||
    typeof intent !== 'string' ||
    typeof idempotencyKey !== 'string' ||
    !['pending', 'outcome-unknown', 'failed', 'submitted'].includes(String(submission)) ||
    !canonicalInstant(createdAt) ||
    (collaborationUrl !== undefined && typeof collaborationUrl !== 'string') ||
    (submission === 'submitted') !== (typeof collaborationUrl === 'string')
  ) {
    throw new TypeError(`Request ${node.id} has invalid properties.`)
  }
  const base = {
    id: node.id,
    ownerId: NodeId(ownerId),
    intent,
    idempotencyKey,
    createdAt,
  }
  return submission === 'submitted'
    ? Object.freeze({ ...base, submission, collaborationUrl: collaborationUrl as string })
    : Object.freeze({ ...base, submission: submission as Exclude<RequestSubmission, 'submitted'> })
}

function canonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}
