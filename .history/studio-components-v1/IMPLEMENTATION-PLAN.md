# Implementation plan

## Phase 0 — Freeze authority and baseline

1. Preserve the workbook and SHA-256 digest.
2. Extract every sheet, cell, formula, and row identity without changing the workbook.
3. Prove 902 unique IDs, 58 families, continuous family numbering, 737 component variants, 148
   pattern variants, 17 block variants, 68 animated variants, exact commands, and exact Family &
   Audit equality.
4. Record exact `origin/main`, existing package/registry/catalog counts, package archive digest and
   size, and public registry digest.
5. Census every current pattern/block address in sibling consumers before selecting a disposition.

Exit: authority checks are green and no implementation claim exists yet.

## Phase 1 — Intake tooling and one vertical slice

1. Add local-source exclusion and a prepublication leak checker.
2. Implement batched `shadcn view` retrieval against pinned CLI `4.18.0`, `base-nova`, Base UI, and
   Lucide. Never log credentials or source bodies.
3. Persist one verbatim registry response per ID with response digest and retrieval timestamp.
4. Implement deterministic address/layout generation from `inventory.json`.
5. Implement the finite import/path adapter and independent reverse-fidelity checker.
6. Complete Accordion end to end: all 16 IDs, manifests, previews, typecheck, browser interaction,
   local registry build, and clean-project CLI install.

Exit: the pipeline, not hand edits, owns the complete Accordion family.

## Phase 2 — Source intake in bounded batches

Process families alphabetically in batches small enough for one exact failure report. Within every
batch:

1. Fetch every expected ID and reject extras, missing IDs, wrong names, or registry errors.
2. Preserve every file, dependency, registry dependency, CSS extension, and environment variable
   declaration.
3. Adapt mechanically and prove reversibility per file.
4. Detect shared-file equal-digest deduplication and unequal-body collisions.
5. Generate manifests, canonical previews, catalog descriptors, and status entries.
6. Typecheck and render the batch before advancing.

Batch boundaries:

1. Accordion–Button Group
2. Calendar–Context Menu
3. Data Table–Input
4. Input Mask–Navigation Menu
5. Pagination–Scroll Area
6. Select–Stepper
7. Switch–Typography

Exit: fetched/adapted/manifest/preview sets equal all 902 workbook IDs.

## Phase 3 — Replace Astrale-authored compositions

1. Generate a current-address/consumer/source crosswalk.
2. Map only semantically exact Studio replacements; do not infer from visual similarity.
3. Migrate real consumers and CLI examples to new addresses.
4. Remove old authored JSX, previews, fixtures, manifests, built JSON, and tests after replacement
   proof. Remove unmatched home-made compositions when the consumer census is empty.
5. Keep runtime owners required by the imported Studio sources.

Exit: no retained pattern/block lacks authoritative provenance or explicit external-consumer proof.

## Phase 4 — Complete lazy catalog

1. Compose public and local-internal manifests in development without publishing the latter.
2. Derive three catalog tabs, families, counts, search, and direct links from manifests.
3. Reuse the existing preview glob and lazy observer; do not create one eager import map.
4. Use upstream demo components as previews and authoritative fixture data as-is.
5. Partition generated browser smoke so one run does not mount 902 variants simultaneously.
6. Prove HMR for source and manifest changes without server restart.

Exit: all 902 variants are discoverable and individually renderable; initial JS does not include
all preview chunks.

## Phase 5 — CLI and downstream proof

1. Build an internal local registry index with all 902 addresses.
2. Serve it locally and point an isolated external project at the exact snapshot.
3. Run `astrale ui add <address>` for every address in clean reusable shards, rejecting overwrites
   and undeclared files.
4. Typecheck and production-build installed outputs; run representative family interactions.
5. Prove external third-party passthrough such as `@ss-components/input-02` remains independent.

Exit: every address installs and the public runtime package remains unchanged.

## Phase 6 — Qualification and reviews

1. Run workbook/source/registry/catalog closed-set checks.
2. Run complete typecheck, unit, registry behavior, browser, production-lazy, security, package, and
   publication qualification.
3. Compare runtime package size/files/digest and public registry contents to baseline.
4. Run an adversarial source-fidelity review and the tests-reviewer critic/gap-finder process.
5. Resolve material findings, rerun affected and full proof, and update the ledger with exact
   artifacts.

Exit: every acceptance item is checked with exact evidence; no commit, push, publication, or public
artifact contains licensed Studio source.
