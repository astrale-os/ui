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
  terminalStates,
} from '../src/model.mjs'

const provider = 'cursor'

function protocolFailure(message = 'Cursor returned an incompatible Cloud Agents response.') {
  return failure('AGENT_PROTOCOL_INCOMPATIBLE', message, 'after-change')
}

function deterministicAgentId(idempotencyKey) {
  const bytes = Buffer.from(createHash('sha256').update(idempotencyKey).digest().subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `bc-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function runIdentity(ref) {
  const decoded = decodeRunIdentity(ref.id)
  if (
    typeof decoded.repository !== 'string' ||
    typeof decoded.agent !== 'string' ||
    typeof decoded.run !== 'string' ||
    (decoded.baseRef !== undefined && typeof decoded.baseRef !== 'string') ||
    (decoded.pullRequest !== undefined && typeof decoded.pullRequest !== 'string')
  ) {
    throw new TypeError('Cursor run id is malformed')
  }
  if ((decoded.baseRef === undefined) === (decoded.pullRequest === undefined)) {
    throw new TypeError('Cursor run id must retain exactly one target')
  }
  return decoded
}

function normalizedRepository(value) {
  return value.startsWith('https://') ? value : `https://${value}`
}

function matchesTarget(repositories, identity) {
  return repositories.some(
    (entry) =>
      entry?.url === identity.repository &&
      (identity.pullRequest
        ? entry.prUrl === identity.pullRequest
        : entry.startingRef === identity.baseRef),
  )
}

function proposalFromRun(run, identity) {
  const branches = Array.isArray(run?.git?.branches) ? run.git.branches : []
  const matching = branches.filter(
    (entry) =>
      typeof entry?.repoUrl === 'string' &&
      normalizedRepository(entry.repoUrl) === identity.repository &&
      typeof entry?.prUrl === 'string',
  )
  for (const entry of matching) {
    if (parsePullRequestUrl(entry.prUrl).repository !== identity.repository) {
      throw new TypeError('Cursor run returned a pull request from another repository')
    }
  }
  if (identity.pullRequest) {
    if (matching.length !== 1 || matching[0].prUrl !== identity.pullRequest) {
      return { branch: undefined, pullRequest: undefined }
    }
    return { branch: matching[0].branch, pullRequest: matching[0].prUrl }
  }
  if (matching.length > 1) throw new TypeError('Cursor run returned more than one pull request')
  return matching.length === 1
    ? { branch: matching[0].branch, pullRequest: matching[0].prUrl }
    : { branch: undefined, pullRequest: undefined }
}

function normalizeRun(run, identity) {
  if (
    !run ||
    typeof run !== 'object' ||
    typeof run.id !== 'string' ||
    typeof run.agentId !== 'string' ||
    typeof run.status !== 'string' ||
    typeof run.createdAt !== 'string' ||
    typeof run.updatedAt !== 'string' ||
    run.agentId !== identity.agent ||
    run.id !== identity.run
  ) {
    throw new TypeError('Cursor run response is missing or mismatches required fields')
  }
  const proposal = proposalFromRun(run, identity)
  const base = {
    ref: { provider, id: encodeRunIdentity(identity) },
    providerUrl: acceptProviderUrl(
      `https://cursor.com/agents/${encodeURIComponent(identity.agent)}`,
    ),
    ...(typeof proposal.branch === 'string' ? { branch: proposal.branch } : {}),
    ...(typeof proposal.pullRequest === 'string' ? { pullRequest: proposal.pullRequest } : {}),
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  }

  if (run.status === 'CREATING') return { ...base, state: 'queued' }
  if (run.status === 'RUNNING') return { ...base, state: 'running' }
  if (run.status === 'CANCELLED') return { ...base, state: 'cancelled' }
  if (run.status === 'EXPIRED') {
    return {
      ...base,
      state: 'expired',
      failure: failure('AGENT_UNAVAILABLE', 'The Cursor run expired.', 'safe'),
    }
  }
  if (run.status === 'ERROR') {
    return {
      ...base,
      state: 'failed',
      failure: failure('AGENT_UNAVAILABLE', 'The Cursor run failed.', 'safe'),
    }
  }
  if (run.status === 'FINISHED') {
    if (proposal.pullRequest)
      return { ...base, state: 'succeeded', pullRequest: proposal.pullRequest }
    return {
      ...base,
      state: 'failed',
      failure: protocolFailure(
        'Cursor finished the run without exactly one intended pull request.',
      ),
    }
  }
  throw new TypeError(`Unknown Cursor run status: ${run.status}`)
}

export function createCursorAgent(options) {
  const token = options?.token
  const fetchImplementation = options?.fetch ?? globalThis.fetch
  const operationTimeoutMs = options?.operationTimeoutMs ?? limits.providerOperationTimeoutMs
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('Cursor adapter requires an API key')
  }
  if (typeof fetchImplementation !== 'function') throw new TypeError('fetch must be a function')
  const authorization = `Basic ${Buffer.from(`${token}:`, 'utf8').toString('base64')}`

  async function request(path, init = {}) {
    const { signal, ...requestInit } = init
    const response = await fetchImplementation(`https://api.cursor.com${path}`, {
      ...requestInit,
      signal: operationSignal(signal, operationTimeoutMs),
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
        'Content-Type': 'application/json',
        ...requestInit.headers,
      },
    })
    return { response, body: await readBoundedJson(response) }
  }

  async function observeIdentity(identity, signal) {
    let result
    try {
      result = await request(
        `/v1/agents/${encodeURIComponent(identity.agent)}/runs/${encodeURIComponent(identity.run)}`,
        { signal },
      )
    } catch {
      return { kind: 'failed', failure: transportFailure('observe') }
    }
    if (!result.response.ok) {
      return { kind: 'failed', failure: httpFailure(result.response.status, 'observe') }
    }
    try {
      return { kind: 'observed', run: acceptManagedAgentRun(normalizeRun(result.body, identity)) }
    } catch (error) {
      return {
        kind: 'failed',
        failure: protocolFailure(error instanceof Error ? error.message : undefined),
      }
    }
  }

  async function recoverConflict(identity, signal) {
    let agent
    try {
      agent = await request(`/v1/agents/${encodeURIComponent(identity.agent)}`, { signal })
    } catch {
      return { kind: 'failed', failure: transportFailure('observe') }
    }
    if (!agent.response.ok) {
      return { kind: 'failed', failure: httpFailure(agent.response.status, 'observe') }
    }
    const repositories = Array.isArray(agent.body?.repos) ? agent.body.repos : []
    if (
      agent.body?.id !== identity.agent ||
      typeof agent.body?.latestRunId !== 'string' ||
      !matchesTarget(repositories, identity)
    ) {
      return {
        kind: 'failed',
        failure: protocolFailure('Cursor idempotency conflict did not match the intended job.'),
      }
    }
    const observed = await observeIdentity({ ...identity, run: agent.body.latestRunId }, signal)
    return observed.kind === 'observed' ? { kind: 'accepted', run: observed.run } : observed
  }

  const adapter = {
    descriptor: Object.freeze({ provider, cancellation: 'confirmed' }),

    async dispatch(input, operation = {}) {
      let job
      let idempotencyKey
      try {
        job = acceptManagedAgentJob(input)
        idempotencyKey = acceptIdempotencyKey(operation.idempotencyKey)
      } catch (error) {
        return invalidJob(error)
      }
      const repository = intendedRepository(job)
      const expectedPullRequest =
        job.target.kind === 'pull-request'
          ? parsePullRequestUrl(job.target.pullRequest).url
          : undefined
      const agentId = deterministicAgentId(idempotencyKey)
      const identity = {
        repository: repository.repository ?? repository.url,
        agent: agentId,
        run: '',
        ...(expectedPullRequest
          ? { pullRequest: expectedPullRequest }
          : { baseRef: job.target.baseRef }),
      }
      const repoInput = {
        url: identity.repository,
        ...(job.target.kind === 'repository'
          ? { startingRef: job.target.baseRef }
          : { prUrl: job.target.pullRequest }),
      }
      let result
      try {
        result = await request('/v1/agents', {
          method: 'POST',
          signal: operation.signal,
          body: JSON.stringify({
            agentId,
            prompt: { text: normalizedPrompt(job, idempotencyKey) },
            repos: [repoInput],
            autoCreatePR: true,
            workOnCurrentBranch: job.target.kind === 'pull-request',
            skipReviewerRequest: true,
          }),
        })
      } catch {
        return { kind: 'failed', failure: transportFailure('dispatch') }
      }
      if (result.response.status === 409) return recoverConflict(identity, operation.signal)
      if (!result.response.ok) {
        return { kind: 'failed', failure: httpFailure(result.response.status, 'dispatch') }
      }
      if (
        result.body?.agent?.id !== agentId ||
        typeof result.body?.run?.id !== 'string' ||
        result.body?.run?.agentId !== agentId
      ) {
        return {
          kind: 'failed',
          failure: failure(
            'AGENT_OUTCOME_UNKNOWN',
            'Cursor accepted the agent but returned an incompatible identity.',
            'unsafe',
          ),
        }
      }
      const acceptedIdentity = { ...identity, run: result.body.run.id }
      try {
        return {
          kind: 'accepted',
          run: acceptManagedAgentRun(normalizeRun(result.body.run, acceptedIdentity)),
        }
      } catch {
        return {
          kind: 'failed',
          failure: failure(
            'AGENT_OUTCOME_UNKNOWN',
            'Cursor accepted the agent but returned an incompatible run.',
            'unsafe',
          ),
        }
      }
    },

    async observe(input, operation = {}) {
      let identity
      try {
        identity = runIdentity(acceptRunRef(input, provider))
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
      } catch (error) {
        return invalidJob(error)
      }
      const repository = intendedRepository(job)
      const identity = {
        repository: repository.repository ?? repository.url,
        agent: deterministicAgentId(idempotencyKey),
        run: '',
        ...(job.target.kind === 'pull-request'
          ? { pullRequest: job.target.pullRequest }
          : { baseRef: job.target.baseRef }),
      }
      let result
      try {
        result = await request(`/v1/agents/${encodeURIComponent(identity.agent)}`, {
          signal: operation.signal,
        })
      } catch {
        return { kind: 'failed', failure: transportFailure('observe') }
      }
      if (result.response.status === 404) return { kind: 'absent' }
      if (!result.response.ok) {
        return { kind: 'failed', failure: httpFailure(result.response.status, 'observe') }
      }
      const repositories = Array.isArray(result.body?.repos) ? result.body.repos : []
      if (
        result.body?.id !== identity.agent ||
        typeof result.body?.latestRunId !== 'string' ||
        !matchesTarget(repositories, identity)
      ) {
        return {
          kind: 'failed',
          failure: protocolFailure(
            'Cursor reconciliation identity does not match the intended job.',
          ),
        }
      }
      const observed = await observeIdentity(
        { ...identity, run: result.body.latestRunId },
        operation.signal,
      )
      return observed.kind === 'observed' ? { kind: 'found', run: observed.run } : observed
    },

    async cancel(input, operation = {}) {
      let identity
      try {
        identity = runIdentity(acceptRunRef(input, provider))
      } catch (error) {
        return invalidJob(error)
      }
      const before = await observeIdentity(identity, operation.signal)
      if (before.kind === 'failed') return before
      if (terminalStates.has(before.run.state)) return { kind: 'already-terminal', run: before.run }
      let result
      try {
        result = await request(
          `/v1/agents/${encodeURIComponent(identity.agent)}/runs/${encodeURIComponent(identity.run)}/cancel`,
          { method: 'POST', signal: operation.signal },
        )
      } catch {
        return { kind: 'failed', failure: transportFailure('observe') }
      }
      if (result.response.status === 409) {
        const afterConflict = await observeIdentity(identity, operation.signal)
        if (afterConflict.kind === 'failed') return afterConflict
        return terminalStates.has(afterConflict.run.state)
          ? { kind: 'already-terminal', run: afterConflict.run }
          : {
              kind: 'failed',
              failure: protocolFailure('Cursor rejected cancellation for a non-terminal run.'),
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
  }

  return Object.freeze(adapter)
}
