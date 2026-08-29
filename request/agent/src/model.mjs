import { Buffer } from 'node:buffer'

import { managedAgentLimits as limits } from '../.spec/limits.ts'

const githubRepository = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)$/u
const githubIssue = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/issues\/([1-9][0-9]*)$/u
const githubPullRequest = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/([1-9][0-9]*)$/u

export const managedRunStateValues = Object.freeze([
  'queued',
  'running',
  'waiting-for-input',
  'waiting-for-approval',
  'blocked',
  'succeeded',
  'failed',
  'cancelled',
  'expired',
])
export const managedFailureCodeValues = Object.freeze([
  'AGENT_AUTH_REQUIRED',
  'AGENT_PERMISSION_DENIED',
  'AGENT_QUOTA_EXHAUSTED',
  'AGENT_INVALID_JOB',
  'AGENT_NOT_FOUND',
  'AGENT_UNAVAILABLE',
  'AGENT_OUTCOME_UNKNOWN',
  'AGENT_PROTOCOL_INCOMPATIBLE',
])
export const managedRetryValues = Object.freeze(['safe', 'after-change', 'unsafe'])
const runStates = new Set(managedRunStateValues)
const failureCodes = new Set(managedFailureCodeValues)
const retryValues = new Set(managedRetryValues)
export const terminalStates = Object.freeze(
  new Set(['succeeded', 'failed', 'cancelled', 'expired']),
)

export function utf8Bytes(value) {
  return Buffer.byteLength(value, 'utf8')
}

function boundedString(value, name, maximum) {
  if (typeof value !== 'string' || value.length === 0 || utf8Bytes(value) > maximum) {
    throw new TypeError(`${name} must be a non-empty string of at most ${maximum} UTF-8 bytes`)
  }
  return value
}

export function parseRepositoryUrl(value) {
  const admitted = boundedString(value, 'repository', limits.maxProviderUrlUtf8Bytes)
  const match = githubRepository.exec(admitted)
  if (!match) throw new TypeError('repository must be a canonical HTTPS GitHub repository URL')
  return { url: admitted, owner: match[1], repo: match[2] }
}

export function parseIssueUrl(value) {
  const admitted = boundedString(value, 'request', limits.maxProviderUrlUtf8Bytes)
  const match = githubIssue.exec(admitted)
  if (!match) throw new TypeError('request must be a canonical HTTPS GitHub issue URL')
  return {
    url: admitted,
    repository: `https://github.com/${match[1]}/${match[2]}`,
    owner: match[1],
    repo: match[2],
    number: Number(match[3]),
  }
}

export function parsePullRequestUrl(value) {
  const admitted = boundedString(value, 'pullRequest', limits.maxProviderUrlUtf8Bytes)
  const match = githubPullRequest.exec(admitted)
  if (!match) throw new TypeError('pullRequest must be a canonical HTTPS GitHub pull request URL')
  return {
    url: admitted,
    repository: `https://github.com/${match[1]}/${match[2]}`,
    owner: match[1],
    repo: match[2],
    number: Number(match[3]),
  }
}

export function acceptManagedAgentJob(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('job must be an object')
  }
  if (Object.keys(input).some((key) => !['request', 'objective', 'target'].includes(key))) {
    throw new TypeError('job contains an unknown field')
  }
  const request = parseIssueUrl(input.request)
  const objective = boundedString(input.objective, 'objective', limits.maxObjectiveUtf8Bytes)
  if (!input.target || typeof input.target !== 'object' || Array.isArray(input.target)) {
    throw new TypeError('target must be an object')
  }
  if (input.target.kind === 'repository') {
    if (Object.keys(input.target).some((key) => !['kind', 'repository', 'baseRef'].includes(key))) {
      throw new TypeError('repository target contains an unknown field')
    }
    const repository = parseRepositoryUrl(input.target.repository)
    const baseRef = boundedString(input.target.baseRef, 'baseRef', 1024)
    if (request.repository !== repository.url) {
      throw new TypeError('request and repository target must belong to the same repository')
    }
    return {
      request: request.url,
      objective,
      target: { kind: 'repository', repository: repository.url, baseRef },
    }
  }
  if (input.target.kind === 'pull-request') {
    if (Object.keys(input.target).some((key) => !['kind', 'pullRequest'].includes(key))) {
      throw new TypeError('pull-request target contains an unknown field')
    }
    const pullRequest = parsePullRequestUrl(input.target.pullRequest)
    if (request.repository !== pullRequest.repository) {
      throw new TypeError('request and pull-request target must belong to the same repository')
    }
    return {
      request: request.url,
      objective,
      target: { kind: 'pull-request', pullRequest: pullRequest.url },
    }
  }
  throw new TypeError('target.kind must be repository or pull-request')
}

export function acceptIdempotencyKey(value) {
  return boundedString(value, 'idempotencyKey', limits.maxIdempotencyKeyUtf8Bytes)
}

