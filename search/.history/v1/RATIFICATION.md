# Ratification gate

Ratified on 2026-08-28 after the POC and adversarial reviews closed. The accepted durable
consequences are now owned by `search/.spec/`; this directory remains temporal design evidence.

## Required evidence

- [x] Every pre-ratification criterion in [ACCEPTANCE.md](./ACCEPTANCE.md) is closed.
- [x] [LEDGER.md](./LEDGER.md) records the exact UI revision, environment, commands, metrics, and
      review findings.
- [x] The public command and JSON example are accepted, including `command`, limit/offset, code for
      every result, lock behavior, and removal of `list`.
- [x] The selected engine and versioned artifact boundary have a dependency and compatibility
      rationale.
- [x] Numeric limits and budgets are measured, not aspirational.
- [x] No unresolved decision would materially change the public contract or release sequencing.

## Ratification action

1. Mark the accepted decisions `ratified` in the ledger.
2. Promote only durable contract consequences into `search/.spec/`; historical alternatives and
   measurements remain here.
3. Update the implementation plan if the accepted engine changes ownership or release ordering.
4. Begin production implementation only after that promotion is reviewed.

Ratification did not itself claim implementation, publication, or live behavior. Implementation
status and release proof are recorded separately in the ledger and acceptance checklist.
