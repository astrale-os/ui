import assert from 'node:assert/strict'
import test from 'node:test'

import { job, json, repository } from '../test-helpers.mjs'
import { createCursorAgent } from './cursor.mjs'

function run(status = 'CREATING', overrides = {}) {
  return {
    id: 'run-00000000-0000-0000-0000-000000000001',
    agentId: 'placeholder',
    status,
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:01:00Z',
    ...overrides,
  }
}

test('creates a deterministic Cursor agent with a provider-independent payload', async () => {
  let captured
  const agent = createCursorAgent({
    token: 'cursor-secret',
    fetch: async (url, init) => {
      const body = JSON.parse(init.body)
      captured = { url, init, body }
      return json({
        agent: { id: body.agentId },
        run: { ...run(), agentId: body.agentId },
      })
    },
  })
  const result = await agent.dispatch(job, { idempotencyKey: 'ui-request:123:attempt:1' })
  assert.equal(result.kind, 'accepted')
  assert.equal(result.run.state, 'queued')
  assert.equal(captured.body.agentId, 'bc-642b081d-3bfe-5016-aab5-aa9f7e0eeec8')
  assert.deepEqual(Object.keys(captured.body).sort(), [
    'agentId',
    'autoCreatePR',
    'prompt',
    'repos',
    'skipReviewerRequest',
    'workOnCurrentBranch',
  ])
  assert.equal(
    captured.body.prompt.text,
    `Astrale UI request: ${job.request}\nAstrale attempt: ui-request:123:attempt:1\n\n${job.objective}`,
  )
  assert.deepEqual(captured.body.repos, [{ url: repository, startingRef: 'main' }])
  assert.equal(captured.body.autoCreatePR, true)
  assert.equal(captured.body.workOnCurrentBranch, false)
  assert.equal(captured.body.model, undefined)
  assert.equal(captured.body.mcpServers, undefined)
  assert.doesNotMatch(JSON.stringify(captured.body), /cursor-secret/u)
})

test('maps Cursor runs, validates one intended PR, and confirms cancellation', async () => {
  let current
  let cancelled = false
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      if (url.endsWith('/v1/agents')) {
        const body = JSON.parse(init.body)
        current = { ...run(), agentId: body.agentId }
        return json({ agent: { id: body.agentId }, run: current })
      }
      if (url.endsWith('/cancel')) {
        cancelled = true
        current = { ...current, status: 'CANCELLED' }
        return json({ id: current.id })
      }
      return json(current)
    },
  })
  const dispatched = await agent.dispatch(job, { idempotencyKey: 'attempt' })
  assert.equal(dispatched.kind, 'accepted')
  const ref = dispatched.run.ref
  for (const [status, state] of [
    ['CREATING', 'queued'],
    ['RUNNING', 'running'],
    ['ERROR', 'failed'],
    ['EXPIRED', 'expired'],
  ]) {
    current = {
      ...current,
      status,
      ...(status === 'ERROR' ? { result: 'Authorization: Bearer provider-secret' } : {}),
    }
    const observed = await agent.observe(ref)
    assert.equal(observed.kind, 'observed')
    assert.equal(observed.run.state, state)
    if (status === 'ERROR') {
      assert.equal(observed.run.failure.message, 'The Cursor run failed.')
      assert.doesNotMatch(observed.run.failure.message, /provider-secret/u)
    }
  }
  current = {
    ...current,
    status: 'FINISHED',
    git: {
      branches: [
        {
          repoUrl: 'github.com/astrale-os/ui',
          branch: 'cursor/request',
          prUrl: `${repository}/pull/91`,
        },
      ],
    },
  }
  const succeeded = await agent.observe(ref)
  assert.equal(succeeded.kind, 'observed')
  assert.equal(succeeded.run.state, 'succeeded')
  assert.equal(succeeded.run.pullRequest, `${repository}/pull/91`)

  current = {
    ...current,
    git: {
      branches: [
        ...current.git.branches,
        {
          repoUrl: 'github.com/astrale-os/ui',
          branch: 'cursor/second',
          prUrl: `${repository}/pull/92`,
        },
      ],
    },
  }
  const multiple = await agent.observe(ref)
  assert.equal(multiple.kind, 'failed')
  assert.equal(multiple.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')

  current = {
    ...current,
    git: {
      branches: [
        {
          repoUrl: 'github.com/astrale-os/ui',
          branch: 'cursor/wrong-repository',
          prUrl: 'https://github.com/example/other/pull/1',
        },
      ],
    },
  }
  const wrongRepository = await agent.observe(ref)
  assert.equal(wrongRepository.kind, 'failed')
  assert.equal(wrongRepository.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')

  current = { ...current, status: 'RUNNING', git: undefined }
  const cancellation = await agent.cancel(ref)
  assert.equal(cancelled, true)
  assert.equal(cancellation.kind, 'cancelled')
  assert.equal(cancellation.run.state, 'cancelled')
})

