# Managed provider census

Current documentation was inspected on 2026-08-28. This is investigation evidence, not a permanent
provider allowlist. A provider enters production only through a concrete adapter and live
qualification against the same contract suite.

## Direct managed coding APIs

| Provider surface | Maturity | Start/observe | Revision/control | PR outcome | V1 disposition |
| --- | --- | --- | --- | --- | --- |
| GitHub Copilot agent tasks | Public preview; task start requires Copilot Business/Enterprise and a user-to-server token | REST start/get/list with queued, in-progress, waiting, terminal states | Existing `head_ref`, model and custom-agent selection; no documented task cancel/follow-up endpoint | Optional automatic PR and PR artifact | Strong GitHub-native candidate |
| Google Jules REST API | `v1alpha`, explicitly experimental | Session create/get/list plus immutable activities | Send message, approve plan, delete session | `AUTO_CREATE_PR` and PR output | Strong semantic contrast; alpha risk |
| Cursor Cloud Agents API V1 | Public beta | Durable agent plus runs; get/list; SSE | Follow-up runs, cancellation, artifacts, MCP, hosted/self-hosted environments | Automatic PR or existing PR target | Richest direct API; ensure restrictions do not leak upstream |
| Devin V3 API | Current organization/enterprise API | Session create/get/list with status and status detail | Messages, service-user permissions, structured output, budgets/playbooks | PR list on session | Mature-looking direct candidate; access/cost qualification pending |

Authoritative references:

- GitHub agent tasks: <https://docs.github.com/en/rest/agent-tasks/agent-tasks>
- Jules API: <https://jules.google/docs/api/reference/>
- Jules sessions: <https://jules.google/docs/api/reference/sessions>
- Cursor Cloud Agents API: <https://cursor.com/docs/cloud-agent/api/endpoints>
- Devin V3 sessions: <https://docs.devin.ai/api-reference/v3/sessions/post-organizations-sessions>

## Mediated or non-conforming surfaces

### GitHub partner coding agents

GitHub can assign issues or PR comments to OpenAI Codex and Anthropic Claude partner agents. That is
an excellent manual/operational path, but GitHub's documented agent-tasks REST API currently owns
Copilot cloud-agent tasks. Partner assignment does not yet establish the same portable task ID,
polling, cancellation, and artifact contract. A future `github-assignment` adapter may project
issue/PR state, but it is not assumed equivalent.

Reference: <https://docs.github.com/en/copilot/concepts/agents/about-third-party-coding-agents>

### OpenAI Codex SDK and Codex Cloud

The Codex SDK programmatically controls local Codex threads. It can support a self-hosted adapter,
but it does not itself supply the managed repository sandbox/PR control plane this module seeks.
Codex Cloud is managed and GitHub-integrated, but current official OpenAI documentation does not
publish an equivalent coding-task REST API for starting, observing, cancelling, and retrieving PR
outcomes.

Official OpenAI documentation: <https://developers.openai.com/codex/sdk> and
<https://developers.openai.com/codex/cloud>

### OpenAI Workspace Agents API

Workspace Agents can be triggered and their beta run status polled, but the agent response cannot
currently be retrieved through the API. It also does not inherently guarantee a repository/PR work
product. It therefore cannot conform to V1 without a separately proven remote GitHub tool and
outcome channel.

Official OpenAI documentation: <https://learn.chatgpt.com/workspace-agents/trigger-runs>

### GitHub Actions wrappers

Claude Code, Codex, Cursor, or another CLI can be run inside Actions, but that makes Astrale own
execution, credentials, sandboxing, lifecycle, and publishing. Such wrappers are self-hosted
adapters, not managed-provider APIs.

This route is now the selected first production adapter because the available direct-provider
accounts could not create work. GitHub hosts and exposes the workflow run, Claude Code supplies the
agent harness, and Microsoft Foundry supplies the model. GitHub API `2026-03-10` returns the exact
workflow-run id from dispatch, avoiding start-time list/poll correlation. The immutable Claude Code
base action is used instead of the full GitHub integration so the model step never receives the
later PR-publishing credential.

Authoritative references:

- GitHub workflow dispatch: <https://docs.github.com/en/rest/actions/workflows>
- GitHub workflow runs: <https://docs.github.com/en/rest/actions/workflow-runs>
- Microsoft Foundry Claude Code configuration:
  <https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/configure-claude-code>
- Claude Code base action:
  <https://github.com/anthropics/claude-code-action/tree/main/base-action>

## What the provider matrix proves

The real common denominator is repository dispatch, observation, and PR delivery. It does not prove
that chats, cancellation, events, models, approvals, environments, or secrets can be normalized
without semantic loss. The candidate API follows that evidence.
