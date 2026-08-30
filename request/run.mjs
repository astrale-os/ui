#!/usr/bin/env node

import { pathToFileURL } from 'node:url'

import { createCursorAgent } from './agent/adapters/cursor.mjs'
import { createGitHubActionsClaudeCodeAgent } from './agent/adapters/github-actions-claude-code.mjs'
import { createGitHubActionsCodexAgent } from './agent/adapters/github-actions-codex.mjs'
import { createGitHubCopilotAgent } from './agent/adapters/github-copilot.mjs'
import { createUiRequestDispatcher } from './src/dispatcher.mjs'
import { createGitHubRequestStore } from './src/github.mjs'

function argument(argv, name, fallback) {
  const indexes = argv.flatMap((value, index) => (value === name ? [index] : []))
  if (indexes.length > 1) throw new Error(`${name} may be provided only once`)
  if (indexes.length === 0) return fallback
  const value = argv[indexes[0] + 1]
  if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function canonicalInteger(value, name, { allowZero = false } = {}) {
  const pattern = allowZero ? /^(?:0|[1-9][0-9]*)$/u : /^[1-9][0-9]*$/u
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(
      `${name} must be a canonical ${allowZero ? 'non-negative' : 'positive'} integer`,
    )
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) throw new Error(`${name} exceeds the safe integer range`)
  return parsed
}

export function parseRunnerArguments(argv) {
  const admitted = new Set(['--issue', '--operation', '--max-wait-ms', '--pull-request'])
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]
    if (!admitted.has(name)) throw new Error(`Unknown UI request runner argument: ${name}`)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value`)
  }
  const issue = canonicalInteger(argument(argv, '--issue'), '--issue')
  const operation = argument(argv, '--operation', 'run')
  if (!['auto', 'run', 'reconcile', 'revise', 'cancel'].includes(operation)) {
    throw new Error('--operation must be auto, run, reconcile, revise, or cancel')
  }
  const maximumWait = canonicalInteger(
    argument(argv, '--max-wait-ms', String(90 * 60 * 1000)),
    '--max-wait-ms',
    { allowZero: true },
  )
  const pullRequest = argument(argv, '--pull-request')
  if (pullRequest !== undefined) canonicalInteger(pullRequest, '--pull-request')
  return { issue, operation, maximumWait, ...(pullRequest ? { pullRequest } : {}) }
}

function requiredEnvironment(environment, name) {
  const value = environment[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function composition(provider, environment, fetchImplementation) {
  if (provider === 'github-actions-codex') {
    return createGitHubActionsCodexAgent({
      token: requiredEnvironment(environment, 'GITHUB_TOKEN'),
      fetch: fetchImplementation,
      workflowRef: environment.UI_REQUEST_AGENT_WORKFLOW_REF ?? 'main',
    })
  }
  if (provider === 'github-actions-claude-code') {
    return createGitHubActionsClaudeCodeAgent({
      token: requiredEnvironment(environment, 'GITHUB_TOKEN'),
      fetch: fetchImplementation,
      workflowRef: environment.UI_REQUEST_AGENT_WORKFLOW_REF ?? 'main',
    })
  }
  if (provider === 'github-copilot') {
    return createGitHubCopilotAgent({
      token: requiredEnvironment(environment, 'COPILOT_AGENT_TOKEN'),
      fetch: fetchImplementation,
    })
  }
  if (provider === 'cursor') {
    return createCursorAgent({
      token: requiredEnvironment(environment, 'CURSOR_API_KEY'),
      fetch: fetchImplementation,
    })
  }
  throw new Error(`Unsupported configured managed-agent provider: ${provider}`)
}

export async function runUiRequestAutomation(options = {}) {
  const environment = options.environment ?? process.env
  const argv = options.argv ?? process.argv.slice(2)
  const fetchImplementation = options.fetch ?? globalThis.fetch
  const repository = (environment.GITHUB_REPOSITORY ?? 'astrale-os/ui').split('/')
  if (repository.length !== 2 || repository.some((part) => !part)) {
    throw new Error('GITHUB_REPOSITORY must be owner/repository')
  }
  const { issue, operation, maximumWait, pullRequest } = parseRunnerArguments(argv)
  const provider = environment.UI_REQUEST_AGENT_PROVIDER ?? 'github-actions-codex'
  const store = createGitHubRequestStore({
    token: requiredEnvironment(environment, 'GITHUB_TOKEN'),
    owner: repository[0],
    repo: repository[1],
    recordActor: environment.UI_REQUEST_RECORD_ACTOR ?? 'github-actions[bot]',
    fetch: fetchImplementation,
  })
  const dispatcher = createUiRequestDispatcher({
    store,
    agent: composition(provider, environment, fetchImplementation),
    ...(options.now ? { now: options.now } : {}),
    ...(options.sleep ? { sleep: options.sleep } : {}),
  })
  const expectedPullRequest = pullRequest
    ? `https://github.com/${repository.join('/')}/pull/${pullRequest}`
    : undefined
  const result = await dispatcher.execute(issue, operation, {
    maxWaitMs: maximumWait,
    ...(expectedPullRequest ? { pullRequest: expectedPullRequest } : {}),
  })
  const output = `${JSON.stringify(result, null, 2)}\n`
  ;(options.write ?? ((value) => process.stdout.write(value)))(output)
  return { result, exitCode: result.kind === 'failed' ? 1 : 0 }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runUiRequestAutomation()
    .then(({ exitCode }) => {
      process.exitCode = exitCode
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : 'UI request automation failed'}\n`,
      )
      process.exitCode = 1
    })
}
