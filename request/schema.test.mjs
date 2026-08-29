import Ajv2020 from 'ajv/dist/2020.js'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { managedAgentLimits } from './agent/.spec/limits.ts'
import { managedAgentRunState } from './agent/.spec/states/run.ts'
import {
  acceptManagedAgentJob,
  acceptManagedAgentRun,
  acceptRunRef,
  managedFailureCodeValues,
  managedRetryValues,
  managedRunStateValues,
} from './agent/src/model.mjs'
import { job } from './agent/test-helpers.mjs'
import {
  failureCodeValues,
  recordKeyValues,
  recordOperationValues,
  recordStateValues,
  retryValueValues,
} from './src/record.mjs'

const schema = JSON.parse(
  await readFile(new URL('./.spec/schemas/request-agent-record-v1.schema.json', import.meta.url)),
)
const managedSchema = JSON.parse(
  await readFile(new URL('./agent/.spec/schemas/managed-agent-v1.schema.json', import.meta.url)),
)
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
ajv.addKeyword({
  keyword: 'x-maxUtf8Bytes',
  type: 'string',
  schemaType: 'number',
  validate: (maximum, value) => Buffer.byteLength(value, 'utf8') <= maximum,
})
ajv.addKeyword({
  keyword: 'x-safeHttpsUrl',
  type: 'string',
  schemaType: 'boolean',
  validate: (_enabled, value) => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && !url.username && !url.password
    } catch {
      return false
    }
  },
})
ajv.addKeyword({
  keyword: 'x-isoUtcTimestamp',
  type: 'string',
  schemaType: 'boolean',
  validate: (_enabled, value) => {
    if (!Number.isFinite(Date.parse(value))) return false
    const normalized = value.includes('.') ? value : value.replace(/Z$/u, '.000Z')
    return new Date(value).toISOString() === normalized
  },
})
ajv.addKeyword({
  keyword: 'x-sameGitHubRepository',
  type: 'object',
  schemaType: 'boolean',
  validate: (_enabled, value) => {
    const request = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/issues\//u.exec(value.request)
    const target = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)(?:\/pull\/|$)/u.exec(
      value.target?.repository ?? value.target?.pullRequest,
    )
    return Boolean(request && target && request[1] === target[1] && request[2] === target[2])
  },
})
ajv.addSchema(managedSchema)

function managedValidator(definition) {
  return ajv.compile({ $ref: `${managedSchema.$id}#/$defs/${definition}` })
}

test('keeps the schema object keys and enumerations closed against runtime admission', () => {
  assert.deepEqual(Object.keys(schema.properties), recordKeyValues)
  assert.deepEqual(schema.properties.operation.enum, recordOperationValues)
  assert.deepEqual(schema.properties.state.enum, recordStateValues)
  assert.deepEqual(schema.properties.failure.properties.code.enum, failureCodeValues)
  assert.deepEqual(schema.properties.failure.properties.retry.enum, retryValueValues)
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.run.additionalProperties, false)
  assert.equal(schema.properties.failure.additionalProperties, false)
  assert.equal(schema.properties.version.const, 1)
  assert.deepEqual(
    schema.required,
    recordKeyValues.filter(
      (key) => !['run', 'providerUrl', 'pullRequest', 'failure'].includes(key),
    ),
  )
  assert.deepEqual(schema.allOf[0], {
    if: { properties: { state: { const: 'reserved' } } },
    then: { not: { anyOf: [{ required: ['run'] }, { required: ['failure'] }] } },
  })
  assert.deepEqual(schema.allOf[1], {
    if: { properties: { state: { const: 'succeeded' } } },
    then: { required: ['run', 'pullRequest'] },
  })
  assert.deepEqual(schema.allOf[2].then.required, ['failure'])
  assert.deepEqual(schema.allOf[2].then.not, { required: ['run'] })
  assert.deepEqual(schema.allOf[3].then.required, ['run'])
})

test('keeps managed job, run, failure, and retry vocabulary closed across schema and runtime', () => {
  assert.deepEqual(managedSchema.$defs.run.properties.state.enum, managedRunStateValues)
  assert.deepEqual(Object.keys(managedAgentRunState.transitions), managedRunStateValues)
  assert.deepEqual(managedSchema.$defs.failure.properties.code.enum, managedFailureCodeValues)
  assert.deepEqual(managedSchema.$defs.failure.properties.retry.enum, managedRetryValues)
  assert.equal(
    managedSchema.$defs.job.properties.objective['x-maxUtf8Bytes'],
    managedAgentLimits.maxObjectiveUtf8Bytes,
  )
  assert.equal(
    managedSchema.$defs.runRef.properties.id['x-maxUtf8Bytes'],
    managedAgentLimits.maxOpaqueRunIdentityUtf8Bytes,
  )
})

