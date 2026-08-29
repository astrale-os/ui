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
  terminalStates,
} from '../src/model.mjs'

const provider = 'github-copilot'
const apiVersion = '2026-03-10'

function protocolFailure(message = 'GitHub returned an incompatible agent-task response.') {
  return failure('AGENT_PROTOCOL_INCOMPATIBLE', message, 'after-change')
}

function taskIdentity(ref) {
  const decoded = decodeRunIdentity(ref.id)
  if (
    typeof decoded.owner !== 'string' ||
    typeof decoded.repo !== 'string' ||
    typeof decoded.task !== 'string'
  ) {
    throw new TypeError('GitHub Copilot run id is malformed')
  }
  return decoded
}

function pullRequestFromTask(task, repository) {
  const pulls = Array.isArray(task.artifacts)
    ? task.artifacts.filter(
        (artifact) =>
          artifact?.provider === 'github' &&
          artifact?.type === 'pull' &&
          Number.isSafeInteger(artifact?.data?.id) &&
          artifact.data.id > 0,
      )
    : []
  if (pulls.length > 1) throw new TypeError('GitHub task returned more than one pull request')
  return pulls.length === 1 ? `${repository}/pull/${pulls[0].data.id}` : undefined
}

function normalizeTask(task, identity) {
  if (
    !task ||
    typeof task !== 'object' ||
    typeof task.id !== 'string' ||
    typeof task.state !== 'string' ||
    typeof task.created_at !== 'string' ||
    typeof task.updated_at !== 'string'
  ) {
    throw new TypeError('GitHub task response is missing required fields')
  }
  const repository = `https://github.com/${identity.owner}/${identity.repo}`
  const pullRequest = pullRequestFromTask(task, repository)
  const sessions = Array.isArray(task.sessions) ? task.sessions : []
  const branch = [...sessions]
    .reverse()
    .find((session) => typeof session?.head_ref === 'string')?.head_ref
  const base = {
    ref: { provider, id: encodeRunIdentity(identity) },
    ...(typeof task.html_url === 'string' ? { providerUrl: acceptProviderUrl(task.html_url) } : {}),
    ...(branch ? { branch } : {}),
    ...(pullRequest ? { pullRequest } : {}),
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }

  if (task.state === 'queued') return { ...base, state: 'queued' }
  if (task.state === 'in_progress') return { ...base, state: 'running' }
  if (task.state === 'waiting_for_user') {
    return {
      ...base,
      state: 'waiting-for-input',
      reason: 'GitHub Copilot is waiting for user input.',
    }
  }
  if (task.state === 'idle') {
    return { ...base, state: 'blocked', reason: 'GitHub Copilot reported an idle task.' }
  }
  if (task.state === 'cancelled') return { ...base, state: 'cancelled' }
  if (task.state === 'timed_out') {
    return {
      ...base,
      state: 'expired',
      failure: failure('AGENT_UNAVAILABLE', 'The GitHub Copilot task timed out.', 'safe'),
    }
  }
  if (task.state === 'failed') {
    return {
      ...base,
      state: 'failed',
      failure: failure('AGENT_UNAVAILABLE', 'The GitHub Copilot task failed.', 'safe'),
    }
  }
  if (task.state === 'completed') {
    if (pullRequest) return { ...base, state: 'succeeded', pullRequest }
    return {
      ...base,
      state: 'failed',
      failure: protocolFailure('GitHub completed the task without exactly one pull request.'),
    }
  }
  throw new TypeError(`Unknown GitHub task state: ${task.state}`)
}

