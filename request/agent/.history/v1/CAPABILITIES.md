# Capability model

The adapter intentionally exposes fewer operations than the providers. Portability comes from
normalizing the required outcome and preserving differences that affect orchestration—not from
pretending every feature is universal.

## Required V1 capabilities

| Capability | Contract | Why required |
| --- | --- | --- |
| Repository dispatch | Start from an exact GitHub repository/base or existing PR | First candidate and review revision |
| Durable opaque identity | Return a provider/run reference that survives process restart | Reconciliation without provider-specific state in callers |
| Poll observation | Retrieve normalized current state | Universal lowest common denominator |
| Pull-request delivery | `succeeded` returns exactly one PR | Review, CI, preview, and merge authority |
| Safe failure classification | Distinguish safe, after-change, and unsafe retry | Prevent duplicate write-capable runs |

An adapter missing any required capability is not a V1 provider, even if it is otherwise a capable
general agent.

## One exposed optional capability

Cancellation is the only optional capability exposed because it changes what the request owner may
safely do after abandoning a run. `descriptor.cancellation` is `none`, `best-effort`, or
`confirmed`; `cancel()` remains total and never overstates the provider guarantee.

Continuation, streaming, images, and plan approval may exist inside an adapter. They are not public
capabilities until a portable caller must make a decision from them. Polling remains authoritative,
GitHub retains image/request context, waiting states preserve approval/input pauses, and every
public review iteration remains a fresh run.

## Deliberately excluded from V1

- model identifiers, reasoning levels, token budgets, or provider prices;
- prompt/chat transcript formats;
- provider tool-call, thought, or activity event schemas;
- MCP server and tool configuration;
- environment images, setup scripts, snapshots, machines, or pools;
- secrets, environment variables, or deployment credentials;
- cost units and token accounting that are not comparable across providers;
- agent/subagent identities and orchestration;
- provider knowledge bases, playbooks, memories, or custom-agent definitions; and
- webhook payloads and signatures.

These belong to concrete adapter construction, operations, or future separately justified
capabilities. None may leak into `ManagedAgentJob` merely because one provider supports it.

## Product-level capabilities

- **AGENT-DISPATCH**: an accepted UI request can start one managed repository run.
- **AGENT-OBSERVE**: the request owner can recover and observe a run after process restart.
- **AGENT-PR-DELIVERY**: successful work arrives as one ordinary GitHub pull request.
- **AGENT-REPLACE**: another conforming provider can perform a later attempt or review iteration
  without changing the request/CLI/product contract.
- **AGENT-CANCEL-AWARE**: cancellation strength is observable and never overstated.

Streaming, same-session chat, provider planning, and automatic provider failover are not V1 product
capabilities.
