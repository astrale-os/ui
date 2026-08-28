# Implementation plan after ratification

Ratification is closed. Phase 1 and Phase 2 are implemented locally. Phase 3 local qualification
is tracked in the ledger; publication and the released external-project proof remain release gates.

## Phase 1 — promote and generate

1. Promote the accepted API, architecture consequences, schemas, and measured limits into
   `search/.spec/`.
2. Replace POC extraction with the smallest deterministic production generator owned by `search`.
3. Add the syntax-aware parser as a root development dependency with an exact package rationale;
   it must remain absent from the public UI tarball and CLI runtime.
4. Generate the versioned adaptive single/partitioned release artifact from package exports,
   registry manifests, and canonical source, including its complete scoring fingerprint.
5. Add inverse closure, pre-read safe-path, deterministic-output, compatibility, partition-size,
   pagination, and stale-generation checks to UI CI.

## Phase 2 — consume from the CLI

1. Separate release identity resolution from complete registry loading.
2. Admit nested component addresses so current provider variants remain installable.
3. Add immutable commit-keyed artifact and code caching.
4. Implement `astrale ui search`, public JSON admission, ranking, pagination, and exact-release code
   hydration.
5. Remove `ui list`, `listUi`, `--type`, `--version`, stale help, and the old discovery hint with
   complete removal closure.

## Phase 3 — qualify

1. Run relevance, current/10x/100x performance, corruption, safety, and deterministic-order tests.
2. Initialize an isolated external app, search through its lock, dry-run the returned `command`,
   install the item, and typecheck the result.
3. Advance a simulated npm `beta` and prove the initialized project remains pinned.
4. Pack and run the built CLI so source imports cannot mask packaging defects.
5. Publish UI search-artifact support before publishing the CLI consumer, then verify the exact
   released cohort.

## Deliberate deferrals

- incremental generation until full builds miss an accepted budget;
- semantic embeddings, HNSW, graph expansion, analytics, or learned ranking until lexical
  relevance evidence exposes a concrete gap; and
- third-party registry discovery beyond the already supported direct `ui add` address journey.
