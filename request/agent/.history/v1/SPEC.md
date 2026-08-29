# Candidate specification

## Primary journey

The trusted request dispatcher receives one accepted GitHub request and one injected
[ManagedAgent](./api.d.ts). It dispatches a complete repository job, persists the returned opaque
run reference beside the GitHub request, and observes that run until it reaches a terminal or
human-waiting state.

```ts
const result = await agent.dispatch(job, {
  idempotencyKey: 'ui-request:123:attempt:1',
})
```

The adapter does not accept a provider, model, API key, environment, MCP server, tool list, or
arbitrary secret in `ManagedAgentJob`. Composition chooses and configures the adapter before the
request owner invokes it.

## One job, one run, one PR

A job is one complete attempt to produce or revise Astrale UI source. Its target is either:

- the UI repository and an exact base ref, for the first candidate; or
- an existing UI pull request, for review iteration or recovery.

Every review iteration is a fresh normalized run with a new idempotency key. An adapter may reuse a
provider conversation or workspace internally, but this must not affect observable behavior. The
complete request, repository/PR state, retained evidence, and review comments are the continuity
authority—not provider chat history.

A `succeeded` run has exactly one pull request. A provider that can only return prose, an
unpublished patch, or an inaccessible branch does not conform to V1. The agent PR remains an
untrusted proposal; success does not mean CI passed, design was accepted, or the request completed.

## Descriptor and capability boundary

`descriptor` is immutable adapter metadata. It identifies the adapter and states only the maximum
cancellation guarantee qualified for that implementation. Account readiness is checked by
operations, not by a discovery call that could fail outside the result model.

The core request flow relies only on:

- dispatch;
- polling observation; and
- pull-request delivery.

Same-session continuation, streaming, image input, and provider plan approval remain private
adapter optimizations until a portable caller journey requires them. Provider webhooks may wake the
reconciler, but the reconciler confirms truth by calling `observe()`.

## Dispatch and idempotency

`idempotencyKey` identifies one exact request attempt. Reusing it with different input is invalid.
The adapter returns `deduplicated: true` only when it can prove the returned run is the previously
accepted outcome for that key.

The request owner reserves the key durably before network dispatch. When the provider supports
native idempotency or an exact external identifier, the adapter uses it. Otherwise:

- a definitely pre-accept transport failure is `AGENT_UNAVAILABLE` with `retry: safe`;
- a provider rejection is classified by its semantic owner;
- a timeout/disconnect after acceptance may have occurred is `AGENT_OUTCOME_UNKNOWN` with
  `retry: unsafe`.

An unknown outcome is never automatically retried and never fails over to another provider. The
request enters operator reconciliation because a retry could create two write-capable agents.

## Observation

`observe(ref)` returns the provider's latest normalized run or an operation failure. A temporary
observation failure does not rewrite the last persisted run state. Provider response fields not
understood by the pinned adapter produce `AGENT_PROTOCOL_INCOMPATIBLE`; the adapter must not map an
unknown provider state to success, failure, or waiting by guesswork.

[state.ts](./state.ts) is the single candidate lifecycle authority. Polling may observe a later
state without observing every intermediate transition. Terminal runs never resume; later work is a
new run.

Waiting semantics are distinct:

- `waiting-for-input`: the provider needs request/review clarification;
- `waiting-for-approval`: the provider requires an explicit plan/action approval;
- `blocked`: quota, capacity, account, infrastructure, or another recoverable provider condition;
- `failed`: the run terminated unsuccessfully;
- `expired`: the provider permanently discarded or timed out the run.

The adapter exposes a concise reason but never provider credentials or an unbounded raw payload.

## Cancellation

`cancel(ref)` is present on every adapter so callers need no provider cast:

- `cancelled` means a terminal remote cancellation was observed;
- `requested` means the provider accepted a best-effort cancellation request and must be observed;
- `unsupported` means the provider has no qualifying cancellation operation;
- `already-terminal` is a successful no-op; and
- `failed` reports an expected cancellation failure.

Local `AbortSignal` cancellation only stops the local HTTP call. It never claims the remote run was
cancelled.

When cancellation is unsupported, the request owner may abandon the result but must wait for or
continue observing the remote run before dispatching another writer to the same PR branch.

## Provider selection and failover

V1 composition selects one adapter from trusted server configuration. No provider or model flag is
added to `astrale ui request`, the GitHub form, or the public issue body.

An ordered fallback may be added later, subject to these laws:

1. fallback is allowed only after a failure marked `retry: safe` and before any remote acceptance;
2. `after-change` requires a human/configuration change;
3. `unsafe` forbids automatic retry or fallback;
4. one request/PR branch has at most one non-terminal writer; and
5. a later review iteration may deliberately choose another provider because the PR is portable
   continuity.

Provider bake-offs use disposable fixtures or isolated branches; they never race on a production
request PR.

## Failures

- `AGENT_AUTH_REQUIRED`: configured credential is absent or expired; retry after credential repair.
- `AGENT_PERMISSION_DENIED`: provider/account/repository policy rejects the operation.
- `AGENT_QUOTA_EXHAUSTED`: provider capacity, credits, or budget blocks dispatch.
- `AGENT_INVALID_JOB`: the normalized input violates this contract or provider-admitted bounds.
- `AGENT_NOT_FOUND`: the opaque run no longer exists or belongs to another adapter/account.
- `AGENT_UNAVAILABLE`: a definitely unaccepted transient provider/transport failure.
- `AGENT_OUTCOME_UNKNOWN`: acceptance may have happened; automated retry is unsafe.
- `AGENT_PROTOCOL_INCOMPATIBLE`: the provider response cannot be safely mapped.

Expected provider failures return discriminated results. Unexpected implementation defects escape
instead of being flattened into a convenient provider failure.

## Versioning

The adapter contract has its own V1 evolution independent of provider API versions. Each concrete
adapter pins the provider API/version/header it qualifies and owns translation into the V1 model.
Provider preview/alpha changes may require only an adapter update while the neutral contract remains
stable. A semantic change to run states, success, idempotency, or failure retry safety requires a
new adapter contract version or an explicit compatible extension.
