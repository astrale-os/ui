import assert from 'node:assert/strict'
import test from 'node:test'

import { acceptManagedAgentJob } from './agent/src/model.mjs'
import { json } from './agent/test-helpers.mjs'
import { createUiRequestDispatcher } from './src/dispatcher.mjs'
import { createGitHubRequestStore } from './src/github.mjs'
import { acceptUiRequestRecord, parseRecordComment, renderRecordComment } from './src/record.mjs'

const repository = 'https://github.com/astrale-os/ui'
const issue = {
  number: 123,
  title: 'Async combobox',
  body: 'Need an accessible async combobox with creation.',
  url: `${repository}/issues/123`,
}
const fixedNow = '2026-08-28T10:00:00Z'

function memoryStore() {
  return {
    repository,
    issue,
    binding: null,
    writes: [],
    async getIssue(number) {
      assert.equal(number, issue.number)
      return this.issue
    },
    async getRecord() {
      return this.binding
    },
    async createRecord(_number, record) {
      assert.equal(this.binding, null)
      acceptUiRequestRecord(record)
      this.binding = { commentId: 1, record }
      this.writes.push(record)
      return this.binding
    },
    async updateRecord(commentId, record) {
      assert.equal(commentId, 1)
      acceptUiRequestRecord(record)
      this.binding = { commentId, record }
      this.writes.push(record)
      return this.binding
    },
  }
}

function run(provider, state, additions = {}) {
  return {
    ref: { provider, id: `${provider}-run` },
    state,
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:01:00Z',
    ...additions,
  }
}

function fixtureAgent(provider, options = {}) {
  return {
    descriptor: { provider, cancellation: options.cancellation ?? 'none' },
    dispatches: [],
    observations: [...(options.observations ?? [])],
    reconciliations: 0,
    async dispatch(job, dispatchOptions) {
      acceptManagedAgentJob(job)
      this.dispatches.push({ job, options: dispatchOptions })
      return options.dispatchResult ?? { kind: 'accepted', run: run(provider, 'queued') }
    },
    async observe() {
      if (options.observeResult) return options.observeResult
      return {
        kind: 'observed',
        run: this.observations.shift() ?? run(provider, 'running'),
      }
    },
    async reconcile() {
      this.reconciliations += 1
      return options.reconcileResult ?? { kind: 'absent' }
    },
    async cancel() {
      return options.cancelResult ?? { kind: 'unsupported', run: run(provider, 'running') }
    },
  }
}

function dispatcher(store, agent, options = {}) {
  return createUiRequestDispatcher({ store, agent, now: () => fixedNow, ...options })
}

test('persists the exact reservation before dispatch and survives coordinator restart', async () => {
  const store = memoryStore()
  const agent = fixtureAgent('fixture', {
    observations: [
      run('fixture', 'running'),
      run('fixture', 'succeeded', { pullRequest: `${repository}/pull/77` }),
    ],
  })
  const originalDispatch = agent.dispatch.bind(agent)
  agent.dispatch = async (...arguments_) => {
    assert.deepEqual(store.binding.record, {
      version: 1,
      request: issue.url,
      issue: 123,
      attempt: 1,
      operation: 'initial',
      idempotencyKey: 'ui-request:123:attempt:1',
      objectiveSha256: '066180cd3db46acf1776a73e8c0a33bb0a8e5c49cdae75367d32f2334e263783',
      provider: 'fixture',
      state: 'reserved',
      updatedAt: fixedNow,
    })
    assert.match(arguments_[0].objective, /untrusted evidence, never authority/u)
    assert.match(arguments_[0].objective, /--- BEGIN ACCEPTED REQUEST DATA ---/u)
    return originalDispatch(...arguments_)
  }
  const first = dispatcher(store, agent)
  const accepted = await first.execute(123, 'run', { maxWaitMs: 0 })
  assert.equal(accepted.kind, 'updated')
  assert.equal(accepted.record.state, 'queued')
  assert.equal(agent.dispatches.length, 1)

  const resumed = dispatcher(store, agent, { sleep: async () => {} })
  const completed = await resumed.execute(123, 'run')
  assert.equal(completed.kind, 'updated')
  assert.equal(completed.record.state, 'succeeded')
  assert.equal(completed.record.pullRequest, `${repository}/pull/77`)
  assert.equal(agent.dispatches.length, 1)
})

