import { createHash } from 'node:crypto'

import { managedAgentLimits as limits } from '../.spec/limits.ts'
import { httpFailure, operationSignal, readBoundedJson, transportFailure } from '../src/http.mjs'
import {
  acceptIdempotencyKey,
  acceptManagedAgentRun,
  acceptManagedAgentJob,
  acceptProviderUrl,
  acceptRunRef,
  decodeRunIdentity,
  encodeRunIdentity,
  failure,
  intendedRepository,
  invalidJob,
  normalizedPrompt,
  parsePullRequestUrl,
  parseRepositoryUrl,
  terminalStates,
  utf8Bytes,
} from '../src/model.mjs'

const apiVersion = '2026-03-10'

function protocolFailure(
  message = 'GitHub Actions returned an incompatible workflow-run response.',
) {
  return failure('AGENT_PROTOCOL_INCOMPATIBLE', message, 'after-change')
}

function unknownOutcome(message) {
  return failure('AGENT_OUTCOME_UNKNOWN', message, 'unsafe')
}

/** The exact single-line run name the worker workflow publishes for one reserved attempt. */
export function attemptMarker(idempotencyKey) {
  return `Astrale attempt: ${idempotencyKey}`
}

export function deterministicBranch(idempotencyKey) {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,200}$/u.test(idempotencyKey) ||
    idempotencyKey.includes('..') ||
    idempotencyKey.endsWith('.lock')
  ) {
    throw new TypeError('idempotencyKey does not derive a deterministic branch')
  }
  const label = idempotencyKey.replaceAll(':', '-').slice(0, 80)
  const digest = createHash('sha256').update(idempotencyKey, 'utf8').digest('hex').slice(0, 20)
  return `astrale/${label}-${digest}`
}

function admitBranchRef(value, name) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    utf8Bytes(value) > 255 ||
    value.startsWith('-') ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.endsWith('.') ||
    value.endsWith('.lock') ||
    value.includes('..') ||
    value.includes('//') ||
    value.includes('@{') ||
    value.includes('[') ||
    /[\u0000-\u0020\u007f~^:?*\\]/u.test(value)
  ) {
    throw new TypeError(`${name} is not an admitted Git branch`)
  }
  return value
}

function runIdentity(ref, provider) {
  const decoded = decodeRunIdentity(ref.id)
  if (
    typeof decoded.owner !== 'string' ||
    typeof decoded.repo !== 'string' ||
    typeof decoded.branch !== 'string' ||
    typeof decoded.attempt !== 'string' ||
    typeof decoded.workflowRef !== 'string' ||
    typeof decoded.workflowActor !== 'string' ||
    !Number.isSafeInteger(decoded.run) ||
    decoded.run < 1 ||
    !Number.isSafeInteger(decoded.runAttempt) ||
    decoded.runAttempt < 1 ||
    (decoded.pullRequest !== undefined && typeof decoded.pullRequest !== 'string')
  ) {
    throw new TypeError('GitHub Actions run id is malformed')
  }
  const repository = parseRepositoryUrl(`https://github.com/${decoded.owner}/${decoded.repo}`)
  admitBranchRef(decoded.branch, 'run branch')
  admitBranchRef(decoded.workflowRef, 'run workflow ref')
  acceptIdempotencyKey(decoded.attempt)
  if (
    decoded.pullRequest !== undefined &&
    parsePullRequestUrl(decoded.pullRequest).repository !== repository.url
  ) {
    throw new TypeError('GitHub Actions run pull request belongs to another repository')
  }
  return decoded
}

function assertWorkflowRunIdentity(workflowRun, identity, workflowFile) {
  if (
    !workflowRun ||
    typeof workflowRun !== 'object' ||
    workflowRun.id !== identity.run ||
    workflowRun.run_attempt !== identity.runAttempt ||
    workflowRun.event !== 'workflow_dispatch' ||
    workflowRun.display_title !== attemptMarker(identity.attempt) ||
    workflowRun.path !== `.github/workflows/${workflowFile}` ||
    workflowRun.head_branch !== identity.workflowRef ||
    workflowRun.actor?.login !== identity.workflowActor ||
    workflowRun.triggering_actor?.login !== identity.workflowActor ||
    typeof workflowRun.status !== 'string' ||
    typeof workflowRun.created_at !== 'string' ||
    typeof workflowRun.updated_at !== 'string'
  ) {
    throw new TypeError('GitHub Actions run response is missing or mismatches required fields')
  }
}

