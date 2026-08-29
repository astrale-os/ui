import assert from 'node:assert/strict'
import test from 'node:test'

import { job, json, repository } from '../test-helpers.mjs'
import {
  attemptMarker,
  createGitHubActionsClaudeCodeAgent,
  deterministicBranch,
} from './github-actions-claude-code.mjs'

const fixedNow = '2026-08-29T10:00:00Z'
const runId = 771
const pullRequest = `${repository}/pull/77`

function workflowRun(overrides = {}) {
  return {
    id: runId,
    run_attempt: 1,
    name: 'UI Request Claude Code Worker',
    display_title: attemptMarker('attempt'),
    event: 'workflow_dispatch',
    path: '.github/workflows/ui-request-claude-code.yml',
    head_branch: 'main',
    actor: { login: 'github-actions[bot]' },
    triggering_actor: { login: 'github-actions[bot]' },
    status: 'queued',
    conclusion: null,
    html_url: `${repository}/actions/runs/${runId}`,
    created_at: fixedNow,
    updated_at: fixedNow,
    ...overrides,
  }
}

function pull(url = pullRequest) {
  return { html_url: url }
}

test('deterministic branches remain distinct for punctuation-equivalent attempt labels', () => {
  assert.notEqual(deterministicBranch('request:a:b'), deterministicBranch('request:a-b'))
  assert.equal(deterministicBranch('request:a:b'), deterministicBranch('request:a:b'))
})

test('dispatch uses the exact workflow run returned by the current GitHub API', async () => {
  let request
  const fetch = async (url, init = {}) => {
    request = { url, init, body: JSON.parse(init.body) }
    return json({
      workflow_run_id: runId,
      run_url: `https://api.github.com/repos/astrale-os/ui/actions/runs/${runId}`,
      html_url: `${repository}/actions/runs/${runId}`,
    })
  }
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'github-token',
    fetch,
    now: () => fixedNow,
  })

  const result = await agent.dispatch(job, { idempotencyKey: 'attempt' })

  assert.equal(result.kind, 'accepted')
  assert.deepEqual(
    {
      state: result.run.state,
      branch: result.run.branch,
      providerUrl: result.run.providerUrl,
      createdAt: result.run.createdAt,
    },
    {
      state: 'queued',
      branch: deterministicBranch('attempt'),
      providerUrl: `${repository}/actions/runs/${runId}`,
      createdAt: fixedNow,
    },
  )
  assert.equal(
    request.url,
    `${repository.replace('github.com', 'api.github.com/repos')}/actions/workflows/ui-request-claude-code.yml/dispatches`,
  )
  assert.equal(request.init.headers.Authorization, 'Bearer github-token')
  assert.equal(request.init.headers['X-GitHub-Api-Version'], '2026-03-10')
  assert.deepEqual(request.body, {
    ref: 'main',
    inputs: {
      attempt: 'attempt',
      request: `${repository}/issues/123`,
      base_ref: 'main',
      branch: deterministicBranch('attempt'),
      objective: [
        `Astrale UI request: ${repository}/issues/123`,
        'Astrale attempt: attempt',
        '',
        job.objective,
      ].join('\n'),
      pull_request: '',
    },
  })
})

test('dispatch fails closed when accepted workflow identity is absent', async () => {
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () => json({ html_url: `${repository}/actions/runs/unknown` }),
  })

  const result = await agent.dispatch(job, { idempotencyKey: 'attempt' })

  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_OUTCOME_UNKNOWN')
  assert.equal(result.failure.retry, 'unsafe')
})

for (const [status, code, retry] of [
  [422, 'AGENT_INVALID_JOB', 'after-change'],
  [500, 'AGENT_OUTCOME_UNKNOWN', 'unsafe'],
]) {
  test(`dispatch classifies HTTP ${status} without a second workflow POST`, async () => {
    let posts = 0
    const agent = createGitHubActionsClaudeCodeAgent({
      token: 'token',
      fetch: async (_url, init) => {
        assert.equal(init.method, 'POST')
        posts += 1
        return json({ message: 'rejected' }, status)
      },
    })

    const result = await agent.dispatch(job, { idempotencyKey: 'attempt' })

    assert.equal(result.kind, 'failed')
    assert.equal(result.failure.code, code)
    assert.equal(result.failure.retry, retry)
    assert.equal(posts, 1)
  })
}

test('invalid accepted dispatch JSON remains an unsafe unknown outcome', async () => {
  let posts = 0
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () => {
      posts += 1
      return new Response('{', { status: 200, headers: { 'content-type': 'application/json' } })
    },
  })

  const result = await agent.dispatch(job, { idempotencyKey: 'attempt' })

  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_OUTCOME_UNKNOWN')
  assert.equal(result.failure.retry, 'unsafe')
  assert.equal(posts, 1)
})

