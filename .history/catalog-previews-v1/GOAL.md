# Goal

Make the UI playground a complete live catalog that appears automatically as Astrale ships runtime
components, registry components, patterns, and blocks.

An author should provide the owned item plus one meaningful canonical preview. The playground must
derive grouping, search, navigation, lazy imports, theme application, and browser smoke coverage
without adding the item to a second central map.

## Required outcomes

1. Every visual item has exactly one canonical `.preview.tsx` module.
2. An item may have any number of named preview scenes for materially useful states, variants, or
   compositions.
3. Shared representative data may live in an optional `.fixture.ts` companion; trivial values stay
   in the preview.
4. Vite discovers previews automatically and emits them as lazy chunks. The browser loads a preview
   only when it approaches the viewport or is opened directly.
5. Registry and package inventories are closed against previews in CI. A missing, orphaned, or
   duplicate canonical preview fails before merge.
6. The existing theme drawer applies the current light/dark mode and portable theme to every loaded
   preview without remounting unrelated scenes.
7. Every preview is independently stateful and failure-contained. One broken scene must not crash,
   navigate, or reset the catalog.
8. Component and example fidelity remains source-backed. Preview work may not redesign defaults or
   repair source through local class, DOM, variant, or token decisions.

## Definition of an item and a preview

- An **item** is an independently owned and, for registry content, independently installable source
  surface.
- A **preview** is a development-only rendering of one item with deterministic data, state, and
  callbacks.
- A change to props, data, controlled state, or interaction is normally another preview.
- A change to the item's JSX anatomy, component classes, variants, defaults, or dependencies is not
  a preview. It is a new or revised sourced item and follows the upstream intake process.

Examples:

- Button sizes and documented variants are named previews of the same Button item.
- Calendar single, range, disabled, and controlled states may be previews when the same source owns
  them.
- A materially different Carousel implementation is a separate pattern or component item.
- A shadcn/studio Alert composition with its own markup and classes is a separately sourced registry
  item if Astrale chooses to ingest it; a screenshot is never copied into a preview as guessed code.

## Non-goals

- Publishing previews or fixtures in `@astrale-os/ui` or registry installations
- Adding Storybook, a router, a preview server, or another component library
- Inventing a general story DSL, controls inference, prop reflection, or automatic fixture synthesis
- Parsing arbitrary TSX to guess how a component should render
- Adding per-preview iframes or React roots by default
- Replacing owner behavior tests with catalog screenshots
- Creating new component styling while backfilling previews
- Treating third-party namespaces specially; provenance and classification remain provider-neutral
- Changing `astrale ui add`, portable themes, package exports, or public registry addresses
