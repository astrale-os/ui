import type {
  GitHubIssueUrl,
  GitHubPullRequestUrl,
  ManagedAgentFailure,
  ManagedAgentRun,
  ManagedAgentRunRef,
} from '../agent/.spec/api.js'

export type UiRequestOperation = 'run' | 'reconcile' | 'revise' | 'cancel'

export type UiRequestAttemptRecord = {
  readonly version: 1
  readonly request: GitHubIssueUrl
  readonly issue: number
  readonly attempt: number
  readonly operation: 'initial' | 'revision'
  readonly idempotencyKey: string
  readonly objectiveSha256: string
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
