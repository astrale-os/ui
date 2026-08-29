import assert from 'node:assert/strict'
import test from 'node:test'

import { encodeRunIdentity } from './agent/src/model.mjs'
import { json } from './agent/test-helpers.mjs'
import { runUiRequestAutomation } from './run.mjs'
import { renderRecordComment } from './src/record.mjs'

const repository = 'https://github.com/astrale-os/ui'
const issue = {
  number: 123,
  title: 'Async combobox',
  body: 'Need an accessible async combobox with creation.',
  html_url: `${repository}/issues/123`,
  state: 'open',
}
const fixedNow = '2026-08-29T00:00:00Z'

function githubStoreResponse(url, init) {
  if (url.endsWith('/issues/123') && (init.method ?? 'GET') === 'GET') return json(issue)
  if (url.includes('/issues/123/comments?')) return json([])
  if (url.endsWith('/issues/123/comments') && init.method === 'POST') return json({ id: 91 })
  if (url.endsWith('/issues/comments/91') && init.method === 'PATCH') return json({})
  return null
}

for (const provider of ['github-copilot', 'cursor', 'github-actions-claude-code']) {
  test(`production runner composes ${provider} through the real store and dispatcher`, async () => {
    let output = ''
    let agentRequest
    const calls = []
    const fetch = async (url, init = {}) => {
      calls.push({ url, authorization: init.headers?.Authorization })
      const store = githubStoreResponse(url, init)
      if (store) return store
      agentRequest = { url, method: init.method, body: JSON.parse(init.body) }
      if (provider === 'github-actions-claude-code') {
        return json({
          workflow_run_id: 771,
          run_url: 'https://api.github.com/repos/astrale-os/ui/actions/runs/771',
          html_url: 'https://github.com/astrale-os/ui/actions/runs/771',
        })
      }
      if (provider === 'github-copilot') {
        return json(
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            html_url: 'https://github.com/astrale-os/ui/copilot/tasks/a1b2',
            state: 'queued',
            artifacts: [],
            sessions: [{ head_ref: 'copilot/request-123', base_ref: 'main' }],
            created_at: fixedNow,
            updated_at: fixedNow,
          },
          201,
        )
      }
      return json({
        agent: { id: agentRequest.body.agentId },
        run: {
          id: 'run-00000000-0000-0000-0000-000000000001',
          agentId: agentRequest.body.agentId,
          status: 'CREATING',
          createdAt: fixedNow,
          updatedAt: fixedNow,
        },
      })
    }
    const environment = {
      GITHUB_REPOSITORY: 'astrale-os/ui',
      GITHUB_TOKEN: 'github-store-token',
      UI_REQUEST_AGENT_PROVIDER: provider,
      ...(provider === 'github-copilot'
        ? { COPILOT_AGENT_TOKEN: 'copilot-token' }
        : provider === 'cursor'
          ? { CURSOR_API_KEY: 'cursor-key' }
          : {}),
    }
    const execution = await runUiRequestAutomation({
      argv: ['--issue', '123', '--max-wait-ms', '0'],
      environment,
      fetch,
      now: () => fixedNow,
      write: (value) => {
        output += value
      },
    })

    assert.equal(execution.exitCode, 0)
    assert.equal(execution.result.kind, 'updated')
    assert.equal(execution.result.record.provider, provider)
    assert.deepEqual(JSON.parse(output), execution.result)
    assert.equal(agentRequest.method, 'POST')
    assert.match(
      agentRequest.body.inputs?.objective ??
        agentRequest.body.prompt?.text ??
        agentRequest.body.prompt,
      /Async combobox/u,
    )
    assert.doesNotMatch(output, /github-store-token|copilot-token|cursor-key/u)
    for (const call of calls) {
      const expected = call.url.startsWith('https://api.cursor.com/')
        ? `Basic ${Buffer.from('cursor-key:', 'utf8').toString('base64')}`
        : call.url.includes('/agents/repos/')
          ? 'Bearer copilot-token'
          : 'Bearer github-store-token'
      assert.equal(call.authorization, expected)
      assert.doesNotMatch(
        call.authorization,
        provider === 'github-copilot' ? /cursor-key/u : /copilot-token/u,
      )
    }
  })
}