test('admits the same bounded managed job and run fixtures through schema and runtime', () => {
  const validateJob = managedValidator('job')
  const validateRun = managedValidator('run')
  const run = {
    ref: { provider: 'fixture', id: 'opaque-run' },
    state: 'succeeded',
    providerUrl: 'https://provider.example/runs/1',
    branch: 'agent/request-123',
    pullRequest: 'https://github.com/astrale-os/ui/pull/77',
    createdAt: '2026-08-29T00:00:00Z',
    updatedAt: '2026-08-29T00:01:00.000Z',
  }
  assert.equal(validateJob(job), true, JSON.stringify(validateJob.errors))
  assert.deepEqual(acceptManagedAgentJob(job), job)
  assert.equal(validateRun(run), true, JSON.stringify(validateRun.errors))
  assert.deepEqual(acceptManagedAgentRun(run), run)

  const wrongRepository = {
    ...job,
    target: { kind: 'repository', repository: 'https://github.com/example/other', baseRef: 'main' },
  }
  assert.equal(validateJob(wrongRepository), false)
  assert.throws(() => acceptManagedAgentJob(wrongRepository), /same repository/u)

  const unknownJobField = { ...job, model: 'provider-private' }
  assert.equal(validateJob(unknownJobField), false)
  assert.throws(() => acceptManagedAgentJob(unknownJobField), /unknown field/u)

  const validateRunRef = managedValidator('runRef')
  const unknownRefField = { provider: 'fixture', id: 'opaque', session: 'private' }
  assert.equal(validateRunRef(unknownRefField), false)
  assert.throws(() => acceptRunRef(unknownRefField, 'fixture'), /unknown field/u)

  const oversized = { ...job, objective: '🪐'.repeat(20_000) }
  assert.equal(validateJob(oversized), false)
  assert.throws(() => acceptManagedAgentJob(oversized), /UTF-8 bytes/u)

  const longOwner = 'x'.repeat(5000)
  const oversizedUrl = {
    ...job,
    request: `https://github.com/${longOwner}/ui/issues/123`,
    target: {
      kind: 'repository',
      repository: `https://github.com/${longOwner}/ui`,
      baseRef: 'main',
    },
  }
  assert.equal(validateJob(oversizedUrl), false)
  assert.throws(() => acceptManagedAgentJob(oversizedUrl), /UTF-8 bytes/u)

  for (const malformed of [
    { ...run, pullRequest: undefined },
    { ...run, providerUrl: 'https://token:secret@provider.example/runs/1' },
    { ...run, providerUrl: 'https://?' },
    { ...run, updatedAt: '2026-02-31T00:00:00Z' },
    { ...run, ref: { ...run.ref, session: 'provider-private' } },
  ]) {
    assert.equal(validateRun(malformed), false)
    assert.throws(() => acceptManagedAgentRun(malformed))
  }
})

test('admits every managed operation-result discriminator in the durable schema', () => {
  const run = {
    ref: { provider: 'fixture', id: 'opaque-run' },
    state: 'running',
    createdAt: '2026-08-29T00:00:00Z',
    updatedAt: '2026-08-29T00:01:00Z',
  }
  const failed = {
    kind: 'failed',
    failure: { code: 'AGENT_UNAVAILABLE', message: 'Unavailable.', retry: 'safe' },
  }
  const cancelledRun = { ...run, state: 'cancelled' }
  const failedRun = { ...run, state: 'failed', failure: failed.failure }
  const cases = [
    ['dispatchResult', { kind: 'accepted', run }],
    ['dispatchResult', failed],
    ['observeResult', { kind: 'observed', run }],
    ['reconcileResult', { kind: 'found', run }],
    ['reconcileResult', { kind: 'absent' }],
    ['reconcileResult', { kind: 'ambiguous' }],
    ['cancelResult', { kind: 'requested', run }],
    ['cancelResult', { kind: 'unsupported', run }],
    ['cancelResult', { kind: 'cancelled', run: cancelledRun }],
    ['cancelResult', { kind: 'already-terminal', run: failedRun }],
  ]
  for (const [definition, value] of cases) {
    const validate = managedValidator(definition)
    assert.equal(validate(value), true, `${definition}: ${JSON.stringify(validate.errors)}`)
  }
  const validateCancel = managedValidator('cancelResult')
  assert.equal(validateCancel({ kind: 'cancelled', run }), false)
  assert.equal(validateCancel({ kind: 'already-terminal', run }), false)
})
