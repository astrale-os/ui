# Studio Components V1

This directory is the delivery authority for the local, internal intake of every numbered item in
`shadcn_studio_complete_component_registry_2026-08-26.xlsx`.

The workbook is immutable input. `inventory.json` is its normalized machine crosswalk. Source code
retrieved from `@ss-components` is licensed internal material and belongs under the ignored
`.internal/shadcn-studio` owner; it must never enter Git, npm archives, public registry artifacts,
CI artifacts, source maps, or logs.

Read in this order:

1. [GOAL.md](./GOAL.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)
4. [ACCEPTANCE.md](./ACCEPTANCE.md)
5. [LEDGER.md](./LEDGER.md)

`LEDGER.md` is the sole status-bearing document. Counts or statements elsewhere are requirements,
not progress claims.

Local lifecycle:

```bash
pnpm studio:fetch -- --all
pnpm studio:resolve -- --all
pnpm studio:adapt -- --all
pnpm studio:qualify
pnpm playground:dev
```

`pnpm studio:qualify` requires the ignored hydrated source and validates all 902 entries. Ordinary
`pnpm check`, public Playwright, and `build:public` deliberately run without that source surface, so
the public repository remains reproducible from a clean checkout.
