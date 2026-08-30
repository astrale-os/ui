import {
  attemptMarker,
  createGitHubActionsWorkerAgent,
  deterministicBranch,
} from './github-actions-claude-code.mjs'

export { attemptMarker, deterministicBranch }

export function createGitHubActionsCodexAgent(options) {
  return createGitHubActionsWorkerAgent({
    ...options,
    provider: 'github-actions-codex',
    workflowFile: 'ui-request-codex.yml',
    workerName: 'Codex',
  })
}
