# Managed agent adapter

`request/agent/` is the provider-neutral boundary between the Astrale UI request pipeline and
managed coding agents.

It normalizes one narrow journey:

```text
dispatch repository work -> observe one run -> receive one pull request outcome
```

It does not abstract models, prompts, chats, MCP, sandboxes, GitHub, source research, CI, previews,
merge, or release. Those concepts remain with their existing owners or provider configuration.

The durable contract lives in [`.spec`](./.spec/architecture.md). Thin native-fetch adapters exist
for GitHub Copilot agent tasks, Cursor Cloud Agents, and GitHub Actions workers running Codex or
Claude Code on Microsoft Foundry. All four pass the same deterministic restart, admission, one-PR,
cancellation, and reconciliation contract; provider-specific state/failure matrices are qualified
separately.

The Azure deployment, Claude Code Foundry transport, and complete Actions-worker-to-PR journey have
been exercised live from the default branch through one disposable request and ordinary PR CI.
GitHub Copilot task creation remains unqualified because the configured account/repository returned
HTTP 412, and no Cursor credential is configured.

Provider models, chats, sessions, tools, MCP, environments, secrets, streams, cost units, and raw
payloads remain private. The only operations are dispatch, observe, reconcile an uncertain start,
and cancellation with an explicit guarantee. Calls are independently time-bounded and local abort
never claims remote cancellation.

## Qualified adapters

- `github-copilot` pins GitHub API `2026-03-10`, requires a user-to-server or fine-grained token
  with repository `Agent tasks` read/write permission, polls task details, scans at most five
  100-item reconciliation pages, and reports cancellation as unsupported unless the task is already
  terminal.
- `cursor` targets Cloud Agents API V1 with Basic API-key authentication, derives one deterministic
  `bc-<uuid>` agent identity per attempt, validates the exact repository or PR target, and confirms
  or retains requested cancellation by observing the run.
- `github-actions-claude-code` pins GitHub API `2026-03-10` and the exact Claude Code CLI package.
  GitHub returns the exact workflow-run id at dispatch; read-only reconciliation uses the exact
  attempt `display_title`. The worker runs Claude Code on Azure Foundry without a GitHub write
  credential, transports only a bounded inert patch into a clean qualification job, and applies the
  qualified patch again in a fresh publisher job. The publishing token never shares a job or
  mutable workspace with agent or candidate execution.
- `github-actions-codex` uses the same exact workflow-run admission and publisher separation while
  pinning Codex `0.151.0`, GPT-5.6 Luna, maximum reasoning effort, the Azure Responses transport,
  workspace-write sandboxing, and a network-disabled implementation shell. GitHub and Azure
  credentials are excluded from model-spawned shell commands. A digest-bound cumulative checkpoint
  preserves partial work for 30 days, and one eligible failure may continue through the Claude Code
  worker without changing the provider-neutral Port.

Every provider/store HTTP operation has a 60-second default timeout, response bodies are limited to
1 MiB, normalized messages to 2 KiB UTF-8, opaque identities to 2 KiB, and provider URLs to 4 KiB.
The workflow environment `ui-request-agent` owns credentials; public input never does.