test('observation requires a successful workflow and exactly one open intended PR', async () => {
  let completed = false
  let proposals = [pull()]
  const fetch = async (url) => {
    if (url.endsWith(`/actions/runs/${runId}`)) {
      return json(
        completed
          ? workflowRun({ status: 'completed', conclusion: 'success' })
          : workflowRun({ status: 'in_progress' }),
      )
    }
    if (url.includes('/pulls?')) {
      const request = new URL(url)
      assert.equal(request.searchParams.get('head'), `astrale-os:${deterministicBranch('attempt')}`)
      assert.equal(request.searchParams.get('state'), 'open')
      assert.equal(request.searchParams.get('per_page'), '100')
      return json(proposals)
    }
    throw new Error(`Unexpected request: ${url}`)
  }
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch,
    now: () => fixedNow,
  })

  const dispatched = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    now: () => fixedNow,
    fetch: async () =>
      json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` }),
  })
  const initial = await dispatched.dispatch(job, { idempotencyKey: 'attempt' })
  assert.equal(initial.kind, 'accepted')

  const running = await agent.observe(initial.run.ref)
  assert.equal(running.kind, 'observed')
  assert.equal(running.run.state, 'running')

  completed = true
  const succeeded = await agent.observe(initial.run.ref)
  assert.equal(succeeded.kind, 'observed')
  assert.equal(succeeded.run.state, 'succeeded')
  assert.equal(succeeded.run.pullRequest, pullRequest)

  proposals = []
  const missing = await agent.observe(initial.run.ref)
  assert.equal(missing.kind, 'observed')
  assert.equal(missing.run.state, 'failed')
  assert.equal(missing.run.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')

  proposals = [pull(), pull(`${repository}/pull/78`)]
  const multiple = await agent.observe(initial.run.ref)
  assert.equal(multiple.kind, 'observed')
  assert.equal(multiple.run.state, 'failed')
  assert.equal(multiple.run.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
})

test('revision dispatch retains the exact same-repository PR and head branch', async () => {
  const calls = []
  const revisionJob = {
    ...job,
    target: { kind: 'pull-request', pullRequest },
  }
  const fetch = async (url, init = {}) => {
    calls.push({ url, init })
    if (url.endsWith('/pulls/77')) {
      return json({
        state: 'open',
        merged_at: null,
        base: { ref: 'main', repo: { full_name: 'astrale-os/ui' } },
        head: { ref: 'agent/existing', repo: { full_name: 'astrale-os/ui' } },
      })
    }
    return json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` })
  }
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch,
    now: () => fixedNow,
  })

  const result = await agent.dispatch(revisionJob, { idempotencyKey: 'revision-attempt' })

  assert.equal(result.kind, 'accepted')
  assert.equal(result.run.branch, 'agent/existing')
  assert.equal(result.run.pullRequest, pullRequest)
  const dispatch = calls.find(({ url }) => url.endsWith('/dispatches'))
  assert.deepEqual(JSON.parse(dispatch.init.body).inputs, {
    attempt: 'revision-attempt',
    request: `${repository}/issues/123`,
    base_ref: 'main',
    branch: 'agent/existing',
    objective: [
      `Astrale UI request: ${repository}/issues/123`,
      'Astrale attempt: revision-attempt',
      '',
      job.objective,
    ].join('\n'),
    pull_request: pullRequest,
  })
})

test('revision rejects a fork head before workflow dispatch', async () => {
  let calls = 0
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () => {
      calls += 1
      return json({
        state: 'open',
        merged_at: null,
        base: { ref: 'main', repo: { full_name: 'astrale-os/ui' } },
        head: { ref: 'contribution', repo: { full_name: 'someone/ui' } },
      })
    },
  })

  const result = await agent.dispatch(
    { ...job, target: { kind: 'pull-request', pullRequest } },
    { idempotencyKey: 'revision-attempt' },
  )

  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
  assert.equal(calls, 1)
})

