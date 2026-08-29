# Candidate implementation plan

Implementation begins only after [RATIFICATION.md](./RATIFICATION.md) closes.

## Phase 1: eliminate remaining transport and trust risk

1. Add a temporary issue form on a branch and run the submission POC in [POC.md](./POC.md).
2. Choose the smallest isolated static preview adapter and record its credential, origin, cleanup,
   and GitHub deployment semantics.
3. Prove untrusted candidate CI with no secrets and a read-only token.
4. Ratify query/context bounds only from measured transport behavior.

Termination: no unresolved decision can change the public command, retained record, trust
boundary, or required infrastructure.

## Phase 2: promote the durable contract

1. Create `request/.spec/api.d.ts` from the accepted public journey.
2. Add the retained intake JSON Schema, semantic laws, lifecycle topology, and architecture.
3. Add only measured limits.
4. Typecheck candidate examples and lock the intentionally small module layout.

Termination: current contract consequences are no longer stranded in history documents.

## Phase 3: deterministic request tooling

1. Implement one request checker driven by merge-base diff and current manifests.
2. Generate changed-output inventory; do not maintain family/provider lists.
3. Validate intake schema, digests, license evidence, output/path closure, adaptation categories,
   duplicate identities, and dependency declarations.
4. Compose existing registry build/check, search closed-set, catalog closure, package boundary, and
   install qualification rather than reimplementing them.
5. Emit one machine-readable evidence manifest used by CI and PR presentation.

Termination: the fixture POC passes and deliberately corrupted digest, license, path, address,
adaptation, and preview cases fail independently.

## Phase 4: CLI submission

1. Add the GitHub issue form with stable field IDs and minimal requester questions.
2. Implement `astrale ui request <query> [--json]` in the CLI owner.
3. Keep human and JSON behavior truthful about draft versus submitted state.
4. Add help, public API, browser adapter, encoding, cancellation, and failure tests.
5. Qualify the bundled CLI without adding GitHub credentials or a GitHub client dependency.

Termination: a clean external project opens the exact form; JSON provides the same draft URL; no
issue is falsely reported as created.

## Phase 5: agent protocol and PR template

1. Ratify and implement the child [`request/agent`](../../agent/README.md) contract and conformance
   harness first.
2. Qualify two materially different managed provider APIs; keep provider selection in trusted
   composition and all provider details behind adapters.
3. Provide the selected agent with the complete request contract and repository-owned scripts, not
   a per-component playbook.
4. Make current-corpus duplicate search the first step.
5. Use shadcn's programmatic registry API as one research source with partial failure, followed by
   wider source research.
6. Require the comparison, retained intake record, exact adaptations, generated previews, and
   evidence manifest before PR creation.
7. Persist the attempt/run binding, poll to one PR, and dispatch review revisions as fresh runs
   against that PR.
8. Add the concise PR template from [SPEC.md](./SPEC.md).

Termination: two different managed providers pass one contract suite and produce the same required
PR work product. Provider choice remains trusted composition; credential-specific steps may differ
only to preserve least-credential exposure.

## Phase 6: unprivileged candidate CI and live preview

1. Add a `pull_request` workflow with explicit read-only permissions, checkout credential
   persistence disabled, and no token or secret exposed to candidate commands.
2. Admit manifests/dependencies before executing candidate install/build code.
3. Run focused request checks, existing repository checks, exhaustive desktop/mobile catalog
   traversal, and isolated install qualification.
4. Capture deterministic screenshots for changed previews and upload the complete artifact.
5. Pass only the admitted, revision-bound static artifact to a base-controlled publisher that uses
   fixed pinned code and transfers bytes without executing artifact-controlled input.
6. Attach the exact preview URL as a GitHub deployment and clean it on PR closure.
7. Keep all other privileged metadata automation candidate-blind.

Termination: one intentionally failing preview remains item-isolated; an unavailable registry does
not affect committed-source CI; preview refresh and cleanup work across consecutive PR revisions.

## Phase 7: review, release, and end-to-end proof

1. Run focused test-quality and semantic gap reviews.
2. Correct Critical/High findings without weakening existing gates.
3. Exercise request -> issue -> research -> PR -> comment revision -> refreshed preview -> merge.
4. Confirm the merged entry is in search, can be added to an external project, typechecks, and is
   published only through the existing release workflow.
5. Record exact revisions, URLs, artifacts, commands, and release proof in the ledger.

Stop once this boundary works. Semantic/vector source discovery, direct authenticated issue
creation, automatic license expansion, multi-repository requests, and workflow orchestration remain
deferred until measured demand justifies them.
