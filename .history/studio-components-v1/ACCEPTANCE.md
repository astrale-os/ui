# Acceptance criteria

## Authority and completeness

- [x] Workbook digest equals the locked digest.
- [x] Inventory has exactly 902 unique IDs across exactly 58 families.
- [x] Family variant numbers are continuous and agree with Families & Audit.
- [x] Classification totals are exactly 737 components, 148 patterns, and 17 blocks.
- [x] Exactly 68 rows are animated and their stream is `Animated`.
- [x] Every command and source URL is structurally valid.
- [x] Workbook, normalized inventory, upstream responses, provenance, internal manifests, catalog
      canonical previews, CLI addresses, and qualification records form equal ID sets.

## Fidelity

- [x] Every upstream response and item source file has a SHA-256 digest; recursively required support
      files resolve to exact shadcn CLI stage snapshots.
- [x] Every emitted file is attributable to one workbook item and either its resolved item source or
      exact resolved support source.
- [x] Adaptations use only the finite operational transform set.
- [x] Reverse-adapted source equals upstream source byte for byte.
- [x] No manual class, CSS, DOM, text, behavior, animation, or product change exists.
- [x] Shared-file collisions fail unless contents are identical.

## Ownership and compatibility

- [x] `@astrale-os/ui` runtime entrypoints and public types are unchanged.
- [x] Every pre-existing Astrale-authored pattern/block has an exact disposition and consumer census.
- [x] Pre-existing compatibility compositions remain explicitly identified as `consumer-source`, not
      Studio authority.
- [x] No old address is removed before its consumers and replacement proof are closed.
- [x] Third-party registry passthrough remains provider-neutral.

## Catalog and performance

- [x] All 902 addresses appear under the workbook-derived Components, Patterns, or Blocks tab.
- [x] Each address has exactly one canonical preview sourced from the upstream item.
- [x] Search, family counts, direct links, eye action, and native Back restoration remain correct.
- [x] Preview chunks load near viewport, once, and stay mounted; a failure is item-local.
- [x] Blocks use available viewport space without overriding source constraints.
- [x] HMR updates changed variants and inventory without restarting the dev server.
- [x] All 902 preview modules remain production dynamic entries outside the initial graph; public and
      internal initial-JavaScript budgets are independently enforced.

## Behavior and accessibility

- [x] Every variant renders without console/page errors at desktop and mobile sizes.
- [x] Representative interaction journeys cover disclosure, selection, data-table state, stepper
      navigation, Drawer direction, overlays, focus restoration, forms, and catalog navigation.
- [x] The unchanged public foundation passes serious-violation Axe coverage across released theme
      modes; Studio markup and accessibility behavior remain authoritative source.
- [x] Authoritative animation classes and behavior are preserved byte-for-byte; Astrale introduces no
      animation override.
- [x] Preview controls do not navigate or reload the playground unless upstream semantics require
      navigation inside an isolated preview.

## Registry, CLI, and distribution

- [x] Every address passes official shadcn registry compilation, exact built-file equality, and
      per-item alias/dependency closure; representative simple, translated, block, and inferred-support
      items install with one command.
- [x] Representative installed output typechecks with declared and mechanically inferred dependencies.
- [x] Internal source is absent from Git index, npm pack, public registry build, source maps, logs,
      CI artifacts, and publication artifacts.
- [x] Public package file count and size remain within the recorded baseline budget.
- [x] Full public and local-Studio qualification plus the independent two-pass test review are green in
      the uncommitted isolated worktree.