test('production runner returns one failed result and nonzero status for provider rejection', async () => {
  let output = ''
  const fetch = async (url, init = {}) => {
    const store = githubStoreResponse(url, init)
    if (store) return store
    return json({ message: 'precondition failed' }, 412)
  }
  const execution = await runUiRequestAutomation({
    argv: ['--issue', '123', '--max-wait-ms', '0'],
    environment: {
      GITHUB_REPOSITORY: 'astrale-os/ui',
      GITHUB_TOKEN: 'github-store-token',
      COPILOT_AGENT_TOKEN: 'copilot-token',
      UI_REQUEST_AGENT_PROVIDER: 'github-copilot',
    },
    fetch,
    now: () => fixedNow,
    write: (value) => {
      output += value
    },
  })

  assert.equal(execution.exitCode, 1)
  assert.equal(execution.result.kind, 'failed')
  assert.equal(execution.result.failure.code, 'AGENT_PERMISSION_DENIED')
  assert.deepEqual(JSON.parse(output), execution.result)
})

test('production runner rejects unsupported provider configuration before any fetch', async () => {
  let requests = 0
  await assert.rejects(
    runUiRequestAutomation({
      argv: ['--issue', '123', '--max-wait-ms', '0'],
      environment: {
        GITHUB_REPOSITORY: 'astrale-os/ui',
        GITHUB_TOKEN: 'github-store-token',
        UI_REQUEST_AGENT_PROVIDER: 'unknown-provider',
      },
      fetch: async () => {
        requests += 1
        return json({})
      },
      write: () => {},
    }),
    /Unsupported configured managed-agent provider/u,
  )
  assert.equal(requests, 0)
})

test('production runner forwards cancellation without dispatching another writer', async () => {
  const record = {
    version: 1,
    request: `${repository}/issues/123`,
    issue: 123,
    attempt: 1,
    operation: 'initial',
    idempotencyKey: 'ui-request:123:attempt:1',
    objectiveSha256: 'a'.repeat(64),
    provider: 'github-copilot',
    state: 'running',
    run: {
      provider: 'github-copilot',
      id: encodeRunIdentity({ owner: 'astrale-os', repo: 'ui', task: 'existing-task' }),
    },
    updatedAt: fixedNow,
  }
  const requests = []
  const fetch = async (url, init = {}) => {
    requests.push({ url, method: init.method ?? 'GET' })
    if (url.endsWith('/issues/123')) return json(issue)
    if (url.includes('/issues/123/comments?')) {
      return json([
        {
          id: 91,
          user: { login: 'github-actions[bot]' },
          body: renderRecordComment(record),
        },
      ])
    }
    if (url.endsWith('/tasks/existing-task')) {
      return json({
        id: 'existing-task',
        html_url: 'https://github.com/astrale-os/ui/copilot/tasks/existing-task',
        state: 'in_progress',
        artifacts: [],
        sessions: [{ head_ref: 'copilot/request-123', base_ref: 'main' }],
        created_at: fixedNow,
        updated_at: fixedNow,
      })
    }
    if (url.endsWith('/issues/comments/91') && init.method === 'PATCH') return json({})
    throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`)
  }

  const execution = await runUiRequestAutomation({
    argv: ['--issue', '123', '--operation', 'cancel', '--max-wait-ms', '0'],
    environment: {
      GITHUB_REPOSITORY: 'astrale-os/ui',
      GITHUB_TOKEN: 'github-store-token',
      COPILOT_AGENT_TOKEN: 'copilot-token',
      UI_REQUEST_AGENT_PROVIDER: 'github-copilot',
    },
    fetch,
    now: () => fixedNow,
    write: () => {},
  })

  assert.equal(execution.exitCode, 0)
  assert.equal(execution.result.kind, 'unchanged')
  assert.equal(execution.result.record.state, 'running')
  assert.equal(
    requests.some(
      ({ url, method }) => url.endsWith('/agents/repos/astrale-os/ui/tasks') && method === 'POST',
    ),
    false,
  )
})
