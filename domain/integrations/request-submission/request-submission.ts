import { defineIntegration } from '@astrale-os/sdk/integration'

export interface SubmitRequestInput {
  readonly requestId: string
  readonly intent: string
}

export type SubmitRequestResult =
  | { readonly kind: 'submitted'; readonly collaborationUrl: string }
  | { readonly kind: 'rejected' }
  | { readonly kind: 'outcome-unknown' }

export interface ReconcileRequestSubmissionInput {
  readonly requestId: string
  readonly notBefore: string
}

export type ReconcileRequestSubmissionResult =
  | { readonly kind: 'submitted'; readonly collaborationUrl: string }
  | { readonly kind: 'unresolved' }

export const requestSubmission = defineIntegration({
  id: 'ui-request-submission',
  operations: {
    submit: defineIntegration.operation<SubmitRequestInput, SubmitRequestResult>({
      replay: { kind: 'unsafe' },
    }),
    reconcile: defineIntegration.operation<
      ReconcileRequestSubmissionInput,
      ReconcileRequestSubmissionResult
    >({ replay: { kind: 'safe' } }),
  },
})
