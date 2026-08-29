# ADR: UI ecosystem control plane

- Status: ratified and implemented; release qualification in progress
- Scope: V1 architecture, Schema, and Runtime
- Origin: `ui.astrale.ai`
- Package: `@astrale-domains/ui`

## Context

Astrale UI already has distinct owners for different jobs:

| Concern | Authority |
| --- | --- |
| Runtime components and public package APIs | `@astrale-os/ui` |
| Registry sources, manifests, previews, provenance, and catalog | UI repository |
| Fast local lexical search and source installation | `astrale ui` CLI plus generated UI artifacts |
| Request identity, ownership, idempotency, and submission receipt | UI Domain |
| Issue and pull-request collaboration | GitHub |
| Source discovery, adaptation, qualification, and PR preparation | Repository automation and managed agent |

The headless `astrale ui request <intent>` journey cannot assume that its caller has GitHub
credentials. Conversely, making the UI Domain a copy of the component registry or of GitHub would
create multiple authorities and unnecessary graph volume.

## Decision

`ui.astrale.ai` is a narrow, headless control plane. V1 introduces one owned `Request` resource and
one authenticated `request` Function contract.

The Domain retains only durable control-plane facts:

- the caller's exact Astrale Identity, as both the ownership edge and the indexed owner coordinate;
- the request intent supplied to the Function;
- a caller-provided idempotency key;
- the submission lifecycle; and
- the external collaboration URL once known.

The Domain does not store component source, registry entries, preview code, screenshots, search
documents, embeddings, GitHub comments, or pull-request state.

```text
headless CLI or agent
        |
        | authenticated Function call
        v
ui.astrale.ai -- owns Request identity and receipt
        |
        | secret-backed Request Submission Integration
        v
GitHub -- owns public collaboration and review

UI repository -- generates metadata/search/install artifacts --> astrale ui CLI
```

The candidate Schema has these public semantics:

```text
request({ intent, idempotencyKey })
  -> { state: "submitted", requestId, collaborationUrl }
   | { state: "pending" | "outcome-unknown" | "failed" | "conflict", requestId }
```

`request` requires an authenticated Astrale caller. The caller never supplies a GitHub token. The
Request Submission Integration uses Domain-owned credentials and must reconcile an uncertain external
submission before retrying. The exact Identity owns every `Request`, and no other caller may read
or traverse it.

`conflict` is a Function result, not a persisted submission state. It means the same owner already
used the supplied idempotency key for another intent; no graph or provider effect occurs.

## State and authority

The `requestSubmission` state machine is the only submission lifecycle authority:

```text
pending --uncertain--> outcome-unknown --reconcile--> submitted
                                 --reject-----> failed --retry--> pending
```

`submitted` is terminal in V1. The Domain does not mirror whether the GitHub issue is open, closed,
accepted, implemented, or released. Those facts remain at their source.

The Runtime proves these persistence laws atomically:

1. every Request has exactly one `request_owned_by` Identity edge whose source equals its
   `ownerId` coordinate;
2. one Identity and idempotency key resolve to at most one Request within the ratified retention
   scope;
3. a `submitted` Request has exactly one valid `collaborationUrl`, and other states do not claim a
   successful external receipt; and
4. `outcome-unknown` is reconciled before another external submission is attempted.

The implementation crosses the external effect boundary in this order:

```text
read caller-owned key
  -> create Request + owner edge atomically when absent
  -> reserve outcome-unknown before GitHub can observe a write
  -> submit one issue
  -> atomically confirm collaborationUrl or record an explicit provider rejection

existing outcome-unknown
  -> read-only bounded GitHub reconciliation
  -> confirm one exact trusted marker or remain unresolved
```

Using `outcome-unknown` as the pre-effect reservation deliberately fails safe across interruption.
A crash before GitHub submission and a lost response after submission are indistinguishable without
an idempotent provider write. A read-only empty scan therefore never authorizes an automatic retry;
only the original provider call's explicit rejection may enter `failed`. This can retain a stranded
unknown Request, but cannot create a duplicate issue automatically.

## Deliberate exclusions

- No registry graph: registry and catalog material remains generated from repository manifests.
- No `search` Function in V1: wrapping the already-fast offline lexical index would add a network
  hop without server-only value.
- No dependency on `issues.astrale.ai`: a UI Request is an intake receipt, not a generic internal
  work item. A later projection may create either a GitHub issue or an Issues Domain issue without
  changing Request identity.
- No View: the initial consumers are headless CLI clients and agents. GitHub provides the review
  surface.
- No anonymous public mutation: abuse controls and admission policy require a separate decision.
- No agent runtime in the Domain: the Domain coordinates authority; managed-agent selection and
  repository execution remain replaceable integration concerns.
- No agent runtime, View, search service, registry copy, or deployment is introduced by V1.

## Runtime boundary

One Workflow implements `request`; one provider-neutral Integration owns issue submission and
reconciliation; one GitHub Provider implements that boundary. Runtime initialization admits the
repository, credential, and exact trusted actor from secrets once. The Provider uses GitHub REST API
version `2026-03-10` with bounded response reads and bounded reconciliation pagination. A public
marker is never sufficient reconciliation evidence without that exact actor.

The Application explicitly requires Kernel Query and Mutation. The Workflow reads its internal
idempotency ledger with Domain-self authority and scopes the lookup by `ownerId`; caller-facing
visibility remains governed by the ownership edge. Confirmation uses one machine-derived transition
whose auxiliary collaboration URL is committed in the same Node update.

The GitHub issue is the handoff to the existing repository automation. Agent execution and PR
production remain behind that repository's trusted workflow-dispatch/triage boundary.

## Search admission gate

A future `search` Function is justified only when the server owns material value unavailable to
the local CLI, such as a shared semantic/vector index, private sources, centralized ranking
feedback, or cross-client freshness. Even then, search documents and embeddings are derived
storage, not graph nodes, and the response must preserve the existing UI search result contract.

## Alternatives considered

1. **Open a GitHub form only.** This fails for headless unauthenticated GitHub clients and provides
   no durable Astrale receipt.
2. **Accept anonymous Domain requests immediately.** This is convenient but establishes an
   unbounded public mutation and agent-spend surface before abuse policy exists.
3. **Represent the full UI registry in the graph.** This duplicates repository authority and turns
   generated search/catalog data into lifecycle state.
4. **Reuse the Issues Domain as the request model.** Project work tracking and external UI intake
   have different identity, authority, and lifecycle semantics.
5. **Put search in the Domain now.** The current lexical search is local, generated, and fast; a
   remote wrapper would be architectural ceremony rather than capability.

## Consequences

- The UI package remains independent of the SDK and Domain.
- The CLI may depend on the Domain client without pulling UI runtime code into applications.
- GitHub outages or ambiguous responses are represented explicitly instead of duplicated blindly.
- Provider and agent choices can change without changing the public Schema.
- Deployment and real issue creation remain separate operational evidence; source qualification
  does not claim either.

The repository owner explicitly authorized disposable live qualification and real test issues;
those probes were closed after retaining their evidence. Production deployment still requires the operator to bound which authenticated identities may invoke the shared
GitHub writer and qualify owner isolation through an installed Kernel path. Those are operational
admission gates; they do not broaden the V1 Schema or justify an anonymous callable.