export function acceptRunRef(ref, provider) {
  if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
    throw new TypeError('run reference must be an object')
  }
  if (Object.keys(ref).some((key) => !['provider', 'id'].includes(key))) {
    throw new TypeError('run reference contains an unknown field')
  }
  const actualProvider = boundedString(
    ref.provider,
    'run provider',
    limits.maxProviderIdentityUtf8Bytes,
  )
  if (actualProvider !== provider)
    throw new TypeError(`run reference does not belong to ${provider}`)
  return {
    provider: actualProvider,
    id: boundedString(ref.id, 'run id', limits.maxOpaqueRunIdentityUtf8Bytes),
  }
}

export function acceptProviderUrl(value) {
  const admitted = boundedString(value, 'providerUrl', limits.maxProviderUrlUtf8Bytes)
  const url = new URL(admitted)
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError('providerUrl must be an HTTPS URL without embedded credentials')
  }
  return admitted
}

function acceptTimestamp(value, name) {
  const normalized =
    typeof value === 'string' && value.endsWith('Z')
      ? value.includes('.')
        ? value
        : value.replace(/Z$/u, '.000Z')
      : ''
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== normalized
  ) {
    throw new TypeError(`${name} must be an ISO 8601 UTC timestamp`)
  }
  return value
}

function acceptFailure(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !['code', 'message', 'retry'].includes(key)) ||
    !failureCodes.has(value.code) ||
    typeof value.message !== 'string' ||
    !value.message ||
    utf8Bytes(value.message) > limits.maxProviderMessageUtf8Bytes ||
    !retryValues.has(value.retry)
  ) {
    throw new TypeError('managed-agent failure is malformed')
  }
  return value
}

export function acceptManagedAgentRun(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('managed-agent run must be an object')
  }
  const keys = new Set([
    'ref',
    'state',
    'providerUrl',
    'branch',
    'pullRequest',
    'createdAt',
    'updatedAt',
    'reason',
    'failure',
  ])
  if (Object.keys(value).some((key) => !keys.has(key)) || !runStates.has(value.state)) {
    throw new TypeError('managed-agent run is malformed')
  }
  if (!value.ref || typeof value.ref.provider !== 'string') {
    throw new TypeError('managed-agent run reference is malformed')
  }
  acceptRunRef(value.ref, value.ref.provider)
  acceptTimestamp(value.createdAt, 'createdAt')
  acceptTimestamp(value.updatedAt, 'updatedAt')
  if (value.providerUrl !== undefined) acceptProviderUrl(value.providerUrl)
  if (value.branch !== undefined)
    boundedString(value.branch, 'branch', limits.maxProviderUrlUtf8Bytes)
  if (value.pullRequest !== undefined) parsePullRequestUrl(value.pullRequest)
  const waiting = ['waiting-for-input', 'waiting-for-approval', 'blocked'].includes(value.state)
  const failed = ['failed', 'expired'].includes(value.state)
  if (waiting) boundedString(value.reason, 'reason', limits.maxProviderMessageUtf8Bytes)
  else if (value.reason !== undefined)
    throw new TypeError('managed-agent run reason is not admitted')
  if (failed) acceptFailure(value.failure)
  else if (value.failure !== undefined)
    throw new TypeError('managed-agent run failure is not admitted')
  if (value.state === 'succeeded' && value.pullRequest === undefined) {
    throw new TypeError('succeeded managed-agent run requires one pull request')
  }
  return value
}

export function encodeRunIdentity(value) {
  const encoded = Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
  return boundedString(encoded, 'run id', limits.maxOpaqueRunIdentityUtf8Bytes)
}

export function decodeRunIdentity(value) {
  try {
    const encoded = boundedString(value, 'run id', limits.maxOpaqueRunIdentityUtf8Bytes)
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) throw new Error()
    return decoded
  } catch {
    throw new TypeError('run id is malformed')
  }
}

export function failure(code, message, retry) {
  if (!failureCodes.has(code) || !retryValues.has(retry)) {
    throw new TypeError('managed-agent failure vocabulary is invalid')
  }
  let bounded = ''
  let bytes = 0
  for (const character of String(message)) {
    const characterBytes = utf8Bytes(character)
    if (bytes + characterBytes > limits.maxProviderMessageUtf8Bytes) break
    bounded += character
    bytes += characterBytes
  }
  return { code, message: bounded || code, retry }
}

export function invalidJob(error) {
  return {
    kind: 'failed',
    failure: failure(
      'AGENT_INVALID_JOB',
      error instanceof Error ? error.message : 'The managed-agent job is invalid.',
      'after-change',
    ),
  }
}

export function normalizedPrompt(job, idempotencyKey) {
  return [
    `Astrale UI request: ${job.request}`,
    `Astrale attempt: ${idempotencyKey}`,
    '',
    job.objective,
  ].join('\n')
}

export function intendedRepository(job) {
  return job.target.kind === 'repository'
    ? parseRepositoryUrl(job.target.repository)
    : parsePullRequestUrl(job.target.pullRequest)
}
