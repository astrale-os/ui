# Agent-native UI search V1

This directory preserves the V1 design, ratification, and delivery evidence for replacing
`astrale ui list` with one free-text discovery journey.

It was opened from UI revision `063c9c685db3509a7694dfb6ca5a397c4aa7cd97` on 2026-08-27. At
that baseline, the closed searchable union is 976 registry items plus 50 visual runtime component
subpaths. The current CLI performs a case-insensitive substring scan only over registry item
addresses, names, titles, and descriptions.

These files are temporal knowledge. They do not prove implementation, publication, or live
behavior unless [LEDGER.md](./LEDGER.md) records the corresponding evidence.

## Documents

- [GOAL.md](./GOAL.md) — outcome, scope, and non-goals
- [SPEC.md](./SPEC.md) — candidate consumer contract, corpus, ranking, and failure semantics
- [api.d.ts](./api.d.ts) — mechanically checkable candidate types
- [ARCHITECTURE.md](./ARCHITECTURE.md) — ownership and representation flow
- [BENCHMARKS.md](./BENCHMARKS.md) — stable relevance and scale workloads
- [limits.ts](./limits.ts) — candidate safety limits and measured local performance budgets
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — dependency-ordered work after ratification
- [ACCEPTANCE.md](./ACCEPTANCE.md) — falsifiable design, implementation, and regression criteria
- [LEDGER.md](./LEDGER.md) — the only status-bearing decision and evidence record
- [RATIFICATION.md](./RATIFICATION.md) — the explicit gate before full implementation

## Status vocabulary

- `open` — evidence or an owner decision is still required
- `candidate` — current recommended decision, not yet ratified
- `locked` — explicitly decided and no longer part of the search investigation
- `proven` — observed by the named POC or check on the recorded revision
- `ratified` — accepted as the implementation contract
- `implemented` — production code exists and its mapped evidence passed

Only [LEDGER.md](./LEDGER.md) changes status. Other documents state the candidate target and must
not be rewritten to disguise missing evidence.
