# Managed Agent V1 candidate

This directory is temporal design evidence for the managed-agent adapter. Nothing here is a
released or implemented contract.

Read in this order:

1. [GOAL.md](./GOAL.md)
2. [SPEC.md](./SPEC.md), [api.d.ts](./api.d.ts), [schema.json](./schema.json),
   [state.ts](./state.ts), and [examples.ts](./examples.ts)
3. [CAPABILITIES.md](./CAPABILITIES.md)
4. [PROVIDERS.md](./PROVIDERS.md)
5. [OPTIONS.md](./OPTIONS.md)
6. [ARCHITECTURE.md](./ARCHITECTURE.md)
7. [SECURITY.md](./SECURITY.md)
8. [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)
9. [ACCEPTANCE.md](./ACCEPTANCE.md)
10. [LEDGER.md](./LEDGER.md)
11. [RATIFICATION.md](./RATIFICATION.md)

[LEDGER.md](./LEDGER.md) is the only status-bearing artifact. Durable `.spec/` and implementation
must not be created before ratification.
