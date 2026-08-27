# Acceptance

All criteria below are closed by the evidence recorded in [LEDGER.md](./LEDGER.md).

## Inventory and authoring contract

- [x] Every public visual runtime export has exactly one canonical preview.
- [x] Every registry `component/*`, `pattern/*`, and `block/*` address has exactly one canonical
      preview.
- [x] The three current themes are applied environments and are not required to masquerade as
      component previews.
- [x] Every optional named preview resolves to one existing item and has a unique stable scene name.
- [x] A new visual export or registry item without a canonical preview fails `pnpm catalog:check`.
- [x] Missing, duplicate, orphaned, path-malformed, and accidentally distributed preview files
      produce address-specific diagnostics in one check run.
- [x] Invalid preview exports, canvas values, or provenance references fail playground
      typecheck/build or the generated render matrix.
- [x] Fixtures are optional; no empty or ceremonial fixture files exist.
- [x] Catalog grouping, counts, search, routes, and browser cases derive from package/registry
      authorities rather than another hand-maintained item list.
- [x] Existing TypeScript projects include every preview and fixture even though Vite discovers
      modules through globs.

## Source fidelity and regression safety

- [x] Runtime and registry component source remains exact under the existing upstream fidelity
      policy.
- [x] Canonical component examples resolve to pinned official shadcn/Base sources or recorded
      provider provenance.
- [x] Named external variants with different JSX/classes are separate sourced items, not disguised
      preview states.
- [x] Preview adaptation is limited to imports, deterministic data, controlled state, callbacks,
      formatting, and generic canvas selection.
- [x] No preview adds product colors, typography, borders, shadows, variants, DOM, icons, or defaults.
- [x] Preview JSX adds no unsourced `className`; playground-authored classes remain confined to the
      generic catalog shell and layout.
- [x] A defect encountered during previewing is recorded and repaired at its source owner; the
      preview contains no masking override.
- [x] Existing Spinner motion, Card borders/anatomy, Select alignment, Dropdown Menu and Menubar
      composition, pagination isolation, drawer backdrop/focus, and theme behavior remain covered
      and green.
- [x] Public exports, import paths, component props, registry addresses, installed targets, and CLI
      lock semantics are unchanged.

## Distribution boundary

- [x] `@astrale-os/ui` tarballs contain no preview, fixture, playground, or catalog source.
- [x] Built registry JSON and `astrale ui add` outputs contain no preview or fixture files.
- [x] The shadcn CLI remains absent from runtime dependencies.
- [x] No Storybook, router, lazy-loading library, second UI library, or icon library is added.
- [x] The SDK and its generators acquire no UI or catalog dependency.
- [x] Package and registry qualification pass from isolated consumers.

## Live catalog behavior

- [x] The sticky header exposes URL-backed Components, Patterns, and Blocks tabs with exactly one
      active catalog kind.
- [x] Component families have a stable semantic order, contain the public default exactly once,
      and contain every distinct sourced variant exactly once; pattern and block families have
      stable alphabetical order.
- [x] Ordinary navigation uses View family and a hidden left outline with exact family counts; no
      repeated per-card action consumes preview space. Direct isolation URLs remain available for
      debugging and qualification.
- [x] Search components composes owned Button, Kbd, CommandDialog, and controlled command-palette
      pattern surfaces; Cmd/Ctrl+K, click, filtering, keyboard selection, Escape, and Back focus
      restoration work against the exact unique canonical family set on desktop and mobile.
- [x] The Back control and native browser Back restore the originating catalog anchor at the same
      viewport offset; direct deep links fall back inside the owning catalog kind.
- [x] Viewport block canvases preserve sourced maximum widths, center constrained blocks, and let
      unconstrained blocks use the available width on desktop and mobile.
- [x] Overview pages show the canonical preview for every item.
- [x] Family pages show every item and every named scene in that family.
- [x] Each preview has an isolated URL and can load without importing unrelated scenes.
- [x] Command search works from descriptors before previews load and does not eagerly import
      offscreen results.
- [x] Each scene owns its state; interacting with one scene does not alter another.
- [x] Demonstration forms, pagination, and links do not reload, navigate, or scroll the playground
      unexpectedly.
- [x] A preview render failure is contained to its canvas, communicates the error accessibly, and
      retries without resetting other scenes. A failed ESM module fetch is contained and offers a
      document reload because browsers cache failed module imports for the document lifetime.
- [x] Loaded preview state survives ordinary catalog rerenders and scroll-away/scroll-back.
- [x] Overlays, portals, menus, drawers, and tooltips are visible and are not clipped by catalog
      wrappers.
- [x] The existing theme drawer updates every loaded preview live and preserves edit, undo/redo,
      save, import, export, close/reopen, and focus-restoration behavior.
- [x] Existing source and theme CSS edits hot-update without a page reload; adding/removing a preview
      is discovered without restarting the developer command.

## Lazy loading and performance

- [x] Vite's production manifest proves preview modules are dynamic descendants, not eager entry
      imports.
- [x] Initially visible previews load immediately; distant previews remain idle until they approach
      the viewport.
- [x] A modest forward prefetch boundary loads normal scroll targets before they become visible.
- [x] One shared `IntersectionObserver` serves catalog cards; no per-card scroll polling exists.
- [x] Preview loaders and resolved component types are stable and are not redeclared during ordinary
      React renders.
- [x] A loaded preview is not refetched or remounted merely because it leaves and re-enters the
      viewport.
- [x] Reserved canvas geometry prevents material scroll jumps while preview code resolves.
- [x] Direct preview URLs bypass scroll gating and reach ready state promptly.
- [x] Initial production JavaScript is lower than the Phase 0 eager-specimen baseline; any contrary
      result is investigated rather than accepted without evidence.
- [x] Desktop and 390-pixel mobile views have no horizontal page overflow.

## Accessibility

- [x] Every preview canvas is a labelled region with a stable heading present before loading.
- [x] Idle placeholders are not focusable or repeatedly announced.
- [x] Requested loading uses `aria-busy`; readiness does not steal focus or move scroll position.
- [x] Error and retry controls have accessible names and work by keyboard.
- [x] Repeated scenes have no duplicate IDs, label collisions, or cross-scene descriptions.
- [x] Keyboard operation and focus restoration remain correct for overlays, disclosures, menus,
      forms, carousels, calendars, sidebars, and the theme drawer.
- [x] Reduced-motion behavior remains exact, including the deliberately continuous Spinner.
- [x] Every loaded family page has no critical or serious automated WCAG A/AA violations under each
      released theme in light and dark mode.
- [x] Desktop and mobile browser matrices finish with no page error or unexpected console warning.

## Qualification and completion

- [x] Static parser/checker tests cover positive and adversarial paths.
- [x] Browser smoke cases are generated from discovery and mount every canonical and named preview.
- [x] Focused interactions cover the representative stateful component, pattern, and block families.
- [x] Family screenshots are retained for desktop and mobile review without introducing a brittle
      all-theme pixel-baseline matrix.
- [x] Existing complete repository qualification passes without weakened assertions.
- [x] Package and registry artifacts are compared with the recorded Phase 0 baseline.
- [x] An adversarial implementation, authoring, accessibility, performance, source-provenance, and
      consumer review is complete.
- [x] [LEDGER.md](./LEDGER.md) records exact SHA, commands, observed counts, artifacts, and any
      external blocker; no in-scope row remains `planned`, `in-progress`, or `blocked`.
