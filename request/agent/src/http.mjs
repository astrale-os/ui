import { Buffer } from 'node:buffer'

import { managedAgentLimits as limits } from '../.spec/limits.ts'
import { failure } from './model.mjs'

export async function readBoundedJson(response) {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > limits.maxProviderResponseBytes) {
    throw new TypeError('provider response exceeds the admitted size')
  }
  const text = await response.text()
  if (Buffer.byteLength(text, 'utf8') > limits.maxProviderResponseBytes) {
    throw new TypeError('provider response exceeds the admitted size')
  }
  if (text.length === 0) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new TypeError('provider response is not valid JSON')
  }
}

export function operationSignal(signal, timeoutMs = limits.providerOperationTimeoutMs) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10 * 60 * 1000) {
    throw new TypeError('provider operation timeout is invalid')
  }
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

export function httpFailure(status, operation) {
  if (status === 401) {
    return failure(
      'AGENT_AUTH_REQUIRED',
      'The managed-agent credential was rejected.',
      'after-change',
    )
  }
  if (status === 403) {
    return failure(
      'AGENT_PERMISSION_DENIED',
      'The managed-agent account cannot perform this repository operation.',
      'after-change',
    )
  }
  if (status === 412) {
    return failure(
      'AGENT_PERMISSION_DENIED',
      'The managed-agent account or repository does not satisfy a provider precondition (HTTP 412).',
      'after-change',
    )
  }
  if (status === 404) {
    return failure('AGENT_NOT_FOUND', 'The managed-agent resource was not found.', 'after-change')
  }
  if (status === 429) {
    return failure('AGENT_QUOTA_EXHAUSTED', 'The managed-agent quota is exhausted.', 'after-change')
  }
  if (status === 400 || status === 409 || status === 422) {
    return failure(
      'AGENT_INVALID_JOB',
      'The provider rejected the managed-agent operation.',
      'after-change',
    )
  }
  return operation === 'dispatch'
    ? failure(
        'AGENT_OUTCOME_UNKNOWN',
        `The provider may have accepted the run after HTTP ${status}, so automatic retry is unsafe.`,
        'unsafe',
      )
    : failure('AGENT_UNAVAILABLE', 'The managed-agent provider is temporarily unavailable.', 'safe')
}

export function transportFailure(operation) {
  return operation === 'dispatch'
    ? failure(
        'AGENT_OUTCOME_UNKNOWN',
        'The provider may have accepted the run, so automatic retry is unsafe.',
        'unsafe',
      )
    : failure('AGENT_UNAVAILABLE', 'The managed-agent provider is temporarily unavailable.', 'safe')
}
