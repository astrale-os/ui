# Request V1 candidate

This directory is temporal design evidence for the proposed Astrale UI intake pipeline. Nothing
here is a released contract.

Read in this order:

1. [GOAL.md](./GOAL.md)
2. [SPEC.md](./SPEC.md), [api.d.ts](./api.d.ts), and [state.ts](./state.ts)
3. [ARCHITECTURE.md](./ARCHITECTURE.md)
4. [PROVENANCE.md](./PROVENANCE.md)
5. [SECURITY.md](./SECURITY.md)
6. [POC.md](./POC.md)
7. [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)
8. [ACCEPTANCE.md](./ACCEPTANCE.md)
9. [LEDGER.md](./LEDGER.md)
10. [RATIFICATION.md](./RATIFICATION.md)

The managed repository-worker seam is the child candidate
[`request/agent`](../../agent/README.md). Read and ratify its independent contract before the
parent's agent integration phase.

[LEDGER.md](./LEDGER.md) is the only status-bearing document. Durable `.spec/` artifacts and
production implementation must not be created until the ratification gate closes.
