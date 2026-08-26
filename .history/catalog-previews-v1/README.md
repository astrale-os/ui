# Automated catalog previews V1

This directory is the implementation ledger for replacing the playground's hand-maintained
specimen maps with an automatically discovered, lazy-loaded catalog.

It governs development-only previews and their qualification. It does not change the public
`@astrale-os/ui` API, Astrale registry addresses, installed source, theme document contract, or the
CLI installation journey.

The current implementation remains the evidence of what exists. These files record the approved
target and migration sequence; they are not proof that the target has shipped.

This initiative deliberately raises Theme Studio V1's historical requirement from representative
live patterns/blocks to complete visual coverage. It does not rewrite or invalidate the evidence
that closed the smaller V1 requirement at that time.

## Baseline

The plan was written from UI revision `e70276104cd264189412a80e9622b4a3794f65aa` on 2026-08-26.

- 50 runtime components and 12 registry components have centrally authored specimens.
- 3 of 26 patterns and 1 of 23 blocks render as live registry specimens.
- The complete inventory lists all 64 registry items, including three theme environments.
- `component-specimens.tsx` and `registry-specimens.tsx` are manual composition authorities that
  can drift from package exports and registry manifests.

## Documents

- [GOAL.md](./GOAL.md) — outcome, scope, and non-goals
- [ARCHITECTURE.md](./ARCHITECTURE.md) — ownership, preview contract, discovery, lazy loading, and
  source policy
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — dependency-ordered delivery plan
- [ACCEPTANCE.md](./ACCEPTANCE.md) — falsifiable completion and regression criteria
- [LEDGER.md](./LEDGER.md) — decisions, coverage batches, gaps, status, and observed evidence

## Status vocabulary

- `planned` — accepted target with no implementation evidence yet
- `in-progress` — implementation exists but its closure proof is incomplete
- `blocked` — closure depends on a named external decision or unavailable prerequisite
- `complete` — the mapped proof passed on the exact recorded revision

Only [LEDGER.md](./LEDGER.md) records delivery status. The other documents state the target and
must not be rewritten merely to make an incomplete implementation appear complete.
