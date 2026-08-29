# Deployment and evolution options

The neutral contract permits several execution topologies without making them equivalent or
putting their controls into the public request API.

## Option A — direct managed coding API

Astrale calls a provider that owns the coding sandbox and can return a repository PR.

```text
request dispatcher -> thin provider adapter -> managed coding API -> PR
```

This is the recommended V1. It minimizes infrastructure ownership and matches GitHub Copilot agent
tasks, Jules, Cursor Cloud Agents, and Devin closely enough to test one common contract. The main
cost is provider API maturity, account prerequisites, and semantic translation.

## Option B — GitHub-mediated assignment

Astrale assigns an issue or PR to a partner coding agent and projects GitHub state as a run.

```text
request dispatcher -> GitHub assignment adapter -> partner agent -> PR
```

This has excellent user/review integration and may need fewer provider credentials, but it conforms
only if GitHub exposes enough stable identity, observation, result, and retry-safety evidence.
Partner assignment is not assumed to equal the Copilot agent-tasks API.

## Option C — managed sandbox plus agent CLI/SDK

Astrale rents an isolated execution environment and runs Codex, Claude Code, Cursor CLI, or another
agent itself.

```text
request dispatcher -> self-hosted adapter -> managed sandbox + agent process -> PR
```

This maximizes model/agent portability and control, but Astrale then owns workspace bootstrap,
process supervision, Git credentials, network policy, timeouts, retries, logs, resource cleanup,
prompt/tool safety, and PR creation. It is a valid future adapter class, not the simplest managed
agent choice.

## Option D — workflow runner

A GitHub Action or another CI runner executes the agent. This is operationally familiar and GitHub
native, but it has the same self-hosted responsibilities as Option C plus untrusted-workflow and
secret-boundary hazards. It is appropriate only if direct managed APIs cannot satisfy the contract.

**V1 disposition:** selected for the first production route after the available GitHub Copilot
account rejected task creation and no Cursor credential was available. GitHub owns the managed
runner and workflow lifecycle, Claude Code owns the coding harness, and Microsoft Foundry owns
inference. The adapter owns only workflow dispatch/observation/reconciliation and exact PR outcome.
The agent step has no GitHub publishing credential; a later fixed step owns checks, commit, push,
and PR creation.

## Option E — general agent/workflow platform

A hosted orchestration platform can own durable state, approvals, callbacks, tools, or multi-agent
graphs while Astrale supplies the repository worker. This helps only when the product needs those
journeys. It does not remove the need for a secure coding environment or PR-producing worker, and
would add a second control plane before V1 demonstrates that need.

## Routing possibilities

Routing is deliberately above the adapter contract:

| Policy | When useful | V1 disposition |
| --- | --- | --- |
| One configured provider per deployment | Lowest complexity and clearest operations | Recommended |
| Maintainer-selected provider for a new attempt | Qualification, outage response, deliberate comparison | Allowed trusted configuration; not request input |
| Ordered pre-accept fallback | Provider has provably rejected or never accepted dispatch | Future; only `retry: safe` |
| Account/capability/cost router | Large volume with measured provider differences | Deferred until stable comparable telemetry exists |
| Parallel bake-off | Provider evaluation | Disposable repositories or isolated branches only |
| Mid-run migration | Provider outage during work | Rejected; start a fresh run only after write authority ends |

The adapter seam makes provider replacement possible; it does not promise transparent live
migration. Source, issue, PR, evidence, and review state are portable. Provider memory, partial
workspace state, tokens, activities, cost units, and hidden reasoning are not.

## Recommended sequence

1. Complete one production journey through the selected Actions/Claude Code/Foundry adapter.
2. Retain GitHub Copilot and Cursor as independently conforming direct-API adapters.
3. Qualify another live adapter when credentials exist; it does not block the selected provider.
4. Keep static trusted selection until real outage, cost, or quality data justifies routing.
5. Add orchestration infrastructure only for a separately demonstrated durable workflow need.

This sequence preserves the option set while making V1 no larger than the current request journey.