test('uses the existing PR branch for a Cursor revision', async () => {
  let captured
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (_url, init) => {
      const body = JSON.parse(init.body)
      captured = body
      return json({ agent: { id: body.agentId }, run: { ...run(), agentId: body.agentId } })
    },
  })
  const result = await agent.dispatch(
    { ...job, target: { kind: 'pull-request', pullRequest: `${repository}/pull/91` } },
    { idempotencyKey: 'revision' },
  )
  assert.equal(result.kind, 'accepted')
  assert.deepEqual(captured.repos, [{ url: repository, prUrl: `${repository}/pull/91` }])
  assert.equal(captured.workOnCurrentBranch, true)
})

test('recovers an idempotent Cursor create conflict without creating another agent', async () => {
  let agentId
  let requests = 0
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      requests += 1
      if (url.endsWith('/v1/agents')) {
        agentId = JSON.parse(init.body).agentId
        return json({ code: 'agent_id_conflict' }, 409)
      }
      if (url.endsWith(`/v1/agents/${agentId}`)) {
        return json({
          id: agentId,
          latestRunId: run().id,
          repos: [{ url: repository, startingRef: 'main' }],
        })
      }
      return json({ ...run(), agentId })
    },
  })
  const result = await agent.dispatch(job, { idempotencyKey: 'same-attempt' })
  assert.equal(result.kind, 'accepted')
  assert.equal(result.run.state, 'queued')
  assert.equal(requests, 3)
})

test('rejects unknown Cursor states instead of guessing', async () => {
  let current
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      if (url.endsWith('/v1/agents')) {
        const body = JSON.parse(init.body)
        current = { ...run(), agentId: body.agentId }
        return json({ agent: { id: body.agentId }, run: current })
      }
      return json({ ...current, status: 'PAUSED_BY_FUTURE_API' })
    },
  })
  const dispatched = await agent.dispatch(job, { idempotencyKey: 'attempt' })
  const observed = await agent.observe(dispatched.run.ref)
  assert.equal(observed.kind, 'failed')
  assert.equal(observed.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
})

test('reconciles a missing deterministic Cursor attempt as absent', async () => {
  const calls = []
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      calls.push({ url, method: init.method ?? 'GET' })
      return json({ code: 'not_found' }, 404)
    },
  })
  const reconciled = await agent.reconcile(job, { idempotencyKey: 'missing-attempt' })
  assert.deepEqual(reconciled, { kind: 'absent' })
  assert.deepEqual(calls, [
    {
      url: 'https://api.cursor.com/v1/agents/bc-10bdc6bf-24f3-5fe5-b0ec-72b613ac3c2f',
      method: 'GET',
    },
  ])
})

test('reconciles an existing exact Cursor target through GET-only observation', async () => {
  const calls = []
  let agentId
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      calls.push({ url, method: init.method ?? 'GET' })
      if (!url.includes('/runs/')) {
        agentId = url.split('/').at(-1)
        return json({
          id: agentId,
          latestRunId: run().id,
          repos: [{ url: repository, startingRef: 'main' }],
        })
      }
      return json({ ...run('RUNNING'), agentId })
    },
  })
  const result = await agent.reconcile(job, { idempotencyKey: 'existing-attempt' })
  assert.equal(result.kind, 'found')
  assert.equal(result.run.state, 'running')
  assert.deepEqual(
    calls.map(({ method }) => method),
    ['GET', 'GET'],
  )
  assert.match(calls[0].url, /\/v1\/agents\/bc-/u)
  assert.match(calls[1].url, /\/runs\/run-00000000-0000-0000-0000-000000000001$/u)
})

test('rejects conflict recovery when a revision agent belongs to another PR target', async () => {
  let expectedAgent
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      if (url.endsWith('/v1/agents')) {
        expectedAgent = JSON.parse(init.body).agentId
        return json({ code: 'agent_id_conflict' }, 409)
      }
      return json({
        id: expectedAgent,
        latestRunId: run().id,
        repos: [{ url: repository, prUrl: `${repository}/pull/90` }],
      })
    },
  })
  const result = await agent.dispatch(
    { ...job, target: { kind: 'pull-request', pullRequest: `${repository}/pull/91` } },
    { idempotencyKey: 'revision-conflict' },
  )
  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
})

test('reports requested cancellation until Cursor observes a terminal cancellation', async () => {
  let current
  const agent = createCursorAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      if (url.endsWith('/v1/agents')) {
        const input = JSON.parse(init.body)
        current = { ...run('RUNNING'), agentId: input.agentId }
        return json({ agent: { id: input.agentId }, run: current })
      }
      if (url.endsWith('/cancel')) return json({ id: current.id })
      return json(current)
    },
  })
  const dispatched = await agent.dispatch(job, { idempotencyKey: 'cancel-pending' })
  const result = await agent.cancel(dispatched.run.ref)
  assert.equal(result.kind, 'requested')
  assert.equal(result.run.state, 'running')
})
