import type { IntegrationExecution, ProviderImplementation } from '@astrale-os/sdk/integration'

import { defineProvider } from '@astrale-os/sdk/integration'

import { requestSubmission } from '#integrations/request-submission'

import { GitHubRequestClient } from './request-client.js'

export interface GitHubRequestSubmissionConfiguration {
  readonly token: string
  readonly owner: string
  readonly repository: string
  readonly actor: string
  readonly fetcher?: typeof fetch
  readonly apiBase?: string
  readonly timeoutMs?: number
}

export interface AdmittedGitHubRequestSubmissionConfiguration {
  readonly token: string
  readonly owner: string
  readonly repository: string
  readonly actor: string
  readonly fetcher: typeof fetch
  readonly apiBase: string
  readonly timeoutMs: number
}

export function createGitHubRequestSubmissionProvider(
  configuration: GitHubRequestSubmissionConfiguration,
) {
  const admitted = admitConfiguration(configuration)
  const operations: ProviderImplementation<typeof requestSubmission> = {
    submit: (input, execution) => client(admitted, execution).submit(input),
    reconcile: (input, execution) => client(admitted, execution).reconcile(input),
  }
  return defineProvider(requestSubmission, operations)
}

function client(
  configuration: AdmittedGitHubRequestSubmissionConfiguration,
  execution: IntegrationExecution,
): GitHubRequestClient {
  return new GitHubRequestClient(configuration, execution)
}

function admitConfiguration(
  configuration: GitHubRequestSubmissionConfiguration,
): AdmittedGitHubRequestSubmissionConfiguration {
  stable(configuration.token, 'token')
  stable(configuration.owner, 'owner')
  stable(configuration.repository, 'repository')
  stable(configuration.actor, 'actor')
  const apiBase = (configuration.apiBase ?? 'https://api.github.com').replace(/\/+$/u, '')
  if (configuration.fetcher === undefined && apiBase !== 'https://api.github.com') {
    throw new TypeError('GitHub apiBase is fixed when the global fetch implementation is used.')
  }
  const timeoutMs = configuration.timeoutMs ?? 30_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('GitHub timeoutMs must be a positive safe integer.')
  }
  return Object.freeze({
    token: configuration.token,
    owner: configuration.owner,
    repository: configuration.repository,
    actor: configuration.actor,
    fetcher: configuration.fetcher ?? fetch.bind(globalThis),
    apiBase,
    timeoutMs,
  })
}

function stable(value: string, name: string): void {
  if (value.length === 0 || value.trim() !== value) {
    throw new TypeError(`GitHub ${name} must be non-empty stable text.`)
  }
}
