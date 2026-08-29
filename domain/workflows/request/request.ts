import { defineWorkflow } from '@astrale-os/sdk/workflow'

import type { integrations } from '#integrations'
import type { CreatedRequest } from '#mutations/request'
import type { RequestRecord } from '#queries/request'
import type { UiSchema } from '#schema'

import {
  confirmRequestSubmission,
  createRequest,
  failRequestSubmission,
  reserveRequestSubmission,
  retryRequestSubmission,
} from '#mutations/request'
import { requestByOwnerAndKey } from '#queries/request'

export const requestWorkflow = defineWorkflow<UiSchema, typeof integrations>()(
  'request',
  async ({ caller, graph, input, integrations, mutate, step }) => {
    if (input.intent.trim().length === 0 || input.idempotencyKey.trim().length === 0) {
      throw new TypeError('UI request intent and idempotency key must contain text.')
    }
    const read = (id: string) =>
      step.run(id, () =>
        graph.self.query(requestByOwnerAndKey, {
          owner: caller.principal,
          idempotencyKey: input.idempotencyKey,
        }),
      )
    const observed = await read('read-request')
    let current: RequestRecord | CreatedRequest
    if (observed === undefined) {
      try {
        current = await step.run('create-request', () =>
          mutate(createRequest, {
            owner: caller.principal,
            intent: input.intent,
            idempotencyKey: input.idempotencyKey,
          }),
        )
      } catch (cause) {
        const concurrent = await read('read-request-after-create-conflict')
        if (concurrent === undefined) throw cause
        current = concurrent
      }
    } else {
      current = observed
    }

    for (let contention = 0; contention < 4; contention += 1) {
      if (current.intent !== input.intent) {
        return { state: 'conflict' as const, requestId: current.id }
      }

      if (current.submission === 'submitted') {
        return {
          state: 'submitted' as const,
          requestId: current.id,
          collaborationUrl: current.collaborationUrl,
        }
      }

      if (current.submission === 'outcome-unknown') {
        const uncertain = current
        if (!('createdAt' in uncertain)) {
          throw new TypeError('An uncertain Request is missing its durable creation time.')
        }
        const reconciliation = await step.run('reconcile-submission', () =>
          integrations.requestSubmission.reconcile({
            requestId: uncertain.id,
            notBefore: uncertain.createdAt,
          }),
        )
        if (reconciliation.kind === 'submitted') {
          try {
            await step.run('confirm-submission-after-reconciliation', () =>
              mutate(confirmRequestSubmission, {
                requestId: current.id,
                owner: caller.principal,
                collaborationUrl: collaborationUrl(reconciliation.collaborationUrl),
              }),
            )
          } catch (cause) {
            const settled = await read('read-request-after-reconciliation-conflict')
            if (
              settled?.submission !== 'submitted' ||
              settled.collaborationUrl !== reconciliation.collaborationUrl
            ) {
              throw cause
            }
          }
          return {
            state: 'submitted' as const,
            requestId: current.id,
            collaborationUrl: reconciliation.collaborationUrl,
          }
        }
        // A read-only scan cannot prove that an interrupted or in-flight POST never committed.
        // Unknown submissions therefore never authorize an automatic retry.
        return { state: 'outcome-unknown' as const, requestId: current.id }
      }

      if (current.submission === 'failed') {
        try {
          await step.run('retry-submission', () =>
            mutate(retryRequestSubmission, { requestId: current.id, owner: caller.principal }),
          )
          current = { ...current, submission: 'pending' }
        } catch (cause) {
          const concurrent = await read('read-request-after-retry-conflict')
          if (concurrent === undefined) throw cause
          current = concurrent
          continue
        }
      }

      try {
        await step.run('reserve-submission', () =>
          mutate(reserveRequestSubmission, { requestId: current.id, owner: caller.principal }),
        )
      } catch (cause) {
        const concurrent = await read('read-request-after-reservation-conflict')
        if (concurrent === undefined) throw cause
        current = concurrent
        continue
      }

      const submission = await step.run('submit-request', () =>
        integrations.requestSubmission.submit({ requestId: current.id, intent: current.intent }),
      )
      if (submission.kind === 'submitted') {
        const admittedUrl = collaborationUrl(submission.collaborationUrl)
        try {
          await step.run('confirm-submission-after-create', () =>
            mutate(confirmRequestSubmission, {
              requestId: current.id,
              owner: caller.principal,
              collaborationUrl: admittedUrl,
            }),
          )
        } catch (cause) {
          const settled = await read('read-request-after-confirmation-conflict')
          if (settled?.submission !== 'submitted' || settled.collaborationUrl !== admittedUrl) {
            throw cause
          }
        }
        return {
          state: 'submitted' as const,
          requestId: current.id,
          collaborationUrl: admittedUrl,
        }
      }
      if (submission.kind === 'rejected') {
        await step.run('fail-rejected-submission', () =>
          mutate(failRequestSubmission, { requestId: current.id, owner: caller.principal }),
        )
        return { state: 'failed' as const, requestId: current.id }
      }
      return { state: 'outcome-unknown' as const, requestId: current.id }
    }

    const latest = await read('read-request-after-contention')
    if (latest === undefined) throw new TypeError('Request contention lost its durable identity.')
    if (latest.intent !== input.intent) {
      return { state: 'conflict' as const, requestId: latest.id }
    }
    return latest.submission === 'submitted'
      ? {
          state: 'submitted' as const,
          requestId: latest.id,
          collaborationUrl: latest.collaborationUrl,
        }
      : { state: latest.submission, requestId: latest.id }
  },
)

function collaborationUrl(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new TypeError('Request submission returned an invalid collaboration URL.')
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username.length !== 0 ||
    parsed.password.length !== 0 ||
    parsed.href !== value
  ) {
    throw new TypeError('Request submission returned an invalid collaboration URL.')
  }
  return value
}