for (const [condition, state, mergedAt] of [
  ['closed', 'closed', null],
  ['merged', 'open', fixedNow],
]) {
  test(`revision rejects a ${condition} PR before workflow dispatch`, async () => {
    let calls = 0
    const agent = createGitHubActionsClaudeCodeAgent({
      token: 'token',
      fetch: async () => {
        calls += 1
        return json({
          state,
          merged_at: mergedAt,
          base: { ref: 'main', repo: { full_name: 'astrale-os/ui' } },
          head: { ref: 'agent/existing', repo: { full_name: 'astrale-os/ui' } },
        })
      },
    })

    const result = await agent.dispatch(
      { ...job, target: { kind: 'pull-request', pullRequest } },
      { idempotencyKey: 'revision-attempt' },
    )

    assert.equal(result.kind, 'failed')
    assert.equal(result.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
    assert.equal(calls, 1)
  })
}

test('reconciliation matches display_title exactly and never dispatches', async () => {
  const methods = []
  const fetch = async (url, init = {}) => {
    methods.push(init.method ?? 'GET')
    if (url.includes('/actions/workflows/') && url.includes('/runs?')) {
      return json({
        workflow_runs: [
          workflowRun({
            id: 770,
            name: attemptMarker('attempt'),
            display_title: attemptMarker('another-attempt'),
          }),
          workflowRun({ display_title: attemptMarker('attempt') }),
        ],
      })
    }
    if (url.endsWith(`/actions/runs/${runId}`)) return json(workflowRun())
    if (url.includes('/pulls?')) return json([])
    throw new Error(`Unexpected request: ${url}`)
  }
  const agent = createGitHubActionsClaudeCodeAgent({ token: 'token', fetch })

  const result = await agent.reconcile(job, { idempotencyKey: 'attempt' })

  assert.equal(result.kind, 'found')
  assert.equal(result.run.state, 'queued')
  assert.deepEqual(new Set(methods), new Set(['GET']))
})

test('reconciliation ignores matching titles from another actor or workflow ref', async () => {
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async (url, init = {}) => {
      assert.equal(init.method ?? 'GET', 'GET')
      assert.match(url, /\/actions\/workflows\/ui-request-claude-code\.yml\/runs\?/u)
      return json({
        workflow_runs: [
          workflowRun({ actor: { login: 'maintainer' } }),
          workflowRun({ triggering_actor: { login: 'maintainer' } }),
          workflowRun({ path: '.github/workflows/another-workflow.yml' }),
          workflowRun({ head_branch: 'other' }),
        ],
      })
    },
  })

  const result = await agent.reconcile(job, { idempotencyKey: 'attempt' })

  assert.deepEqual(result, { kind: 'absent' })
})

test('reconciliation rejects duplicate exact runs as ambiguous', async () => {
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () =>
      json({
        workflow_runs: [workflowRun({ id: 770 }), workflowRun({ id: 771 })],
      }),
  })

  const result = await agent.reconcile(job, { idempotencyKey: 'attempt' })

  assert.deepEqual(result, { kind: 'ambiguous' })
})

test('reconciliation exhaustion remains unsafe instead of claiming absence', async () => {
  let pages = 0
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () => {
      pages += 1
      return json({
        workflow_runs: Array.from({ length: 100 }, (_, index) =>
          workflowRun({
            id: pages * 1000 + index,
            display_title: attemptMarker(`other-${pages}-${index}`),
          }),
        ),
      })
    },
  })

  const result = await agent.reconcile(job, { idempotencyKey: 'attempt' })

  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_OUTCOME_UNKNOWN')
  assert.equal(result.failure.retry, 'unsafe')
  assert.equal(pages, 5)
})

test('a GitHub rerun cannot resume a persisted run reference', async () => {
  const dispatched = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    now: () => fixedNow,
    fetch: async () =>
      json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` }),
  })
  const initial = await dispatched.dispatch(job, { idempotencyKey: 'attempt' })
  assert.equal(initial.kind, 'accepted')
  let calls = 0
  const restarted = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () => {
      calls += 1
      return json(workflowRun({ run_attempt: 2, status: 'in_progress' }))
    },
  })

  const result = await restarted.observe(initial.run.ref)

  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
  assert.equal(calls, 1)
})

for (const fixture of [
  { status: 'queued', state: 'queued' },
  { status: 'pending', state: 'queued' },
  { status: 'requested', state: 'queued' },
  { status: 'in_progress', state: 'running' },
  { status: 'waiting', state: 'waiting-for-approval' },
  { status: 'completed', conclusion: 'cancelled', state: 'cancelled' },
  {
    status: 'completed',
    conclusion: 'timed_out',
    state: 'expired',
    code: 'AGENT_UNAVAILABLE',
    retry: 'safe',
  },
  {
    status: 'completed',
    conclusion: 'action_required',
    state: 'failed',
    code: 'AGENT_PERMISSION_DENIED',
    retry: 'after-change',
  },
  ...['failure', 'startup_failure', 'stale', 'neutral', 'skipped'].map((conclusion) => ({
    status: 'completed',
    conclusion,
    state: 'failed',
    code: 'AGENT_UNAVAILABLE',
    retry: 'safe',
  })),
]) {
  test(`maps GitHub ${fixture.status}/${fixture.conclusion ?? '-'} exactly`, async () => {
    const dispatched = createGitHubActionsClaudeCodeAgent({
      token: 'token',
      now: () => fixedNow,
      fetch: async () =>
        json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` }),
    })
    const initial = await dispatched.dispatch(job, { idempotencyKey: 'attempt' })
    assert.equal(initial.kind, 'accepted')
    const agent = createGitHubActionsClaudeCodeAgent({
      token: 'token',
      fetch: async (url) => {
        if (url.endsWith(`/actions/runs/${runId}`)) return json(workflowRun(fixture))
        if (url.includes('/pulls?')) return json([])
        throw new Error(`Unexpected request: ${url}`)
      },
    })

    const result = await agent.observe(initial.run.ref)

    assert.equal(result.kind, 'observed')
    assert.equal(result.run.state, fixture.state)
    if (fixture.code) {
      assert.equal(result.run.failure.code, fixture.code)
      assert.equal(result.run.failure.retry, fixture.retry)
    } else {
      assert.equal('failure' in result.run, false)
    }
  })
}

