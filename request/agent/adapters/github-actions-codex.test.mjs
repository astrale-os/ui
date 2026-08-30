import assert from 'node:assert/strict'
import test from 'node:test'

import { job, json, repository } from '../test-helpers.mjs'
import {
  attemptMarker,
  createGitHubActionsCodexAgent,
  deterministicBranch,
} from './github-actions-codex.mjs'

test('dispatches the normalized job through the dedicated Codex workflow', async () => {
  let request
  const agent = createGitHubActionsCodexAgent({
    token: 'github-token',
    now: () => '2026-08-30T00:00:00Z',
    fetch: async (url, init) => {
      request = { url, init, body: JSON.parse(init.body) }
      return json({
        workflow_run_id: 881,
        html_url: `${repository}/actions/runs/881`,
      })
    },
  })

  const result = await agent.dispatch(job, { idempotencyKey: 'attempt' })

  assert.equal(result.kind, 'accepted')
  assert.equal(result.run.ref.provider, 'github-actions-codex')
  assert.equal(result.run.branch, deterministicBranch('attempt'))
  assert.equal(
    request.url,
    `${repository.replace('github.com', 'api.github.com/repos')}/actions/workflows/ui-request-codex.yml/dispatches`,
  )
  assert.equal(request.body.inputs.attempt, 'attempt')
})

test('observes only exact Codex worker identity', async () => {
  let wrongWorkflow = false
  const agent = createGitHubActionsCodexAgent({
    token: 'github-token',
    now: () => '2026-08-30T00:00:00Z',
    fetch: async (url) => {
      if (url.includes('/pulls?')) return json([])
      return json({
        id: 881,
        run_attempt: 1,
        display_title: attemptMarker('attempt'),
        event: 'workflow_dispatch',
        path: wrongWorkflow
          ? '.github/workflows/ui-request-claude-code.yml'
          : '.github/workflows/ui-request-codex.yml',
        head_branch: 'main',
        actor: { login: 'github-actions[bot]' },
        triggering_actor: { login: 'github-actions[bot]' },
        status: 'in_progress',
        conclusion: null,
        created_at: '2026-08-30T00:00:00Z',
        updated_at: '2026-08-30T00:00:01Z',
      })
    },
  })
  const dispatched = createGitHubActionsCodexAgent({
    token: 'github-token',
    now: () => '2026-08-30T00:00:00Z',
    fetch: async () => json({ workflow_run_id: 881 }),
  })
  const accepted = await dispatched.dispatch(job, { idempotencyKey: 'attempt' })

  const observed = await agent.observe(accepted.run.ref)

  assert.equal(observed.kind, 'observed')
  assert.equal(observed.run.state, 'running')
  wrongWorkflow = true
  const mismatched = await agent.observe(accepted.run.ref)
  assert.equal(mismatched.kind, 'failed')
  assert.equal(mismatched.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
})