export function createGitHubCopilotAgent(options) {
  const token = options?.token
  const fetchImplementation = options?.fetch ?? globalThis.fetch
  const operationTimeoutMs = options?.operationTimeoutMs ?? limits.providerOperationTimeoutMs
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('GitHub Copilot adapter requires a user-to-server token')
  }
  if (typeof fetchImplementation !== 'function') throw new TypeError('fetch must be a function')

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

  async function resolveTarget(job, signal) {
    if (job.target.kind === 'repository') {
      return { baseRef: job.target.baseRef, repository: intendedRepository(job) }
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
    if (typeof result.body?.base?.ref !== 'string' || typeof result.body?.head?.ref !== 'string') {
      return { failure: protocolFailure('GitHub returned an incompatible pull-request response.') }
    }
    return {
      repository: pullRequest,
      baseRef: result.body.base.ref,
      headRef: result.body.head.ref,
    }
  }

  return Object.freeze({
    descriptor: Object.freeze({ provider, cancellation: 'none' }),

    async dispatch(input, operation = {}) {
      let job
      let idempotencyKey
      try {
        job = acceptManagedAgentJob(input)
        idempotencyKey = acceptIdempotencyKey(operation.idempotencyKey)
      } catch (error) {
        return invalidJob(error)
      }
      const target = await resolveTarget(job, operation.signal)
      if (target.failure) return { kind: 'failed', failure: target.failure }

      let result
      try {
        result = await request(
          `/agents/repos/${encodeURIComponent(target.repository.owner)}/${encodeURIComponent(target.repository.repo)}/tasks`,
          {
            method: 'POST',
            signal: operation.signal,
            body: JSON.stringify({
              prompt: normalizedPrompt(job, idempotencyKey),
              base_ref: target.baseRef,
              ...(target.headRef ? { head_ref: target.headRef } : {}),
              create_pull_request: true,
            }),
          },
        )
      } catch {
        return { kind: 'failed', failure: transportFailure('dispatch') }
      }
      if (result.response.status !== 201) {
        return { kind: 'failed', failure: httpFailure(result.response.status, 'dispatch') }
      }
      if (typeof result.body?.id !== 'string') {
        return {
          kind: 'failed',
          failure: failure(
            'AGENT_OUTCOME_UNKNOWN',
            'GitHub accepted the task but did not return a usable task identity.',
            'unsafe',
          ),
        }
      }
      const identity = {
        owner: target.repository.owner,
        repo: target.repository.repo,
        task: result.body.id,
      }
      try {
        return {
          kind: 'accepted',
          run: acceptManagedAgentRun(normalizeTask(result.body, identity)),
        }
      } catch {
        return {
          kind: 'failed',
          failure: failure(
            'AGENT_OUTCOME_UNKNOWN',
            'GitHub accepted the task but returned an incompatible response.',
            'unsafe',
          ),
        }
      }
    },

    async observe(input, operation = {}) {
      let identity
      try {
        const ref = acceptRunRef(input, provider)
        identity = taskIdentity(ref)
      } catch (error) {
        return invalidJob(error)
      }
      let result
      try {
        result = await request(
          `/agents/repos/${encodeURIComponent(identity.owner)}/${encodeURIComponent(identity.repo)}/tasks/${encodeURIComponent(identity.task)}`,
          { signal: operation.signal },
        )
      } catch {
        return { kind: 'failed', failure: transportFailure('observe') }
      }
      if (!result.response.ok) {
        return { kind: 'failed', failure: httpFailure(result.response.status, 'observe') }
      }
      try {
        return {
          kind: 'observed',
          run: acceptManagedAgentRun(normalizeTask(result.body, identity)),
        }
      } catch (error) {
        return {
          kind: 'failed',
          failure: protocolFailure(error instanceof Error ? error.message : undefined),
        }
      }
    },

    async reconcile(input, operation = {}) {
      let job
      let idempotencyKey
      try {
        job = acceptManagedAgentJob(input)
        idempotencyKey = acceptIdempotencyKey(operation.idempotencyKey)
      } catch (error) {
        return invalidJob(error)
      }
      const repository = intendedRepository(job)
      const marker = `Astrale attempt: ${idempotencyKey}`
      const matching = []
      let complete = false
      for (let page = 1; page <= limits.maxReconcileTaskPages; page += 1) {
        let listed
        try {
          listed = await request(
            `/agents/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/tasks?per_page=100&page=${page}&sort=created_at&direction=desc`,
            { signal: operation.signal },
          )
        } catch {
          return { kind: 'failed', failure: transportFailure('observe') }
        }
        if (!listed.response.ok) {
          return { kind: 'failed', failure: httpFailure(listed.response.status, 'observe') }
        }
        if (!Array.isArray(listed.body?.tasks)) {
          return { kind: 'failed', failure: protocolFailure('GitHub task listing is malformed.') }
        }
        for (const listedTask of listed.body.tasks) {
          if (typeof listedTask?.id !== 'string') {
            return { kind: 'failed', failure: protocolFailure('GitHub task listing is malformed.') }
          }
          let detail
          try {
            detail = await request(
              `/agents/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/tasks/${encodeURIComponent(listedTask.id)}`,
              { signal: operation.signal },
            )
          } catch {
            return { kind: 'failed', failure: transportFailure('observe') }
          }
          if (!detail.response.ok) {
            return { kind: 'failed', failure: httpFailure(detail.response.status, 'observe') }
          }
          const sessions = Array.isArray(detail.body?.sessions) ? detail.body.sessions : []
          if (
            sessions.some(
              (session) =>
                typeof session?.prompt === 'string' &&
                session.prompt.split(/\r?\n/u).includes(marker),
            )
          ) {
            matching.push(detail.body)
          }
        }
        if (listed.body.tasks.length < 100) {
          complete = true
          break
        }
      }
      if (!complete) {
        return {
          kind: 'failed',
          failure: failure(
            'AGENT_OUTCOME_UNKNOWN',
            'GitHub task reconciliation exceeded its admitted scan bound.',
            'unsafe',
          ),
        }
      }
      if (matching.length === 0) return { kind: 'absent' }
      if (matching.length > 1) return { kind: 'ambiguous' }
      const identity = { owner: repository.owner, repo: repository.repo, task: matching[0].id }
      try {
        return { kind: 'found', run: acceptManagedAgentRun(normalizeTask(matching[0], identity)) }
      } catch (error) {
        return {
          kind: 'failed',
          failure: protocolFailure(error instanceof Error ? error.message : undefined),
        }
      }
    },

    async cancel(ref, operation = {}) {
      const observed = await this.observe(ref, operation)
      if (observed.kind === 'failed') return observed
      if (terminalStates.has(observed.run.state)) {
        return { kind: 'already-terminal', run: observed.run }
      }
      return { kind: 'unsupported', run: observed.run }
    },
  })
}
