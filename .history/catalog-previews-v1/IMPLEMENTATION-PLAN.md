# Implementation plan

The work is delivered in dependency order on one implementation branch. Intermediate phases may be
locally incomplete; the closed-set gate becomes required only after the backfill is complete. No
committed missing-preview allowlist or duplicate inventory is introduced.

## Phase 0 — freeze the regression baseline

1. Start from the exact current UI head and keep unrelated work in its existing worktree.
2. Record:
   - package and registry item counts;
   - current public package export list;
   - current `pnpm package:qualify` tarball file list, size, and digest;
   - current built registry file list and digest;
   - current playground entry and total JavaScript sizes from the Vite manifest;
   - the exact `pnpm qualify` result; and
   - desktop/mobile screenshots for the existing catalog and theme drawer.
3. Preserve the current Spinner, Card, Select, Dropdown Menu, Menubar, pagination, drawer, and theme
   browser assertions as named regression evidence.
4. Add no implementation changes until failures in the baseline are classified as source,
   environment, or inherited branch state.

Closure: `LEDGER.md` records exact revision, commands, counts, artifact identities, and failures.

## Phase 1 — add one preview contract and one closure check

1. Add the two preview roots defined in `ARCHITECTURE.md`.
2. Implement filename-to-address normalization as a small pure function in
   `playground/src/catalog/previews.ts`.
3. Use literal `import.meta.glob` patterns so Vite can discover and split every preview.
4. Add `scripts/check-catalog-previews.mjs` and one root command:

```text
pnpm catalog:check
```

5. Make the checker report, in one diagnostic set:
   - visual items without a canonical preview;
   - preview addresses without an item;
   - duplicate canonical or named scenes;
   - invalid filename/address values;
   - fixture or preview files included by package or registry distribution; and
   - theme items incorrectly treated as component previews.
6. Test positive and adversarial path cases with temporary fixtures. Do not parse TSX or load Vite
   from the checker.
7. Let playground typecheck/build and the generated render matrix admit preview default exports,
   canvas values, and provenance references after their modules load.
8. Extend the existing playground/registry TypeScript includes so every `.preview.tsx` and
   `.fixture.ts` is typechecked despite glob discovery. Do not create another package or TypeScript
   project solely for previews.
9. During backfill, run the checker for its report but do not weaken it or commit a debt list. Wire
   it into `pnpm check` only in Phase 7 when exact closure is achieved.

Closure: the checker fails on each synthetic mismatch and reports the current real missing set
exactly.

## Phase 2 — build the generic lazy catalog path

1. Normalize preview loaders once at module initialization and retain stable loader records.
2. Implement one `PreviewCanvas` that owns:
   - the labelled card/region shell;
   - the finite canvas layout;
   - the shared `IntersectionObserver` subscription;
   - an Astrale Skeleton loading state;
   - scene-local dynamic-module state;
   - one scene-local error boundary and retry action; and
   - stable `idle`, `loading`, `ready`, and `error` markers for tests.
3. Implement one generic catalog renderer for runtime components, registry components, patterns,
   and blocks. Derive groups from current runtime inventory and canonical registry address segments.
4. Keep themes as the existing applied environments.
5. Keep search descriptor-only. Filtering may reorder cards, but must not import offscreen modules.
6. Add native deep links for family and isolated scene views without installing a router.
7. Verify HMR for an existing preview and item source. Adding or removing a preview must update the
   Vite glob without restarting the developer command; a full page module invalidation is acceptable
   only for file-set changes, while ordinary source edits must hot update.
8. Keep the current catalog visible until the generic path renders representative previews
   correctly. Do not maintain both renderers after cutover.

Closure: representative compact, panel, wide, viewport, loading, failure, retry, deep-link, theme,
and HMR journeys pass before bulk migration.

## Phase 3 — migrate runtime and registry components

1. Split the 50 runtime specimens out of `component-specimens.tsx` into owner-addressed preview
   modules under `packages/ui/previews`.
2. Split the 12 registry component specimens into previews adjacent to their registry source.
3. Start each canonical preview from the exact currently qualified example. When official shadcn
   provides multiple documented examples, add only materially useful scenes.
4. Extract a fixture only when it is shared or materially improves readability.
5. Preserve current controlled state and accessibility behavior. Each repeated item owns unique IDs
   and local state.
6. Retain focused browser coverage for the already repaired interactive specimens. Moving JSX may
   not weaken assertions or replace semantic locators with implementation selectors.
7. After all 62 component items resolve through discovery, delete their central render mapping and
   any barrel that exists only for that mapping.

Suggested batches:

1. actions and inputs;
2. content and feedback;
3. navigation and layout;
4. menus and overlays; and
5. the 12 registry components.

Run typecheck, the focused browser component journey, and `catalog:check` after every batch.

Closure: 62 canonical component previews are auto-discovered, optional scenes are unique, and no
component source or public export changed.

## Phase 4 — backfill every pattern and block

For each registry address:

1. Read the item source, its props, registry metadata, owner tests, and upstream provenance before
   writing the preview.
2. Make the canonical preview exercise the primary consumer intent with deterministic local data
   and explicit callbacks.
3. Add named scenes only when they demonstrate a real supported state that would otherwise be hard
   to inspect. Do not generate a matrix mechanically from every prop.
