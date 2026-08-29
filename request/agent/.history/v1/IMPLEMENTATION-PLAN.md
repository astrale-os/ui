# Candidate implementation plan

No production adapter work begins until [RATIFICATION.md](./RATIFICATION.md) is approved.

## Phase 1 — Ratify the portable contract

- Review the job, target, run, failure, retry-safety, cancellation, and success semantics.
- Resolve the open questions in [LEDGER.md](./LEDGER.md).
- Ratify measured upper bounds in the candidate JSON Schema/admission rules.
- Freeze V1 only after the state model and security review agree.

Exit: one decision-complete V1 contract with no provider-specific public fields.

## Phase 2 — Build the conformance harness

- Implement a deterministic fixture adapter for every state and failure path.
- Add reusable contract tests that any adapter factory can run.
- Prove restart recovery, idempotency, uncertain outcome handling, cancellation strength, exact PR
  cardinality, URL/repository validation, and unknown-status rejection.

Exit: the port can be qualified without a live paid provider.

## Phase 3 — Eliminate provider risk with two thin POCs

Use credentials/accounts already available to qualify two materially different direct APIs. A good
contrast is a GitHub-native task API plus a session-oriented provider such as Jules, Cursor, or
Devin. Each POC is disposable and must prove:

- exact dispatch payload from the normalized job;
- durable observation after process restart;
- complete status mapping, including waiting and timeout states;
- PR extraction and intended-repository validation;
- cancellation or truthful unsupported cancellation; and
- whether native idempotency exists and what happens on an ambiguous timeout.

Exit: two evidence-backed mappings or a ratification decision to narrow/change the contract.

## Phase 4 — Implement only qualified adapters

- Use small, provider-owned modules with pinned versions and native `fetch` where practical.
- Keep authentication and provider response schemas private.
- Run the common conformance suite plus provider fixtures captured from documented/test responses.
- Do not add a provider registry framework; trusted composition constructs the selected adapter.

Exit: two adapters pass identical contract assertions without conditionals in the parent workflow.

## Phase 5 — Integrate the request dispatcher

- Reserve and persist attempt/idempotency metadata on the GitHub request.
- Inject one configured `ManagedAgent`.
- Dispatch the initial candidate and reconcile non-terminal runs by polling.
- Bind the successful PR, CI, preview, and review flow.
- Dispatch review revisions as fresh runs against the existing PR.
- Keep provider/model selection out of CLI and request input.

Exit: one real accepted request completes through an ordinary PR and one review revision.

## Phase 6 — Qualify operations and security

- Exercise crash/restart between reservation, dispatch, persistence, and observation.
- Simulate pre-accept failure, post-accept timeout, quota, auth expiry, unknown status, malformed PR,
  duplicate dispatch, unsupported cancellation, and provider outage.
- Verify least privilege, secret redaction, branch protection, CI, preview, provenance, and license
  gates.
- Document operator reconciliation for `AGENT_OUTCOME_UNKNOWN`.

Exit: [ACCEPTANCE.md](./ACCEPTANCE.md) is satisfied with retained evidence.

## Stop rule

V1 stops at one injected provider, deterministic polling, one PR outcome, and review re-dispatch.
No chat UI, semantic router, provider marketplace, webhook bus, database, agent framework, shared
provider SDK, or automatic multi-provider competition is added without a separate demonstrated
journey.
