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

export type UiRequestQualificationPlan =
  | 'docs-only'
  | 'request-tooling'
  | 'family-scoped'
  | 'global-ui'

export type UiRequestCandidateCheckpoint = {
  readonly version: 1
  readonly request: GitHubIssueUrl
  readonly issue: number
  readonly attempt: string
  readonly objectiveSha256: string
  readonly baseSha: string
  readonly patch: UiRequestArtifactDigest
  readonly sourceEvidence: UiRequestArtifactDigest | null
  readonly worker: {
    readonly provider: string
    readonly model: string
    readonly reasoningEffort: 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'
    readonly escalation: 0 | 1
  }
  readonly qualification: {
    readonly state: 'pending' | 'passed' | 'failed'
    readonly plan: UiRequestQualificationPlan
    readonly diagnostic?: string
  }
  readonly timestamps: {
    readonly createdAt: string
    readonly updatedAt: string
    readonly expiresAt: string
  }
}

export type UiRequestArtifactDigest = {
  readonly path: string
  readonly sha256: string
  readonly bytes: number
}

export type UiRequestLatencyObservation = {
  readonly phase:
    | 'admission'
    | 'warm-proposal'
    | 'cold-proposal'
    | 'revision'
    | 'fast-gate'
    | 'merge-ready'
    | 'release-compute'
  readonly elapsedMs: number
  readonly targetMs: number
  readonly hardMs: number
  readonly status: 'within-target' | 'target-breached' | 'hard-breached'
  /** Reporting thresholds never cancel work or invalidate its checkpoint. */
  readonly cancellationRequested: false
}
