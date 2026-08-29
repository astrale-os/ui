import assert from 'node:assert/strict'
import test from 'node:test'

import { job, json, repository } from '../test-helpers.mjs'
import { createGitHubCopilotAgent } from './github-copilot.mjs'

function task(state = 'queued', overrides = {}) {
  return {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    html_url: 'https://github.com/astrale-os/ui/copilot/tasks/a1b2',
    state,
    artifacts: [],
    sessions: [{ head_ref: 'copilot/request-123', base_ref: 'main' }],
    created_at: '2026-08-28T10:00:00Z',
    updated_at: '2026-08-28T10:01:00Z',
    ...overrides,
  }
}

test('dispatches the normalized job without exposing provider choices', async () => {
  let captured
  const agent = createGitHubCopilotAgent({
    token: 'secret-token',
    fetch: async (url, init) => {
      captured = { url, init, body: JSON.parse(init.body) }
      return json(task(), 201)
    },
  })
  const result = await agent.dispatch(job, { idempotencyKey: 'ui-request:123:attempt:1' })
  assert.equal(result.kind, 'accepted')
  assert.equal(result.run.state, 'queued')
  assert.equal(agent.descriptor.cancellation, 'none')
  assert.equal(captured.url, 'https://api.github.com/agents/repos/astrale-os/ui/tasks')
  assert.deepEqual(Object.keys(captured.body).sort(), ['base_ref', 'create_pull_request', 'prompt'])
  assert.equal(captured.body.base_ref, 'main')
  assert.equal(captured.body.create_pull_request, true)
  assert.equal(
    captured.body.prompt,
    `Astrale UI request: ${job.request}\nAstrale attempt: ui-request:123:attempt:1\n\n${job.objective}`,
  )
  assert.doesNotMatch(JSON.stringify(captured.body), /secret-token|model|mcp/u)
})

test('maps every documented GitHub state and requires one PR for success', async () => {
  let current = task()
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async (_url, init) => (init?.method === 'POST' ? json(task(), 201) : json(current)),
  })
  const dispatched = await agent.dispatch(job, { idempotencyKey: 'attempt' })
  assert.equal(dispatched.kind, 'accepted')
  const ref = dispatched.run.ref
  const cases = [
    ['queued', 'queued'],
    ['in_progress', 'running'],
    ['waiting_for_user', 'waiting-for-input'],
    ['idle', 'blocked'],
    ['failed', 'failed'],
    ['timed_out', 'expired'],
    ['cancelled', 'cancelled'],
  ]
  for (const [providerState, expected] of cases) {
    current = task(providerState)
    const observed = await agent.observe(ref)
    assert.equal(observed.kind, 'observed')
    assert.equal(observed.run.state, expected)
  }
  current = task('completed')
  const missing = await agent.observe(ref)
  assert.equal(missing.kind, 'observed')
  assert.equal(missing.run.state, 'failed')
  assert.equal(missing.run.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')

  current = task('completed', {
    artifacts: [{ provider: 'github', type: 'pull', data: { id: 88 } }],
  })
  const completed = await agent.observe(ref)
  assert.equal(completed.kind, 'observed')
  assert.deepEqual(
    { state: completed.run.state, pullRequest: completed.run.pullRequest },
    { state: 'succeeded', pullRequest: `${repository}/pull/88` },
  )
  const cancelled = await agent.cancel(ref)
  assert.equal(cancelled.kind, 'already-terminal')

  current = task('completed', {
    artifacts: [
      { provider: 'github', type: 'pull', data: { id: 88 } },
      { provider: 'github', type: 'pull', data: { id: 89 } },
    ],
  })
  const multiple = await agent.observe(ref)
  assert.equal(multiple.kind, 'failed')
  assert.equal(multiple.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
})

test('resolves an existing PR into GitHub head and base refs', async () => {
  const calls = []
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      calls.push({ url, init })
      if (url.endsWith('/pulls/88'))
        return json({ base: { ref: 'main' }, head: { ref: 'agent/pr-88' } })
      return json(task(), 201)
    },
  })
  const result = await agent.dispatch(
    { ...job, target: { kind: 'pull-request', pullRequest: `${repository}/pull/88` } },
    { idempotencyKey: 'revision' },
  )
  assert.equal(result.kind, 'accepted')
  const body = JSON.parse(calls[1].init.body)
  assert.equal(body.base_ref, 'main')
  assert.equal(body.head_ref, 'agent/pr-88')
})

test('classifies a failed revision preflight as safely unaccepted', async () => {
  let calls = 0
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async () => {
      calls += 1
      throw new Error('preflight unavailable')
    },
  })
  const result = await agent.dispatch(
    { ...job, target: { kind: 'pull-request', pullRequest: `${repository}/pull/88` } },
    { idempotencyKey: 'revision-preflight' },
  )
  assert.equal(result.kind, 'failed')
  assert.deepEqual(
    { code: result.failure.code, retry: result.failure.retry },
    { code: 'AGENT_UNAVAILABLE', retry: 'safe' },
  )
  assert.equal(calls, 1)
})

