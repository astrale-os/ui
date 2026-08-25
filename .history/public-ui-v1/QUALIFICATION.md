# Qualification record

Date: 2026-08-25.

## Revisions and worktrees

- UI baseline: `astrale-os/ui@d460f711c05e4f14f1467c7992e3193e0ceb913a`
- UI implementation branch: `codex/ui-public-v1-history-20260825` in
  `/private/tmp/ui-public-v1-history-20260825`
- CLI baseline: `astrale-os/cli@d8aa9d902c99513e34389d65a9a1aaa496083086`
- CLI implementation branch: `codex/public-ui-v1-20260825` in `/private/tmp/cli-public-ui-v1`
- SDK zero-weight observation: `astrale-os/sdk@32a398c7c932c717b540d8c3a342094c7c851a96`

The reviewed delivery commits are named in the handoff rather than self-recorded here, because a
commit cannot embed its own final hash. Primary checkouts were not edited.

## Upstream intake

The runtime intake was created with exact `shadcn@4.18.0`, `base=base`, `style=nova`, and
`@base-ui/react@1.7.0`. The source union and dispositions live in `upstream-components.tsv`.

## UI proof

`pnpm qualify` passed in the UI worktree. It covered:

- formatting, lint, workspace typechecks, 13 repository contract tests, and 5 registry contract
  tests;
- 8 representative Base-backed runtime behavior tests;
- emitted ESM/declarations and no source maps;
- official shadcn build of one `registry:base`, 26 patterns, and 23 blocks from the include-based
  source registry;
- clean external tarball installation and root-import tree-shaking;
- private catalog production build; and
- 4 Chromium journeys across desktop/mobile with keyboard behavior, all three presets in light and
  dark modes, reduced-motion behavior, the full 49-item registry inventory, and zero critical or
  serious axe violations.

Packed baseline:

| Measurement | Value |
| --- | ---: |
| tarball | 57,533 bytes |
| unpacked package | 348,393 bytes |
| files | 115 |
| root `Button` consumer bundle | 46,906 bytes |
| root `Button` consumer bundle gzip | 15,783 bytes |

The budget gate is 500 kB packed and 50 kB gzip for that semantic root-import workload. Optional
reset, catalog, registry source, patterns, blocks, tests, history, and source maps are absent from
the package archive.

## CLI proof

Focused CLI proof passed:

- format, lint, production/test/Studio typechecks;
- 14 UI service tests;
- 14 program/help tests plus the existing intentional workspace-skill mirror skip;
- exact runner construction for pnpm/npm/yarn/Bun;
- one-SHA include resolution, dry-run immutability, rollback, successful lock advancement, local
  edit detection, and preset application; and
- unchanged installed dependency boundary: UI, React, Base UI, Tailwind, and shadcn are invoked or
  read on demand and are not CLI manifest dependencies.

The complete pre-existing CLI suite was also attempted. Its UI tests passed; three unrelated
`instance-status` tests failed because the environment refused Bun's ephemeral port `0` binding
with `EADDRINUSE`. A serial rerun produced the same environment failure. This is retained as a full
suite harness gap rather than classified as a UI or CLI product regression.

## External gates

Live preflight on 2026-08-25 established:

- `astrale-os/ui` is still a private GitHub repository;
- an isolated public-only lookup of `@astrale-os/ui` at `registry.npmjs.org` returns `404`; and
- the workspace-scoped npm configuration resolves a separate GitHub Packages lineage through
  `0.2.1`; that private-registry metadata is not evidence that the public npm name exists.

Because npm requires a package to exist before its trusted publisher can be configured, the first
public prerelease is the one human-gated bootstrap exception documented in `CI-AND-RELEASE.md`.
Every automated publication after bootstrap remains OIDC-only.

The following are not claimed complete:

1. repository visibility and governance review;
2. first public prerelease bootstrap, then npm trusted-publisher configuration;
3. public npm observation of the exact artifact/provenance;
4. GUI/Admin/Domains lockfile-correct legacy consumer cutover; and
5. public-package generated React qualification and later stable assistive-technology matrix.

Consumer migration is deliberately after first publication: `CONSUMER-CENSUS.md` explains why a
temporary tarball locator or manually authored lockfile would be false proof.