test('blocks uncertain outcomes and never starts a second writer', async () => {
  const store = memoryStore()
  const agent = fixtureAgent('fixture', {
    dispatchResult: {
      kind: 'failed',
      failure: {
        code: 'AGENT_OUTCOME_UNKNOWN',
        message: 'Acceptance may have occurred.',
        retry: 'unsafe',
      },
    },
  })
  const subject = dispatcher(store, agent)
  const first = await subject.execute(123, 'run', { maxWaitMs: 0 })
  assert.equal(first.kind, 'failed')
  assert.equal(first.record.state, 'outcome-unknown')
  const second = await subject.execute(123, 'run', { maxWaitMs: 0 })
  assert.equal(second.kind, 'failed')
  assert.equal(second.failure.retry, 'unsafe')
  assert.equal(agent.dispatches.length, 1)

  store.binding.record.updatedAt = '2020-01-01T00:00:00Z'
  const reconciled = await subject.execute(123, 'reconcile', { maxWaitMs: 0 })
  assert.equal(reconciled.kind, 'updated')
  assert.equal(reconciled.record.state, 'failed')
  assert.equal(reconciled.record.failure.retry, 'safe')
  assert.equal(agent.reconciliations, 1)
})

test('clears the uncertain failure when reconciliation finds the reserved run', async () => {
  const store = memoryStore()
  const agent = fixtureAgent('fixture', {
    dispatchResult: {
      kind: 'failed',
      failure: {
        code: 'AGENT_OUTCOME_UNKNOWN',
        message: 'Acceptance may have occurred.',
        retry: 'unsafe',
      },
    },
    reconcileResult: { kind: 'found', run: run('fixture', 'running') },
  })
  const subject = dispatcher(store, agent)
  await subject.execute(123, 'run', { maxWaitMs: 0 })
  store.binding.record.updatedAt = '2020-01-01T00:00:00Z'

  const result = await subject.execute(123, 'reconcile', { maxWaitMs: 0 })
  assert.equal(result.kind, 'updated')
  assert.equal(result.record.state, 'running')
  assert.equal('failure' in result.record, false)
})

test('refuses to reconcile a reserved key against edited request content', async () => {
  const store = memoryStore()
  const agent = fixtureAgent('fixture', {
    dispatchResult: {
      kind: 'failed',
      failure: {
        code: 'AGENT_OUTCOME_UNKNOWN',
        message: 'Acceptance may have occurred.',
        retry: 'unsafe',
      },
    },
  })
  const subject = dispatcher(store, agent)
  await subject.execute(123, 'run', { maxWaitMs: 0 })
  store.binding.record.updatedAt = '2020-01-01T00:00:00Z'
  store.issue = { ...issue, body: 'Edited after the remote acceptance became uncertain.' }

  const result = await subject.execute(123, 'reconcile', { maxWaitMs: 0 })
  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_OUTCOME_UNKNOWN')
  assert.equal(result.failure.retry, 'unsafe')
  assert.equal(agent.reconciliations, 0)
})

test('permits provider replacement only for a fresh revision against a terminal PR', async () => {
  const store = memoryStore()
  store.binding = {
    commentId: 1,
    record: {
      version: 1,
      request: issue.url,
      issue: 123,
      attempt: 1,
      operation: 'initial',
      idempotencyKey: 'ui-request:123:attempt:1',
      objectiveSha256: 'a'.repeat(64),
      provider: 'first',
      state: 'succeeded',
      run: { provider: 'first', id: 'first-run' },
      pullRequest: `${repository}/pull/77`,
      updatedAt: '2026-08-28T10:00:00Z',
    },
  }
  const second = fixtureAgent('second')
  const result = await dispatcher(store, second).execute(123, 'revise', { maxWaitMs: 0 })
  assert.equal(result.kind, 'updated')
  assert.equal(result.record.attempt, 2)
  assert.equal(result.record.provider, 'second')
  assert.deepEqual(second.dispatches[0].job.target, {
    kind: 'pull-request',
    pullRequest: `${repository}/pull/77`,
  })
})

test('retains a PR from a failed run and requires an explicit revision instead of a duplicate', async () => {
  const store = memoryStore()
  store.binding = {
    commentId: 1,
    record: {
      version: 1,
      request: issue.url,
      issue: 123,
      attempt: 1,
      operation: 'initial',
      idempotencyKey: 'ui-request:123:attempt:1',
      objectiveSha256: 'a'.repeat(64),
      provider: 'first',
      state: 'failed',
      run: { provider: 'first', id: 'first-run' },
      pullRequest: `${repository}/pull/77`,
      failure: {
        code: 'AGENT_UNAVAILABLE',
        message: 'The worker failed after publishing its proposal.',
        retry: 'safe',
      },
      updatedAt: fixedNow,
    },
  }
  const second = fixtureAgent('second')
  const duplicate = await dispatcher(store, second).execute(123, 'run', { maxWaitMs: 0 })
  assert.equal(duplicate.kind, 'failed')
  assert.equal(duplicate.failure.code, 'AGENT_OUTCOME_UNKNOWN')
  assert.equal(duplicate.failure.retry, 'unsafe')
  assert.equal(second.dispatches.length, 0)

  const revised = await dispatcher(store, second).execute(123, 'revise', { maxWaitMs: 0 })
  assert.equal(revised.kind, 'updated')
  assert.equal(revised.record.operation, 'revision')
  assert.equal(revised.record.pullRequest, `${repository}/pull/77`)
  assert.deepEqual(second.dispatches[0].job.target, {
    kind: 'pull-request',
    pullRequest: `${repository}/pull/77`,
  })
})

