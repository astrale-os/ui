import type {
  GitHubIssueUrl,
  GitHubPullRequestUrl,
  ManagedAgentFailure,
  ManagedAgentRun,
  ManagedAgentRunRef,
} from '../agent/.spec/api.js'

export type UiRequestOperation = 'auto' | 'run' | 'reconcile' | 'revise' | 'cancel'

export type UiRequestDiscussionId =
  | `issue-comment:${number}`
  | `pull-request-comment:${number}`
  | `pull-request-review:${number}`
  | `pull-request-review-comment:${number}`

export type UiRequestPreviewEvidence = {
  readonly version: 1
  readonly previews: readonly {
    readonly id: string
    readonly address: string
    readonly scene: string
    readonly screenshot: `screenshots/${string}.png`
  }[]
}

export type UiRequestAttemptRecord = {
  readonly version: 1
  readonly request: GitHubIssueUrl
  readonly issue: number
  readonly attempt: number
  readonly operation: 'initial' | 'revision'
  readonly idempotencyKey: string
  readonly objectiveSha256: string
  /** Legacy issue-only snapshot retained for records written before PR-native review. */
  readonly acceptedCommentIds?: readonly number[]
  readonly acceptedDiscussionIds?: readonly UiRequestDiscussionId[]
  readonly provider: string
  readonly state: 'reserved' | 'outcome-unknown' | ManagedAgentRun['state']
  readonly run?: ManagedAgentRunRef
  readonly providerUrl?: string
  readonly pullRequest?: GitHubPullRequestUrl
  readonly failure?: ManagedAgentFailure
  readonly updatedAt: string
}

export type UiRequestExecution = {
  readonly kind: 'updated' | 'unchanged'
  readonly record: UiRequestAttemptRecord
  readonly run?: ManagedAgentRun
}

export type UiRequestExecutionFailure = {
  readonly kind: 'failed'
  readonly failure: ManagedAgentFailure
  readonly record?: UiRequestAttemptRecord
}

export type UiRequestExecutionResult = UiRequestExecution | UiRequestExecutionFailure
