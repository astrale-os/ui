import { Buffer } from 'node:buffer'

import { uiRequestLimits as limits } from '../.spec/limits.ts'
import { parseIssueUrl, parsePullRequestUrl } from '../agent/src/model.mjs'

export const recordMarker = 'astrale-ui-request-agent:v1'

export const recordStateValues = Object.freeze([
  'reserved',
  'outcome-unknown',
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
export const failureCodeValues = Object.freeze([
  'AGENT_AUTH_REQUIRED',
  'AGENT_PERMISSION_DENIED',
  'AGENT_QUOTA_EXHAUSTED',
  'AGENT_INVALID_JOB',
  'AGENT_NOT_FOUND',
  'AGENT_UNAVAILABLE',
  'AGENT_OUTCOME_UNKNOWN',
  'AGENT_PROTOCOL_INCOMPATIBLE',
])
export const retryValueValues = Object.freeze(['safe', 'after-change', 'unsafe'])
export const recordOperationValues = Object.freeze(['initial', 'revision'])
export const recordKeyValues = Object.freeze([
  'version',
  'request',
  'issue',
  'attempt',
  'operation',
  'idempotencyKey',
  'objectiveSha256',
  'acceptedCommentIds',
  'acceptedDiscussionIds',
  'provider',
  'state',
  'run',
  'providerUrl',
  'pullRequest',
  'failure',
  'updatedAt',
])
const recordStates = new Set(recordStateValues)
const failureCodes = new Set(failureCodeValues)
const retryValues = new Set(retryValueValues)
const recordOperations = new Set(recordOperationValues)
const recordKeys = new Set(recordKeyValues)

export function acceptUiRequestRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('managed request record must be an object')
  }
  if (Object.keys(value).some((key) => !recordKeys.has(key))) {
    throw new TypeError('managed request record contains an unknown field')
  }
  const request = parseIssueUrl(value.request)
  if (
    value.version !== 1 ||
    !Number.isSafeInteger(value.issue) ||
    value.issue !== request.number ||
    !Number.isSafeInteger(value.attempt) ||
    value.attempt < 1 ||
    !recordOperations.has(value.operation) ||
    value.idempotencyKey !== `ui-request:${value.issue}:attempt:${value.attempt}` ||
    typeof value.objectiveSha256 !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(value.objectiveSha256) ||
    typeof value.provider !== 'string' ||
    !value.provider ||
    !recordStates.has(value.state) ||
    typeof value.updatedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value.updatedAt) ||
    !Number.isFinite(Date.parse(value.updatedAt))
  ) {
    throw new TypeError('managed request record is malformed')
  }
  if (value.run !== undefined) {
    if (
      !value.run ||
      typeof value.run !== 'object' ||
      Array.isArray(value.run) ||
      Object.keys(value.run).some((key) => !['provider', 'id'].includes(key)) ||
      value.run.provider !== value.provider ||
      typeof value.run.id !== 'string' ||
      !value.run.id
    ) {
      throw new TypeError('managed request run reference is malformed')
    }
  }
  if (value.acceptedCommentIds !== undefined) {
    if (
      !Array.isArray(value.acceptedCommentIds) ||
      value.acceptedCommentIds.length > limits.maxAcceptedCommentCount ||
      value.acceptedCommentIds.some(
        (commentId) => !Number.isSafeInteger(commentId) || commentId < 1,
      ) ||
      new Set(value.acceptedCommentIds).size !== value.acceptedCommentIds.length
    ) {
      throw new TypeError('managed request accepted comment snapshot is malformed')
    }
  }
  if (value.acceptedDiscussionIds !== undefined) {
    if (
      !Array.isArray(value.acceptedDiscussionIds) ||
      value.acceptedDiscussionIds.length > limits.maxAcceptedCommentCount ||
      value.acceptedDiscussionIds.some(
        (discussionId) =>
          typeof discussionId !== 'string' ||
          !/^(?:issue-comment|pull-request-comment|pull-request-review|pull-request-review-comment):[1-9][0-9]*$/u.test(
            discussionId,
          ),
      ) ||
      new Set(value.acceptedDiscussionIds).size !== value.acceptedDiscussionIds.length ||
      value.acceptedCommentIds !== undefined
    ) {
      throw new TypeError('managed request accepted discussion snapshot is malformed')
    }
  }
  if (value.providerUrl !== undefined) {
    const providerUrl = new URL(value.providerUrl)
    if (providerUrl.protocol !== 'https:' || providerUrl.username || providerUrl.password) {
      throw new TypeError('managed request provider URL is malformed')
    }
  }
  if (value.pullRequest !== undefined) {
    const pullRequest = parsePullRequestUrl(value.pullRequest)
    if (pullRequest.repository !== request.repository) {
      throw new TypeError('managed request pull request belongs to another repository')
    }
  }
  if (value.failure !== undefined) {
    if (
      !value.failure ||
      typeof value.failure !== 'object' ||
      Array.isArray(value.failure) ||
      Object.keys(value.failure).some((key) => !['code', 'message', 'retry'].includes(key)) ||
      !failureCodes.has(value.failure.code) ||
      typeof value.failure.message !== 'string' ||
      !value.failure.message ||
      !retryValues.has(value.failure.retry)
    ) {
      throw new TypeError('managed request failure is malformed')
    }
  }
  if (value.state === 'reserved' && (value.run || value.failure)) {
    throw new TypeError('reserved managed request cannot contain a run or failure')
  }
  if (
    value.state === 'outcome-unknown' &&
    (value.run ||
      value.failure?.code !== 'AGENT_OUTCOME_UNKNOWN' ||
      value.failure.retry !== 'unsafe')
  ) {
    throw new TypeError('unknown managed request outcome is malformed')
  }
  if (value.state === 'succeeded' && (!value.run || !value.pullRequest)) {
    throw new TypeError('succeeded managed request requires a run and pull request')
  }
  if (!['reserved', 'outcome-unknown', 'failed'].includes(value.state) && value.run === undefined) {
    throw new TypeError('managed request state requires a run reference')
  }
  return value
}

function stateLabel(record) {
  return record.state.replaceAll('-', ' ')
}

export function renderRecordComment(record) {
  acceptUiRequestRecord(record)
  const encoded = Buffer.from(JSON.stringify(record), 'utf8').toString('base64url')
  const lines = [
    `<!-- ${recordMarker}:${encoded} -->`,
    '## Astrale UI managed request',
    '',
    `Status: **${stateLabel(record)}**`,
    `Attempt: **${record.attempt}**`,
    `Provider: **${record.provider}**`,
  ]
  if (record.providerUrl) lines.push(`Run: ${record.providerUrl}`)
  if (record.pullRequest) lines.push(`Pull request: ${record.pullRequest}`)
  if (record.failure) lines.push(`Result: ${record.failure.message}`)
  lines.push('', '_This comment is maintained by trusted request automation._')
  const rendered = lines.join('\n')
  if (Buffer.byteLength(rendered, 'utf8') > limits.maxRecordCommentUtf8Bytes) {
    throw new TypeError('managed request record comment exceeds the admitted size')
  }
  return rendered
}

export function parseRecordComment(body) {
  if (typeof body !== 'string') return null
  const match = body.match(new RegExp(`<!--\\s*${recordMarker}:([A-Za-z0-9_-]+)\\s*-->`, 'u'))
  if (!match) return null
  try {
    const value = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'))
    return acceptUiRequestRecord(value)
  } catch {
    return null
  }
}

export function hasRecordMarker(body) {
  return typeof body === 'string' && new RegExp(`<!--\\s*${recordMarker}:`, 'u').test(body)
}
