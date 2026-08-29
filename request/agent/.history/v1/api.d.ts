import type { ManagedAgentRunState } from './state.js'

export type GitHubRepositoryUrl = `https://github.com/${string}/${string}`
export type GitHubIssueUrl = `${GitHubRepositoryUrl}/issues/${number}`
export type GitHubPullRequestUrl = `${GitHubRepositoryUrl}/pull/${number}`

export type ManagedAgentTarget =
  | {
      readonly kind: 'repository'
      readonly repository: GitHubRepositoryUrl
      readonly baseRef: string
    }
  | {
      readonly kind: 'pull-request'
      readonly pullRequest: GitHubPullRequestUrl
    }

export type ManagedAgentJob = {
  readonly request: GitHubIssueUrl
  /** Complete provider-independent instruction compiled by the request owner. */
  readonly objective: string
  readonly target: ManagedAgentTarget
}

export type ManagedAgentRunRef = {
  /** Stable adapter identity; not a model name. */
  readonly provider: string
  /** Opaque adapter identity; it may privately encode provider session and run identities. */
  readonly id: string
}

export type ManagedAgentDescriptor = {
  readonly provider: string
  /** Maximum cancellation guarantee qualified for this adapter. */
  readonly cancellation: 'none' | 'best-effort' | 'confirmed'
}

export type ManagedAgentRetry = 'safe' | 'after-change' | 'unsafe'

export type ManagedAgentFailure = {
  readonly code:
    | 'AGENT_AUTH_REQUIRED'
    | 'AGENT_PERMISSION_DENIED'
    | 'AGENT_QUOTA_EXHAUSTED'
    | 'AGENT_INVALID_JOB'
    | 'AGENT_NOT_FOUND'
    | 'AGENT_UNAVAILABLE'
    | 'AGENT_OUTCOME_UNKNOWN'
    | 'AGENT_PROTOCOL_INCOMPATIBLE'
  readonly message: string
  readonly retry: ManagedAgentRetry
}

type ManagedAgentRunBase = {
  readonly ref: ManagedAgentRunRef
  readonly providerUrl?: string
  readonly branch?: string
  /** An early or retained proposal artifact; success requires this field. */
  readonly pullRequest?: GitHubPullRequestUrl
  /** ISO 8601 timestamp. */
  readonly createdAt: string
  /** ISO 8601 timestamp. */
  readonly updatedAt: string
}

type ManagedAgentActiveRun = ManagedAgentRunBase & {
  readonly state: Extract<ManagedAgentRunState, 'queued' | 'running'>
}

type ManagedAgentWaitingRun = ManagedAgentRunBase & {
  readonly state: Extract<
    ManagedAgentRunState,
    'waiting-for-input' | 'waiting-for-approval' | 'blocked'
  >
  readonly reason: string
}

type ManagedAgentSucceededRun = Omit<ManagedAgentRunBase, 'pullRequest'> & {
  readonly state: Extract<ManagedAgentRunState, 'succeeded'>
  readonly pullRequest: GitHubPullRequestUrl
}

type ManagedAgentFailedRun = ManagedAgentRunBase & {
  readonly state: Extract<ManagedAgentRunState, 'failed' | 'expired'>
  readonly failure: ManagedAgentFailure
}

type ManagedAgentCancelledRun = ManagedAgentRunBase & {
  readonly state: Extract<ManagedAgentRunState, 'cancelled'>
}

export type ManagedAgentRun =
  | ManagedAgentActiveRun
  | ManagedAgentWaitingRun
  | ManagedAgentSucceededRun
  | ManagedAgentFailedRun
  | ManagedAgentCancelledRun

export type ManagedAgentDispatchOptions = {
  /** Stable per-request-attempt key. Reuse only when retrying the exact same dispatch. */
  readonly idempotencyKey: string
  /** Cancels only the local API call; it does not imply remote-run cancellation. */
  readonly signal?: AbortSignal
}

export type ManagedAgentObserveOptions = {
  readonly signal?: AbortSignal
}

export type ManagedAgentDispatchResult =
  | {
      readonly kind: 'accepted'
      readonly deduplicated: boolean
      readonly run: ManagedAgentRun
    }
  | {
      readonly kind: 'failed'
      readonly failure: ManagedAgentFailure
    }

export type ManagedAgentObserveResult =
  | {
      readonly kind: 'observed'
      readonly run: ManagedAgentRun
    }
  | {
      readonly kind: 'failed'
      readonly failure: ManagedAgentFailure
    }

export type ManagedAgentCancelResult =
  | {
      readonly kind: 'cancelled'
      readonly run: Extract<ManagedAgentRun, { readonly state: 'cancelled' }>
    }
  | { readonly kind: 'requested'; readonly run: ManagedAgentRun }
  | { readonly kind: 'unsupported'; readonly run: ManagedAgentRun }
  | {
      readonly kind: 'already-terminal'
      readonly run: Extract<
        ManagedAgentRun,
        { readonly state: 'succeeded' | 'failed' | 'cancelled' | 'expired' }
      >
    }
  | { readonly kind: 'failed'; readonly failure: ManagedAgentFailure }

export interface ManagedAgent {
  /** Static, qualified adapter identity. Account readiness is checked by operations. */
  readonly descriptor: ManagedAgentDescriptor

  dispatch(
    job: ManagedAgentJob,
    options: ManagedAgentDispatchOptions,
  ): Promise<ManagedAgentDispatchResult>

  observe(
    ref: ManagedAgentRunRef,
    options?: ManagedAgentObserveOptions,
  ): Promise<ManagedAgentObserveResult>

  cancel(
    ref: ManagedAgentRunRef,
    options?: ManagedAgentObserveOptions,
  ): Promise<ManagedAgentCancelResult>
}