function normalizeWorkflowRun(workflowRun, identity, pullRequest, configuration) {
  const { provider, workflowFile, workerName } = configuration
  assertWorkflowRunIdentity(workflowRun, identity, workflowFile)
  const base = {
    ref: { provider, id: encodeRunIdentity(identity) },
    ...(typeof workflowRun.html_url === 'string'
      ? { providerUrl: acceptProviderUrl(workflowRun.html_url) }
      : {}),
    branch: identity.branch,
    ...(pullRequest ? { pullRequest } : {}),
    createdAt: workflowRun.created_at,
    updatedAt: workflowRun.updated_at,
  }

  if (['queued', 'pending', 'requested'].includes(workflowRun.status)) {
    return { ...base, state: 'queued' }
  }
  if (workflowRun.status === 'in_progress') return { ...base, state: 'running' }
  if (workflowRun.status === 'waiting') {
    return {
      ...base,
      state: 'waiting-for-approval',
      reason: 'The GitHub Actions run is waiting for an environment approval.',
    }
  }
  if (workflowRun.status !== 'completed') {
    throw new TypeError(`Unknown GitHub Actions run status: ${workflowRun.status}`)
  }
  if (workflowRun.conclusion === 'cancelled') return { ...base, state: 'cancelled' }
  if (workflowRun.conclusion === 'timed_out') {
    return {
      ...base,
      state: 'expired',
      failure: failure('AGENT_UNAVAILABLE', `The ${workerName} workflow run timed out.`, 'safe'),
    }
  }
  if (workflowRun.conclusion === 'action_required') {
    return {
      ...base,
      state: 'failed',
      failure: failure(
        'AGENT_PERMISSION_DENIED',
        `The ${workerName} workflow run requires a repository approval or action.`,
        'after-change',
      ),
    }
  }
  if (
    ['failure', 'startup_failure', 'stale', 'neutral', 'skipped'].includes(workflowRun.conclusion)
  ) {
    return {
      ...base,
      state: 'failed',
      failure: failure('AGENT_UNAVAILABLE', `The ${workerName} workflow run failed.`, 'safe'),
    }
  }
  if (workflowRun.conclusion === 'success') {
    if (pullRequest) return { ...base, state: 'succeeded', pullRequest }
    return {
      ...base,
      state: 'failed',
      failure: protocolFailure(
        `The ${workerName} workflow completed without exactly one intended pull request.`,
      ),
    }
  }
  throw new TypeError(`Unknown GitHub Actions run conclusion: ${String(workflowRun.conclusion)}`)
}