4. Keep network, storage, cookies, global shortcuts, and product navigation out of fixtures.
5. Do not add CSS to repair or reinterpret the item. Route any observed defect through the source
   policy and ledger.
6. Verify the canonical scene interactively before marking the batch complete.

Backfill order keeps related dependencies and review context together:

1. patterns: calendar, carousel, chart, and combobox;
2. patterns: command palette, data table, date picker, and form;
3. patterns: message, questionnaire, sidebar, toast, and typography;
4. blocks: authentication and onboarding;
5. blocks: dashboard and data management;
6. blocks: communication, settings, and application shell.

The four current live registry specimens move to adjacent previews first and serve as the migration
examples. The remaining 45 patterns/blocks become live before the old registry renderer is deleted.

Closure: all 26 patterns and 23 blocks have canonical live previews; the central four-item
`registry-specimens.tsx` mapping no longer exists.

## Phase 5 — complete family, scene, and theme presentation

1. Overview pages render one canonical preview per item.
2. Family views render all items and named scenes in that family.
3. Compact scenes use a responsive gallery similar in information density to the sourced
   shadcn/studio examples; wide and viewport scenes retain the space their item requires.
4. Isolated scene links render one scene without unrelated lazy imports.
5. Search results expose item and scene names without duplicating package or registry subtitles.
6. Preserve the current theme drawer, live updates, browser saves, import/export, and focus
   restoration.
7. Exercise every released theme and both modes against actual loaded previews.

Closure: users can move from overview to family to isolated scene, change theme at any point, and
return without lost state, unexpected navigation, overlay clipping, or horizontal overflow.

## Phase 6 — generate qualification from discovery

### Static contract

- Unit-test filename parsing, address joining, canonical uniqueness, named scenes, default canvas
  inference, and distribution exclusion.
- Validate provider-neutral provenance and optional canvas overrides through loaded preview modules
  in the generated render matrix.
- Make registry and runtime additions fail `catalog:check` when their canonical preview is absent.
- Make orphan previews and duplicate scenes fail with exact addresses.

### Browser render matrix

- Obtain descriptors from the same discovery result used by the catalog.
- Mount every canonical and named preview through an isolated URL on desktop and mobile.
- Require a ready state, no page error, no unexpected console warning, no horizontal overflow, and
  no navigation away from the playground.
- Shard the matrix by stable address hash if execution time requires it; do not maintain hand-picked
  test lists.

### Interaction evidence

- Preserve the current component interaction journey.
- Add focused pattern/block journeys for controlled forms, calendar selection, carousel movement,
  menus/command palette, data-table state, toast queues, responsive sidebar, and full block actions.
- Owner unit tests remain the primary behavior contract; the catalog proves integration and a
  truthful live specimen.

### Accessibility evidence

- Prove keyboard access, focus containment/restoration, reduced motion, labelled regions, loading
  and error semantics, repeated-ID safety, and direct-scene navigation.
- Run serious/critical Axe checks on loaded family pages under every released theme in light and
  dark mode.
- Retain desktop and mobile screenshots by family as review artifacts, not brittle pixel snapshots
  of every theme/scene permutation.

### Performance evidence

- Use the Vite manifest to prove preview modules are dynamically reachable rather than initial
  entry imports.
- In a production browser, prove offscreen preview modules remain idle until the prefetch boundary,
  then load before becoming visible.
- Prove a loaded preview is not fetched or mounted again after scrolling away and back.
- Prove reserved canvases keep the user's scroll position stable while scenes resolve.
- Compare entry JavaScript against Phase 0; the lazy catalog must reduce initial preview code rather
  than move all previews into a larger eager manifest.
- Add no runtime lazy-loading library.

Closure: qualification is derived from the discovered catalog and remains complete when an item is
added or removed.

## Phase 7 — cut over, remove duplication, and qualify

1. Delete the old central specimen mappings and text-only registry inventory view once their
   discoverability is present in the generated catalog.
2. Remove stale imports, CSS selectors, tests, and generated inventory consumers owned only by the
   old renderer.
3. Keep `inventory.ts` only if it still provides generated runtime grouping; do not keep it as a
   second item census.
4. Wire `pnpm catalog:check` into root `pnpm check` and therefore `pnpm qualify`.
5. Run, in order:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm catalog:check
pnpm intake:check
pnpm registry:check
pnpm test:components
pnpm test:registry-behavior
pnpm playground:build
pnpm playground:test
pnpm package:qualify
pnpm registry:qualify
pnpm qualify
```

6. Compare package and registry outputs with Phase 0. Preview and fixture files must be absent, and
   product files must be byte-identical unless a separately reviewed upstream correction was
   required.
7. Perform an adversarial review as:
   - a component author adding a new runtime export;
   - a registry author adding a pattern with two scenes;
   - a keyboard and reduced-motion user;
   - a maintainer editing one source file through HMR;
   - a consumer installing the package and every registry item; and
   - a reviewer tracing every external source decision.
8. Update `LEDGER.md` with the exact implementation SHA and observed evidence. Do not mark complete
   for a queued CI run or a manually viewed subset.

Closure: all acceptance criteria pass, the ledger contains no open in-scope gap, and further changes
would be new catalog features or item-source work rather than completion of this migration.
