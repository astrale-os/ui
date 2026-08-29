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
  /** Complete provider-independent instruction compiled by the trusted request owner. */
  readonly objective: string
  readonly target: ManagedAgentTarget
}

export type ManagedAgentRunRef = {
  /** Stable adapter identity, never a provider model name. */
  readonly provider: string
  /** Opaque adapter identity that may privately encode several provider identifiers. */
  readonly id: string
}

export type ManagedAgentDescriptor = {
  readonly provider: string
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
  readonly state: 'queued' | 'running'
}

type ManagedAgentWaitingRun = ManagedAgentRunBase & {
  readonly state: 'waiting-for-input' | 'waiting-for-approval' | 'blocked'
  readonly reason: string
}

type ManagedAgentSucceededRun = Omit<ManagedAgentRunBase, 'pullRequest'> & {
  readonly state: 'succeeded'
  readonly pullRequest: GitHubPullRequestUrl
}

type ManagedAgentFailedRun = ManagedAgentRunBase & {
  readonly state: 'failed' | 'expired'
  readonly failure: ManagedAgentFailure
}

type ManagedAgentCancelledRun = ManagedAgentRunBase & {
  readonly state: 'cancelled'
}

export type ManagedAgentRun =
  | ManagedAgentActiveRun
  | ManagedAgentWaitingRun
  | ManagedAgentSucceededRun
  | ManagedAgentFailedRun
  | ManagedAgentCancelledRun

export type ManagedAgentOperationOptions = {
  /** Cancels only the local HTTP operation; never implies remote-run cancellation. */
  readonly signal?: AbortSignal
}

export type ManagedAgentDispatchOptions = ManagedAgentOperationOptions & {
  /** Stable for one exact reserved request attempt. */
  readonly idempotencyKey: string
}

export type ManagedAgentDispatchResult =
  | { readonly kind: 'accepted'; readonly run: ManagedAgentRun }
  | { readonly kind: 'failed'; readonly failure: ManagedAgentFailure }

export type ManagedAgentObserveResult =
  | { readonly kind: 'observed'; readonly run: ManagedAgentRun }
  | { readonly kind: 'failed'; readonly failure: ManagedAgentFailure }

export type ManagedAgentReconcileResult =
  | { readonly kind: 'found'; readonly run: ManagedAgentRun }
  | { readonly kind: 'absent' }
  | { readonly kind: 'ambiguous' }
  | { readonly kind: 'failed'; readonly failure: ManagedAgentFailure }

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
  readonly descriptor: ManagedAgentDescriptor

  dispatch(
    job: ManagedAgentJob,
    options: ManagedAgentDispatchOptions,
  ): Promise<ManagedAgentDispatchResult>

  observe(
    ref: ManagedAgentRunRef,
    options?: ManagedAgentOperationOptions,
  ): Promise<ManagedAgentObserveResult>

  /** Resolve a prior `AGENT_OUTCOME_UNKNOWN` without starting another run. */
  reconcile(
    job: ManagedAgentJob,
    options: ManagedAgentDispatchOptions,
  ): Promise<ManagedAgentReconcileResult>

  cancel(
    ref: ManagedAgentRunRef,
    options?: ManagedAgentOperationOptions,
  ): Promise<ManagedAgentCancelResult>
}
