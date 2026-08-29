# Candidate acceptance criteria

## Contract

- [x] TypeScript, runtime admission, and JSON Schema express the same admitted job, run reference,
  and result; measured
  upper limits are ratified.
- [x] Every provider-documented state has exact adapter coverage; unsupported abstract waiting states
      are not guessed.
- [x] `succeeded` is impossible without exactly one valid PR in the intended UI repository.
- [x] Unknown provider states and malformed responses fail closed as protocol incompatibility.
- [x] Expected provider failures retain exact retry safety; unexpected defects are not flattened.
- [x] No provider, model, credential, MCP, environment, or tool configuration appears in the job.

## Replaceability

- [x] Three materially different adapters pass the same conformance suite.
- [x] The request job/dispatcher contains no provider-specific branch or response type; trusted
      credential composition is isolated by provider.
- [x] A later review attempt can use another conforming provider against the same PR.
- [x] Search, intake, license, registry, catalog, package, and SDK behavior remain independent.

## Dispatch and recovery

- [x] Production composition serializes the canonical request key before dispatch.
- [x] Reusing a reserved key against edited objective input is rejected as unsafe.
- [x] A coordinator restart can recover every accepted run from the persisted opaque reference.
- [x] A definitely unaccepted pre-dispatch failure is safely retryable; post-dispatch uncertainty is
      never classified safe.
- [x] A possibly accepted timeout becomes `AGENT_OUTCOME_UNKNOWN` and cannot automatically retry or
  fail over.
- [x] Canonical workflow serialization and the uncertain-outcome block prevent two non-terminal
      production writers per request/PR branch.

## Observation and control

- [x] Polling maps every provider-documented active, waiting, blocked, and terminal state.
- [x] Temporary observation failure does not erase or fabricate persisted run state.
- [x] Provider-reference mismatch is rejected before a remote call.
- [x] `cancelled`, `requested`, `unsupported`, and `already-terminal` are proven without overstated
  guarantees.
- [x] Local `AbortSignal` cancellation is never reported as remote cancellation.

## End-to-end product proof

- [x] The production runner dispatches an accepted exact issue and base ref through all three
      composed adapters under deterministic fixtures.
- [ ] The provider creates one ordinary PR with the expected branch and repository.
- [ ] Existing CI, preview, provenance/license, catalog, and review gates run unchanged.
- [ ] A review comment produces a fresh run targeting the same PR and an updated candidate.
- [ ] The agent cannot merge, publish, release, or access unrelated secrets/repositories.

## Operational quality

- [x] API versions, account prerequisites, rate/poll bounds, payload limits, and credential ownership
  are documented per adapter.
- [x] Runner output contains bounded attempt/run correlation but no credential or raw provider transcript.
- [x] Adapter contract tests run in CI; live smoke tests are explicitly scheduled/manual and do not
  make ordinary repository CI depend on provider availability.
- [ ] The parent and child ledgers contain exact evidence and no unresolved critical question.
