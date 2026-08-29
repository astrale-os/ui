import type { GitHubRequestSubmissionConfiguration } from './provider.js'

export interface GitHubRequestSubmissionEnvironment {
  readonly GITHUB_TOKEN?: string
  readonly GITHUB_OWNER?: string
  readonly GITHUB_REPOSITORY?: string
  readonly GITHUB_ACTOR?: string
}

export function githubRequestSubmissionConfigurationFromEnvironment(
  environment: GitHubRequestSubmissionEnvironment,
): GitHubRequestSubmissionConfiguration {
  return Object.freeze({
    token: required(environment.GITHUB_TOKEN, 'GITHUB_TOKEN'),
    owner: required(environment.GITHUB_OWNER, 'GITHUB_OWNER'),
    repository: required(environment.GITHUB_REPOSITORY, 'GITHUB_REPOSITORY'),
    actor: required(environment.GITHUB_ACTOR, 'GITHUB_ACTOR'),
  })
}

function required(value: string | undefined, name: string): string {
  if (value === undefined || value.length === 0 || value.trim() !== value) {
    throw new TypeError(`${name} must be non-empty stable text.`)
  }
  return value
}