export function createGitHubActionsWorkerAgent(options) {
  const provider = options?.provider
  const workflowFile = options?.workflowFile
  const workerName = options?.workerName
  const token = options?.token
  const fetchImplementation = options?.fetch ?? globalThis.fetch
  const operationTimeoutMs = options?.operationTimeoutMs ?? limits.providerOperationTimeoutMs
  const workflowRef = admitBranchRef(options?.workflowRef ?? 'main', 'workflowRef')
  const workflowActor = options?.workflowActor ?? 'github-actions[bot]'
  const now = options?.now ?? (() => new Date().toISOString())
  if (typeof provider !== 'string' || provider.length === 0) {
    throw new TypeError('GitHub Actions worker provider must be non-empty text')
  }
  if (typeof workflowFile !== 'string' || !/^[a-z0-9][a-z0-9-]*\.yml$/u.test(workflowFile)) {
    throw new TypeError('GitHub Actions worker workflowFile is invalid')
  }
  if (typeof workerName !== 'string' || workerName.length === 0) {
    throw new TypeError('GitHub Actions workerName must be non-empty text')
  }
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError(`GitHub Actions ${workerName} adapter requires a workflow-dispatch token`)
  }
  if (typeof fetchImplementation !== 'function') throw new TypeError('fetch must be a function')
  if (typeof workflowActor !== 'string' || workflowActor.length === 0) {
    throw new TypeError('workflowActor must be non-empty text')
  }
  if (typeof now !== 'function') throw new TypeError('now must be a function')

  async function request(path, init = {}) {
    const { signal, ...requestInit } = init
    const response = await fetchImplementation(`https://api.github.com${path}`, {
      ...requestInit,
      signal: operationSignal(signal, operationTimeoutMs),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': apiVersion,
        ...requestInit.headers,
      },
    })
    return { response, body: await readBoundedJson(response) }
  }

  function repositoryPath(identity) {
    return `/repos/${encodeURIComponent(identity.owner)}/${encodeURIComponent(identity.repo)}`
  }

  async function intendedPullRequest(identity, signal) {
    let result
    try {
      result = await request(
        `${repositoryPath(identity)}/pulls?head=${encodeURIComponent(`${identity.owner}:${identity.branch}`)}&state=open&per_page=100`,
        { signal },
      )
    } catch {
      return { failure: transportFailure('observe') }
    }
    if (!result.response.ok) {
      return { failure: httpFailure(result.response.status, 'observe') }
    }
    if (!Array.isArray(result.body)) {
      return { failure: protocolFailure('The GitHub pull-request listing is malformed.') }
    }
    const repository = `https://github.com/${identity.owner}/${identity.repo}`
    const pulls = []
    for (const entry of result.body) {
      if (typeof entry?.html_url !== 'string') {
        return { failure: protocolFailure('The GitHub pull-request listing is malformed.') }
      }
      try {
        if (parsePullRequestUrl(entry.html_url).repository !== repository) {
          return {
            failure: protocolFailure(
              `The ${workerName} workflow branch proposed a pull request in another repository.`,
            ),
          }
        }
      } catch {
        return { failure: protocolFailure('The GitHub pull-request listing is malformed.') }
      }
      pulls.push(entry.html_url)
    }
    if (pulls.length !== 1) return {}
    if (identity.pullRequest && pulls[0] !== identity.pullRequest) return {}
    return { pullRequest: pulls[0] }
  }

  async function observeIdentity(identity, signal) {
    let result
    try {
      result = await request(`${repositoryPath(identity)}/actions/runs/${identity.run}`, { signal })
    } catch {
      return { kind: 'failed', failure: transportFailure('observe') }
    }
    if (!result.response.ok) {
      return { kind: 'failed', failure: httpFailure(result.response.status, 'observe') }
    }
    try {
      assertWorkflowRunIdentity(result.body, identity, workflowFile)
    } catch (error) {
      return {
        kind: 'failed',
        failure: protocolFailure(error instanceof Error ? error.message : undefined),
      }
    }
    const proposal = await intendedPullRequest(identity, signal)
    if (proposal.failure) return { kind: 'failed', failure: proposal.failure }
    try {
      return {
        kind: 'observed',
        run: acceptManagedAgentRun(
          normalizeWorkflowRun(result.body, identity, proposal.pullRequest, {
            provider,
            workflowFile,
            workerName,
          }),
        ),
      }
    } catch (error) {
      return {
        kind: 'failed',
        failure: protocolFailure(error instanceof Error ? error.message : undefined),
      }
    }
  }

  /** Read-only bounded scan for the exact attempt marker published as the worker run name. */
  async function findAttemptRun(repository, marker, signal) {
    const matching = []
    for (let page = 1; page <= limits.maxReconcileTaskPages; page += 1) {
      let listed
      try {
        listed = await request(
          `${repositoryPath(repository)}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=100&page=${page}`,
          { signal },
        )
      } catch {
        return { kind: 'failed', failure: transportFailure('observe') }
      }
      if (!listed.response.ok) {
        return { kind: 'failed', failure: httpFailure(listed.response.status, 'observe') }
      }
      const runs = listed.body?.workflow_runs
      if (!Array.isArray(runs)) {
        return { kind: 'failed', failure: protocolFailure('The GitHub run listing is malformed.') }
      }
      for (const workflowRun of runs) {
        if (
          !Number.isSafeInteger(workflowRun?.id) ||
          !Number.isSafeInteger(workflowRun?.run_attempt)
        ) {
          return {
            kind: 'failed',
            failure: protocolFailure('The GitHub run listing is malformed.'),
          }
        }
        if (
          workflowRun.display_title === marker &&
          workflowRun.event === 'workflow_dispatch' &&
          workflowRun.path === `.github/workflows/${workflowFile}` &&
          workflowRun.head_branch === workflowRef &&
          workflowRun.actor?.login === workflowActor &&
          workflowRun.triggering_actor?.login === workflowActor
        ) {
          matching.push({ id: workflowRun.id, runAttempt: workflowRun.run_attempt })
        }
      }
      if (runs.length < 100) {
        if (matching.length === 0) return { kind: 'absent' }
        if (matching.length > 1) return { kind: 'ambiguous' }
        return { kind: 'found', run: matching[0] }
      }
    }
    return {
      kind: 'failed',
      failure: unknownOutcome('GitHub Actions run discovery exceeded its admitted scan bound.'),
    }
  }

  async function resolveTarget(job, idempotencyKey, signal) {
    if (job.target.kind === 'repository') {
      const repository = intendedRepository(job)
      return {
        owner: repository.owner,
        repo: repository.repo,
        baseRef: admitBranchRef(job.target.baseRef, 'baseRef'),
        branch: admitBranchRef(deterministicBranch(idempotencyKey), 'branch'),
      }
    }
    const pullRequest = parsePullRequestUrl(job.target.pullRequest)
    let result
    try {
      result = await request(
        `/repos/${encodeURIComponent(pullRequest.owner)}/${encodeURIComponent(pullRequest.repo)}/pulls/${pullRequest.number}`,
        { signal },
      )
    } catch {
      return { failure: transportFailure('observe') }
    }
    if (!result.response.ok) return { failure: httpFailure(result.response.status, 'observe') }
    if (
      result.body?.state !== 'open' ||
      result.body?.merged_at !== null ||
      typeof result.body?.base?.ref !== 'string' ||
      typeof result.body?.head?.ref !== 'string' ||
      result.body?.base?.repo?.full_name !== `${pullRequest.owner}/${pullRequest.repo}` ||
      result.body?.head?.repo?.full_name !== `${pullRequest.owner}/${pullRequest.repo}`
    ) {
      return { failure: protocolFailure('GitHub returned an incompatible pull-request response.') }
    }
    return {
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      baseRef: admitBranchRef(result.body.base.ref, 'pull-request base ref'),
      branch: admitBranchRef(result.body.head.ref, 'pull-request head ref'),
      pullRequest: pullRequest.url,
    }
  }

  function identityOf(target, run, attempt, runAttempt) {
    return {
      owner: target.owner,
      repo: target.repo,
      branch: target.branch,
      attempt,
      workflowRef,
      workflowActor,
      run,
      runAttempt,
      ...(target.pullRequest ? { pullRequest: target.pullRequest } : {}),
    }
  }

  return Object.freeze({
    descriptor: Object.freeze({ provider, cancellation: 'best-effort' }),

    async dispatch(input, operation = {}) {
      let job
      let idempotencyKey
      try {
        job = acceptManagedAgentJob(input)
        idempotencyKey = acceptIdempotencyKey(operation.idempotencyKey)
        deterministicBranch(idempotencyKey)
      } catch (error) {
        return invalidJob(error)
      }
      const target = await resolveTarget(job, idempotencyKey, operation.signal)
      if (target.failure) return { kind: 'failed', failure: target.failure }

      const inputs = {
        attempt: idempotencyKey,
        request: job.request,
        base_ref: target.baseRef,
        branch: target.branch,
        objective: normalizedPrompt(job, idempotencyKey),
        pull_request: target.pullRequest ?? '',
      }
      if (utf8Bytes(JSON.stringify(inputs)) > limits.maxWorkflowDispatchInputsUtf8Bytes) {
        return invalidJob(
          new TypeError('The normalized job exceeds the admitted workflow-dispatch input size.'),
        )
      }
      let dispatched
      try {
        dispatched = await request(
          `${repositoryPath(target)}/actions/workflows/${workflowFile}/dispatches`,
          {
            method: 'POST',
            signal: operation.signal,
            body: JSON.stringify({ ref: workflowRef, inputs }),
          },
        )
      } catch {
        return { kind: 'failed', failure: transportFailure('dispatch') }
      }
      if (dispatched.response.status !== 200) {
        return { kind: 'failed', failure: httpFailure(dispatched.response.status, 'dispatch') }
      }
      if (
        !Number.isSafeInteger(dispatched.body?.workflow_run_id) ||
        dispatched.body.workflow_run_id < 1
      ) {
        return {
          kind: 'failed',
          failure: unknownOutcome(
            'GitHub accepted the workflow dispatch without returning its run identity.',
          ),
        }
      }
      const identity = identityOf(target, dispatched.body.workflow_run_id, idempotencyKey, 1)
      const timestamp = now()
      try {
        return {
          kind: 'accepted',
          run: acceptManagedAgentRun({
            ref: { provider, id: encodeRunIdentity(identity) },
            state: 'queued',
            ...(typeof dispatched.body.html_url === 'string'
              ? { providerUrl: acceptProviderUrl(dispatched.body.html_url) }
              : {}),
            branch: target.branch,
            ...(target.pullRequest ? { pullRequest: target.pullRequest } : {}),
            createdAt: timestamp,
            updatedAt: timestamp,
          }),
        }
      } catch {
        return {
          kind: 'failed',
          failure: unknownOutcome('GitHub accepted the workflow but returned malformed run data.'),
        }
      }
    },

    async observe(input, operation = {}) {
      let identity
      try {
        identity = runIdentity(acceptRunRef(input, provider), provider)
      } catch (error) {
        return invalidJob(error)
      }
      return observeIdentity(identity, operation.signal)
    },

    async reconcile(input, operation = {}) {
      let job
      let idempotencyKey
      try {
        job = acceptManagedAgentJob(input)
        idempotencyKey = acceptIdempotencyKey(operation.idempotencyKey)
        deterministicBranch(idempotencyKey)
      } catch (error) {
        return invalidJob(error)
      }
      const target = await resolveTarget(job, idempotencyKey, operation.signal)
      if (target.failure) return { kind: 'failed', failure: target.failure }
      const found = await findAttemptRun(target, attemptMarker(idempotencyKey), operation.signal)
      if (found.kind !== 'found') return found
      const observed = await observeIdentity(
        identityOf(target, found.run.id, idempotencyKey, found.run.runAttempt),
        operation.signal,
      )
      return observed.kind === 'observed' ? { kind: 'found', run: observed.run } : observed
    },

    async cancel(input, operation = {}) {
      let identity
      try {
        identity = runIdentity(acceptRunRef(input, provider), provider)
      } catch (error) {
        return invalidJob(error)
      }
      const before = await observeIdentity(identity, operation.signal)
      if (before.kind === 'failed') return before
      if (terminalStates.has(before.run.state)) return { kind: 'already-terminal', run: before.run }
      let result
      try {
        result = await request(`${repositoryPath(identity)}/actions/runs/${identity.run}/cancel`, {
          method: 'POST',
          signal: operation.signal,
        })
      } catch {
        return { kind: 'failed', failure: transportFailure('observe') }
      }
      if (result.response.status === 409) {
        const conflicted = await observeIdentity(identity, operation.signal)
        if (conflicted.kind === 'failed') return conflicted
        return terminalStates.has(conflicted.run.state)
          ? { kind: 'already-terminal', run: conflicted.run }
          : {
              kind: 'failed',
              failure: protocolFailure(
                'GitHub Actions rejected cancellation for a non-terminal run.',
              ),
            }
      }
      if (!result.response.ok) {
        return { kind: 'failed', failure: httpFailure(result.response.status, 'observe') }
      }
      const after = await observeIdentity(identity, operation.signal)
      if (after.kind === 'failed') return after
      return after.run.state === 'cancelled'
        ? { kind: 'cancelled', run: after.run }
        : { kind: 'requested', run: after.run }
    },
  })
}

export function createGitHubActionsClaudeCodeAgent(options) {
  return createGitHubActionsWorkerAgent({
    ...options,
    provider: 'github-actions-claude-code',
    workflowFile: 'ui-request-claude-code.yml',
    workerName: 'Claude Code',
  })
}
