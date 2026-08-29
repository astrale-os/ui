import assert from 'node:assert/strict'
import test from 'node:test'

import { managedAgentLimits } from './.spec/limits.ts'
import { managedAgentRunState } from './.spec/states/run.ts'
import {
  acceptManagedAgentJob,
  decodeRunIdentity,
  encodeRunIdentity,
  failure,
  terminalStates,
  utf8Bytes,
} from './src/model.mjs'
import { issue, job, repository } from './test-helpers.mjs'

test('admits only one canonical GitHub request and target repository', () => {
  assert.deepEqual(acceptManagedAgentJob(job), job)
  assert.throws(
    () =>
      acceptManagedAgentJob({
        ...job,
        target: {
          kind: 'repository',
          repository: 'https://github.com/example/other',
          baseRef: 'main',
        },
      }),
    /same repository/u,
  )
  assert.throws(
    () => acceptManagedAgentJob({ ...job, request: `${repository}/pull/1` }),
    /issue URL/u,
  )
  assert.throws(() => acceptManagedAgentJob({ ...job, objective: '' }), /objective/u)
})

test('keeps composite provider addressing behind one opaque bounded identity', () => {
  const value = { agent: 'bc-123', run: 'run-456', repository, request: issue }
  const encoded = encodeRunIdentity(value)
  assert.doesNotMatch(encoded, /bc-123|run-456|github/u)
  assert.deepEqual(decodeRunIdentity(encoded), value)
  assert.throws(() => decodeRunIdentity('not-json'), /malformed/u)
  assert.throws(
    () =>
      encodeRunIdentity({
        oversized: 'x'.repeat(managedAgentLimits.maxOpaqueRunIdentityUtf8Bytes),
      }),
    /at most/u,
  )
  assert.throws(
    () => decodeRunIdentity('x'.repeat(managedAgentLimits.maxOpaqueRunIdentityUtf8Bytes + 1)),
    /malformed/u,
  )
})

test('derives terminal states from the single transition authority', () => {
  const derived = new Set(
    Object.entries(managedAgentRunState.transitions)
      .filter(([, transitions]) => Object.keys(transitions).length === 0)
      .map(([state]) => state),
  )
  assert.deepEqual(derived, terminalStates)
  assert.deepEqual(derived, new Set(['succeeded', 'failed', 'cancelled', 'expired']))
})

test('bounds normalized failure messages by UTF-8 bytes without splitting Unicode', () => {
  const bounded = failure(
    'AGENT_UNAVAILABLE',
    `prefix-${'🪐'.repeat(managedAgentLimits.maxProviderMessageUtf8Bytes)}`,
    'safe',
  )
  assert.ok(utf8Bytes(bounded.message) <= managedAgentLimits.maxProviderMessageUtf8Bytes)
  assert.doesNotMatch(bounded.message, /�/u)
  assert.match(bounded.message, /^prefix-/u)
})