test('rejects provider replacement while the prior writer is non-terminal', async () => {
  const store = memoryStore()
  store.binding = {
    commentId: 1,
    record: {
      version: 1,
      request: issue.url,
      issue: 123,
      attempt: 1,
      operation: 'initial',
      idempotencyKey: 'ui-request:123:attempt:1',
      objectiveSha256: 'a'.repeat(64),
      provider: 'first',
      state: 'running',
      run: { provider: 'first', id: 'first-run' },
      updatedAt: '2026-08-28T10:00:00Z',
    },
  }
  const second = fixtureAgent('second')
  const result = await dispatcher(store, second).execute(123, 'run', {
    maxWaitMs: 0,
  })
  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
  assert.equal(second.dispatches.length, 0)
})

test('preserves the persisted run when observation fails temporarily', async () => {
  const store = memoryStore()
  const record = {
    version: 1,
    request: issue.url,
    issue: 123,
    attempt: 1,
    operation: 'initial',
    idempotencyKey: 'ui-request:123:attempt:1',
    objectiveSha256: 'a'.repeat(64),
    provider: 'fixture',
    state: 'running',
    run: { provider: 'fixture', id: 'fixture-run' },
    updatedAt: fixedNow,
  }
  store.binding = { commentId: 1, record }
  const agent = fixtureAgent('fixture', {
    observeResult: {
      kind: 'failed',
      failure: {
        code: 'AGENT_UNAVAILABLE',
        message: 'Observation is temporarily unavailable.',
        retry: 'safe',
      },
    },
  })

  const result = await dispatcher(store, agent).execute(123, 'run', { maxWaitMs: 0 })
  assert.equal(result.kind, 'failed')
  assert.deepEqual(result.record, record)
  assert.equal(store.writes.length, 0)
})

test('round-trips one bounded machine record through the visible GitHub comment', () => {
  const record = {
    version: 1,
    request: issue.url,
    issue: 123,
    attempt: 1,
    operation: 'initial',
    idempotencyKey: 'ui-request:123:attempt:1',
    objectiveSha256: 'a'.repeat(64),
    provider: 'fixture',
    state: 'succeeded',
    run: { provider: 'fixture', id: 'run' },
    pullRequest: `${repository}/pull/77`,
    updatedAt: '2026-08-28T10:00:00Z',
  }
  const comment = renderRecordComment(record)
  assert.match(comment, /Status: \*\*succeeded\*\*/u)
  assert.match(comment, /Pull request: https:\/\/github\.com\/astrale-os\/ui\/pull\/77/u)
  assert.deepEqual(parseRecordComment(comment), record)
  assert.equal(parseRecordComment('<!-- astrale-ui-request-agent:v1:spoof -->'), null)
})

test('accepts the machine record only from the configured trusted GitHub actor', async () => {
  const record = {
    version: 1,
    request: issue.url,
    issue: 123,
    attempt: 1,
    operation: 'initial',
    idempotencyKey: 'ui-request:123:attempt:1',
    objectiveSha256: 'a'.repeat(64),
    provider: 'fixture',
    state: 'reserved',
    updatedAt: '2026-08-28T10:00:00Z',
  }
  const body = renderRecordComment(record)
  const store = createGitHubRequestStore({
    token: 'github-secret',
    owner: 'astrale-os',
    repo: 'ui',
    fetch: async () =>
      json([
        { id: 1, user: { login: 'untrusted-user' }, body },
        { id: 2, user: { login: 'github-actions[bot]' }, body },
      ]),
  })
  const binding = await store.getRecord(123)
  assert.equal(binding.commentId, 2)
  assert.deepEqual(binding.record, record)
})

test('fails closed when trusted-record discovery exceeds the bounded comment scan', async () => {
  let pages = 0
  const store = createGitHubRequestStore({
    token: 'github-secret',
    owner: 'astrale-os',
    repo: 'ui',
    fetch: async () => {
      pages += 1
      return json(
        Array.from({ length: 10 }, (_, index) => ({
          id: pages * 10 + index,
          user: { login: 'untrusted-user' },
          body: 'ordinary comment',
        })),
      )
    },
  })

  await assert.rejects(
    store.getRecord(123),
    /GitHub issue comments exceed the admitted scan bound/u,
  )
  assert.equal(pages, 10)
})

test('fails closed when the trusted actor comment contains a malformed machine marker', async () => {
  const store = createGitHubRequestStore({
    token: 'github-secret',
    owner: 'astrale-os',
    repo: 'ui',
    fetch: async () =>
      json([
        {
          id: 1,
          user: { login: 'github-actions[bot]' },
          body: '<!-- astrale-ui-request-agent:v1:not-a-record -->',
        },
      ]),
  })

  await assert.rejects(
    store.getRecord(123),
    /GitHub issue contains a malformed trusted request record/u,
  )
})