for (const [status, conclusion] of [
  ['mystery', null],
  ['completed', 'mystery'],
]) {
  test(`rejects unknown GitHub lifecycle ${status}/${conclusion ?? '-'}`, async () => {
    const dispatched = createGitHubActionsClaudeCodeAgent({
      token: 'token',
      now: () => fixedNow,
      fetch: async () =>
        json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` }),
    })
    const initial = await dispatched.dispatch(job, { idempotencyKey: 'attempt' })
    assert.equal(initial.kind, 'accepted')
    const agent = createGitHubActionsClaudeCodeAgent({
      token: 'token',
      fetch: async (url) => {
        if (url.endsWith(`/actions/runs/${runId}`)) {
          return json(workflowRun({ status, conclusion }))
        }
        if (url.includes('/pulls?')) return json([])
        throw new Error(`Unexpected request: ${url}`)
      },
    })

    const result = await agent.observe(initial.run.ref)

    assert.equal(result.kind, 'failed')
    assert.equal(result.failure.code, 'AGENT_PROTOCOL_INCOMPATIBLE')
  })
}

test('retains an existing PR when the workflow fails after publication', async () => {
  const dispatched = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    now: () => fixedNow,
    fetch: async () =>
      json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` }),
  })
  const initial = await dispatched.dispatch(job, { idempotencyKey: 'attempt' })
  assert.equal(initial.kind, 'accepted')
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async (url) => {
      if (url.endsWith(`/actions/runs/${runId}`)) {
        return json(workflowRun({ status: 'completed', conclusion: 'failure' }))
      }
      if (url.includes('/pulls?')) return json([pull()])
      throw new Error(`Unexpected request: ${url}`)
    },
  })

  const result = await agent.observe(initial.run.ref)

  assert.equal(result.kind, 'observed')
  assert.equal(result.run.state, 'failed')
  assert.equal(result.run.pullRequest, pullRequest)
  assert.equal(result.run.failure.code, 'AGENT_UNAVAILABLE')
})

test('cancellation stays requested until later observation confirms cancellation', async () => {
  let cancelRequests = 0
  let confirmed = false
  const fetch = async (url, init = {}) => {
    if (url.endsWith('/dispatches')) {
      return json({ workflow_run_id: runId, html_url: `${repository}/actions/runs/${runId}` })
    }
    if (url.endsWith(`/actions/runs/${runId}/cancel`)) {
      assert.equal(init.method, 'POST')
      cancelRequests += 1
      return new Response(null, { status: 202 })
    }
    if (url.endsWith(`/actions/runs/${runId}`)) {
      return json(
        workflowRun(
          confirmed ? { status: 'completed', conclusion: 'cancelled' } : { status: 'in_progress' },
        ),
      )
    }
    if (url.includes('/pulls?')) return json([])
    throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`)
  }
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch,
    now: () => fixedNow,
  })
  const accepted = await agent.dispatch(job, { idempotencyKey: 'attempt' })
  assert.equal(accepted.kind, 'accepted')

  const result = await agent.cancel(accepted.run.ref)

  assert.equal(result.kind, 'requested')
  assert.equal(result.run.state, 'running')
  assert.equal(cancelRequests, 1)

  confirmed = true
  const observed = await agent.observe(accepted.run.ref)
  assert.equal(observed.kind, 'observed')
  assert.equal(observed.run.state, 'cancelled')
})

test('workflow-specific bounds reject an otherwise admitted oversized job before dispatch', async () => {
  let calls = 0
  const agent = createGitHubActionsClaudeCodeAgent({
    token: 'token',
    fetch: async () => {
      calls += 1
      return json({})
    },
  })

  const result = await agent.dispatch(
    { ...job, objective: 'x'.repeat(64 * 1024 - 1) },
    { idempotencyKey: 'attempt' },
  )

  assert.equal(result.kind, 'failed')
  assert.equal(result.failure.code, 'AGENT_INVALID_JOB')
  assert.equal(calls, 0)
})
