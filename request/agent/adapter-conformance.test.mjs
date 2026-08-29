import assert from 'node:assert/strict'
import test from 'node:test'

import { createCursorAgent } from './adapters/cursor.mjs'
import { createGitHubActionsClaudeCodeAgent } from './adapters/github-actions-claude-code.mjs'
import { createGitHubCopilotAgent } from './adapters/github-copilot.mjs'
import { job, json, repository } from './test-helpers.mjs'

const githubTask = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  html_url: 'https://github.com/astrale-os/ui/copilot/tasks/a1b2',
  state: 'queued',
  artifacts: [],
  sessions: [{ head_ref: 'copilot/request-123', base_ref: 'main' }],
  created_at: '2026-08-28T10:00:00Z',
  updated_at: '2026-08-28T10:01:00Z',
}

function githubHarness() {
  let calls = 0
  const fetch = async (url, init = {}) => {
    calls += 1
    if (init.method === 'POST') return json(githubTask, 201)
    if (url.includes('?per_page=100')) return json({ tasks: [] })
    return json({
      ...githubTask,
      state: 'completed',
      artifacts: [{ provider: 'github', type: 'pull', data: { id: 77 } }],
    })
  }
  return {
    provider: 'github-copilot',
    create: () => createGitHubCopilotAgent({ token: 'token', fetch }),
    calls: () => calls,
  }
}

function cursorHarness() {
  let calls = 0
  const fetch = async (url, init = {}) => {
    calls += 1
    if (url.endsWith('/v1/agents') && init.method === 'POST') {
      const input = JSON.parse(init.body)
      return json({
        agent: { id: input.agentId },
        run: {
          id: 'run-00000000-0000-0000-0000-000000000001',
          agentId: input.agentId,
          status: 'CREATING',
          createdAt: '2026-08-28T10:00:00Z',
          updatedAt: '2026-08-28T10:01:00Z',
        },
      })
    }
    if (url.includes('/runs/')) {
      const agentId = url.split('/')[5]
      return json({
        id: 'run-00000000-0000-0000-0000-000000000001',
        agentId,
        status: 'FINISHED',
        createdAt: '2026-08-28T10:00:00Z',
        updatedAt: '2026-08-28T10:01:00Z',
        git: {
          branches: [
            {
              repoUrl: 'github.com/astrale-os/ui',
              branch: 'cursor/request-123',
              prUrl: `${repository}/pull/77`,
            },
          ],
        },
      })
    }
    return json({ code: 'not_found' }, 404)
  }
  return {
    provider: 'cursor',
    create: () => createCursorAgent({ token: 'token', fetch }),
    calls: () => calls,
  }
}

function githubActionsClaudeCodeHarness() {
  let calls = 0
  const run = {
    id: 771,
    run_attempt: 1,
    name: 'UI Request Claude Code Worker',
    display_title: 'Astrale attempt: attempt',
    event: 'workflow_dispatch',
    path: '.github/workflows/ui-request-claude-code.yml',
    head_branch: 'main',
    actor: { login: 'github-actions[bot]' },
    triggering_actor: { login: 'github-actions[bot]' },
    status: 'completed',
    conclusion: 'success',
    html_url: `${repository}/actions/runs/771`,
    created_at: '2026-08-28T10:00:00Z',
    updated_at: '2026-08-28T10:01:00Z',
  }
  const fetch = async (url, init = {}) => {
    calls += 1
    if (url.endsWith('/dispatches') && init.method === 'POST') {
      return json({ workflow_run_id: 771, html_url: run.html_url })
    }
    if (url.endsWith('/actions/runs/771')) return json(run)
    if (url.includes('/pulls?')) return json([{ html_url: `${repository}/pull/77` }])
    if (url.includes('/actions/workflows/') && url.includes('/runs?')) {
      return json({ workflow_runs: [] })
    }
    throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`)
  }
  return {
    provider: 'github-actions-claude-code',
    create: () =>
      createGitHubActionsClaudeCodeAgent({
        token: 'token',
        fetch,
        now: () => '2026-08-28T10:00:00Z',
      }),
    calls: () => calls,
  }
}

for (const createHarness of [githubHarness, cursorHarness, githubActionsClaudeCodeHarness]) {
  const name = createHarness().provider
  test(`${name} satisfies the shared restart, proposal, admission, and reconciliation contract`, async () => {
    const harness = createHarness()
    const first = harness.create()
    const beforeInvalid = harness.calls()
    const invalid = await first.dispatch({ ...job, objective: '' }, { idempotencyKey: 'attempt' })
    assert.equal(invalid.kind, 'failed')
    assert.equal(invalid.failure.code, 'AGENT_INVALID_JOB')
    assert.equal(harness.calls(), beforeInvalid)

    const accepted = await first.dispatch(job, { idempotencyKey: 'attempt' })
    assert.equal(accepted.kind, 'accepted')
    assert.equal(accepted.run.ref.provider, name)

    const restarted = harness.create()
    const observed = await restarted.observe(accepted.run.ref)
    assert.equal(observed.kind, 'observed')
    assert.deepEqual(
      { state: observed.run.state, pullRequest: observed.run.pullRequest },
      { state: 'succeeded', pullRequest: `${repository}/pull/77` },
    )

    const beforeMismatch = harness.calls()
    const mismatch = await restarted.observe({ provider: 'another-adapter', id: 'opaque' })
    assert.equal(mismatch.kind, 'failed')
    assert.equal(mismatch.failure.code, 'AGENT_INVALID_JOB')
    assert.equal(harness.calls(), beforeMismatch)

    const cancellation = await restarted.cancel(accepted.run.ref)
    assert.equal(cancellation.kind, 'already-terminal')
    assert.equal(cancellation.run.state, 'succeeded')

    const reconciled = await restarted.reconcile(job, { idempotencyKey: 'absent-attempt' })
    assert.deepEqual(reconciled, { kind: 'absent' })
  })
}

for (const [name, create] of [
  [
    'github-copilot',
    (fetch) => createGitHubCopilotAgent({ token: 'token', fetch, operationTimeoutMs: 5 }),
  ],
  ['cursor', (fetch) => createCursorAgent({ token: 'token', fetch, operationTimeoutMs: 5 })],
  [
    'github-actions-claude-code',
    (fetch) => createGitHubActionsClaudeCodeAgent({ token: 'token', fetch, operationTimeoutMs: 5 }),
  ],
]) {
  test(`${name} bounds a stalled dispatch without claiming remote cancellation`, async () => {
    let aborted = false
    const fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        const fail = () => {
          aborted = true
          reject(init.signal.reason)
        }
        if (init.signal.aborted) fail()
        else init.signal.addEventListener('abort', fail, { once: true })
      })
    const result = await create(fetch).dispatch(job, { idempotencyKey: 'timeout-attempt' })
    assert.equal(aborted, true)
    assert.equal(result.kind, 'failed')
    assert.equal(result.failure.code, 'AGENT_OUTCOME_UNKNOWN')
    assert.equal(result.failure.retry, 'unsafe')
  })
}
