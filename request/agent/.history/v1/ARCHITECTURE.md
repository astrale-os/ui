# Candidate architecture

## Boundary

The adapter is a replaceable port between the request workflow and one managed coding provider:

```text
astrale ui request / GitHub issue
             |
             v
trusted request dispatcher ---- persisted attempt + run reference
             |
             v
ManagedAgent V1 port
             |
             v
concrete provider adapter ---- managed repository worker
                                      |
                                      v
                              ordinary GitHub pull request
                                      |
                                      v
                             CI + preview + human review
```

It is intentionally narrower than a general agent SDK. GitHub is the portable source, review, and
continuity plane. The provider is a replaceable worker that proposes changes.

## Ownership

| Owner | Responsibility | Must not own |
| --- | --- | --- |
| Parent request workflow | Admission, objective compilation, provider selection, durable attempt reservation, review loop, acceptance | Provider HTTP/status translation |
| `request/agent` contract | Job, run, state, failure, retry-safety, cancellation, PR-success semantics | Search, source selection, licenses, UI registry rules |
| Concrete adapter | Authentication, pinned provider API, exact status mapping, idempotency mechanism, polling, PR extraction | Public CLI semantics or request policy |
| Managed provider or worker | Sandbox/runner, execution, provider session/activity internals | Astrale acceptance or merge authority |
| GitHub and CI | Branch/PR continuity, checks, previews, comments, merge controls | Provider credentials |

Provider routing belongs to trusted composition above `ManagedAgent`. It is not another operation
on the port and is never accepted from public request input.

## Candidate implementation layout

The ratified contract may graduate without copying the history documents into production:

```text
request/agent/
  .spec/
    api.d.ts
    state.ts
  src/
    index.ts
    adapters/
      <implemented-provider>/
  tests/
    contract/
```

Only adapters that are actually implemented and qualified get a directory. There is no empty
provider catalog, common provider SDK, or adapter registration framework.

## Dependency direction

```text
request workflow -> ManagedAgent port <- concrete adapter -> provider HTTP API
        |
        +-----------------------------------------------> GitHub issue/PR
```

- The neutral port has no provider SDK dependency.
- Adapters may depend on the smallest provider HTTP client needed; native `fetch` is preferred when
  the API is small.
- Runtime UI, registry items, the public UI package, SDK consumers, and generated search indexes do
  not depend on the adapter.
- Provider response types stay private to their adapter.

## Durable coordination without a new database

The parent workflow stores an attempt marker and opaque `ManagedAgentRunRef` on the authoritative
GitHub request, using a machine-readable issue comment or equivalent GitHub-owned metadata. Before
dispatch it reserves the exact attempt/idempotency key. After acceptance it records the run
reference and normalized state.

The dispatcher may resume after process restart from this binding. If dispatch returns
`AGENT_OUTCOME_UNKNOWN`, the reservation remains unresolved and prevents another writer until an
operator reconciles it. This design does not require a database, queue, or durable provider session
in V1.

`ManagedAgentRunRef.id` is deliberately one opaque adapter value. If a provider separates agent,
session, task, and run identifiers, its adapter encodes and validates that private addressing
without imposing those concepts on the parent workflow.

## Reconciliation

Polling is the universal driver. A scheduler or workflow wake-up reads non-terminal bindings and
calls `observe()`. A provider stream or signed webhook may later reduce latency, but it only wakes
reconciliation; it never becomes the state authority.

One request/PR branch has at most one non-terminal writer. A new review attempt starts only after
the prior attempt is terminal or its write authority is proven ended. The provider may change
between attempts because the target PR and complete objective carry continuity.

## Replaceability proof

Replaceability is proven by two materially different provider adapters passing one contract suite,
then completing the same fixture journeys:

1. dispatch against an exact repository/base;
2. survive coordinator restart and observe by opaque reference;
3. finish with exactly one PR;
4. dispatch a fresh revision run against that PR; and
5. normalize cancellation/unsupported cancellation without a provider cast.

An interface with one implementation is only an extraction seam, not proven portability. GitHub
Copilot, Cursor, and GitHub Actions/Claude Code now exercise this suite without a parent
conditional. Production enablement additionally requires the selected worker to complete one live
disposable request; another paid provider account is continuing evidence rather than a blocker.