test('fails closed on uncertain dispatch and unknown provider state', async () => {
  const unavailable = createGitHubCopilotAgent({
    token: 'token',
    fetch: async () => {
      throw new Error('Authorization: Bearer secret')
    },
  })
  const dispatched = await unavailable.dispatch(job, { idempotencyKey: 'attempt' })
  assert.deepEqual(
    { code: dispatched.failure.code, retry: dispatched.failure.retry },
    { code: 'AGENT_OUTCOME_UNKNOWN', retry: 'unsafe' },
  )
  assert.doesNotMatch(dispatched.failure.message, /secret/u)

  let current = task()
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async (_url, init) => (init?.method === 'POST' ? json(task(), 201) : json(current)),
  })
  const accepted = await agent.dispatch(job, { idempotencyKey: 'attempt' })
  current = task('new_future_state')
  const observed = await agent.observe(accepted.run.ref)
  assert.equal(observed.kind, 'failed')
  assert.equal(observed.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
})

test('rejects unsafe provider URLs before a GitHub task crosses the normalized boundary', async () => {
  for (const htmlUrl of [
    'http://github.com/astrale-os/ui/copilot/tasks/unsafe',
    'https://token:secret@github.com/astrale-os/ui/copilot/tasks/unsafe',
    `https://github.com/${'x'.repeat(5000)}`,
  ]) {
    const agent = createGitHubCopilotAgent({
      token: 'token',
      fetch: async () => json(task('queued', { html_url: htmlUrl }), 201),
    })
    const result = await agent.dispatch(job, { idempotencyKey: 'unsafe-url-attempt' })
    assert.equal(result.kind, 'failed')
    assert.equal(result.failure.code, 'AGENT_OUTCOME_UNKNOWN')
    assert.equal(result.failure.retry, 'unsafe')
  }
})

test('classifies an explicit GitHub precondition rejection as safely unaccepted', async () => {
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async () => json({ message: 'precondition failed' }, 412),
  })
  const result = await agent.dispatch(job, { idempotencyKey: 'attempt' })
  assert.deepEqual(
    { code: result.failure.code, retry: result.failure.retry },
    { code: 'AGENT_PERMISSION_DENIED', retry: 'after-change' },
  )
})

test('reports unsupported cancellation for an active GitHub task', async () => {
  const agent = createGitHubCopilotAgent({ token: 'token', fetch: async () => json(task()) })
  const reference = {
    provider: 'github-copilot',
    id: Buffer.from(JSON.stringify({ owner: 'astrale-os', repo: 'ui', task: task().id })).toString(
      'base64url',
    ),
  }
  const result = await agent.cancel(reference)
  assert.equal(result.kind, 'unsupported')
  assert.equal(result.run.state, 'queued')
})

test('reconciles an uncertain GitHub attempt by its exact prompt marker', async () => {
  const matching = task('in_progress', {
    id: 'matching-task',
    html_url: 'https://github.com/astrale-os/ui/copilot/tasks/matching-task',
    sessions: [
      {
        prompt:
          'Astrale UI request: https://github.com/astrale-os/ui/issues/123\nAstrale attempt: ui-request:123:attempt:1',
      },
    ],
  })
  const prefixCollision = task('in_progress', {
    id: 'prefix-collision',
    sessions: [
      {
        prompt:
          'Astrale UI request: https://github.com/astrale-os/ui/issues/123\nAstrale attempt: ui-request:123:attempt:10',
      },
    ],
  })
  const calls = []
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      calls.push({ url, method: init.method ?? 'GET' })
      if (url.includes('?per_page=100')) {
        return json({ tasks: [{ id: prefixCollision.id }, { id: matching.id }] })
      }
      return json(url.endsWith(`/${matching.id}`) ? matching : prefixCollision)
    },
  })
  const found = await agent.reconcile(job, { idempotencyKey: 'ui-request:123:attempt:1' })
  assert.equal(found.kind, 'found')
  assert.equal(found.run.state, 'running')
  assert.equal(found.run.providerUrl, matching.html_url)
  assert.deepEqual(
    calls.map(({ method }) => method),
    ['GET', 'GET', 'GET'],
  )
  assert.match(calls[0].url, /tasks\?per_page=100&page=1&sort=created_at&direction=desc$/u)
  assert.match(calls[1].url, /tasks\/prefix-collision$/u)
  assert.match(calls[2].url, /tasks\/matching-task$/u)

  const absentAgent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async () => json({ tasks: [] }),
  })
  const absent = await absentAgent.reconcile(job, { idempotencyKey: 'missing' })
  assert.equal(absent.kind, 'absent')

  const ambiguousAgent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async (url) =>
      url.includes('?per_page=100')
        ? json({ tasks: [{ id: 'first' }, { id: 'second' }] })
        : json({ ...matching, id: url.endsWith('/first') ? 'first' : 'second' }),
  })
  const ambiguous = await ambiguousAgent.reconcile(job, {
    idempotencyKey: 'ui-request:123:attempt:1',
  })
  assert.equal(ambiguous.kind, 'ambiguous')
})

test('does not claim absence when GitHub reconciliation exhausts its page bound', async () => {
  let pages = 0
  const agent = createGitHubCopilotAgent({
    token: 'token',
    fetch: async (url) => {
      if (url.includes('?per_page=100')) {
        pages += 1
        return json({
          tasks: Array.from({ length: 100 }, (_, index) => ({ id: `task-${pages}-${index}` })),
        })
      }
      return json(task())
    },
  })
  const result = await agent.reconcile(job, { idempotencyKey: 'unseen-attempt' })
  assert.equal(result.kind, 'failed')
  assert.deepEqual(
    { code: result.failure.code, retry: result.failure.retry },
    { code: 'AGENT_OUTCOME_UNKNOWN', retry: 'unsafe' },
  )
  assert.equal(pages, 5)
})
