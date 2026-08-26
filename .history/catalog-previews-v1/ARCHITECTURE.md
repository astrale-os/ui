# Architecture

## Responsibility map

| Owner                                                         | Owns                                                                                 | Does not own                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `packages/ui`                                                 | Runtime component source, public exports, exact upstream fidelity                    | Catalog loading or preview fixtures       |
| `packages/ui/previews`                                        | Development-only runtime-component previews and fixtures                             | Runtime implementation or package exports |
| `registry/components`, `registry/patterns`, `registry/blocks` | Installable source plus adjacent development-only previews and fixtures              | Catalog navigation or theme state         |
| `registry/registry.json`                                      | Exact first-party registry item inventory and canonical addresses                    | Preview modules or catalog layout         |
| `playground/src/catalog`                                      | Discovery, descriptor normalization, grouping, lazy rendering, search, and isolation | Component styling or installable source   |
| `playground/src/theme`                                        | Existing live theme workspace and drawer                                             | Catalog inventory                         |
| `scripts/check-catalog-previews.mjs`                          | Closed-set, path naming, and distribution-boundary checks                            | TSX module contents or browser behavior   |
| Playwright                                                    | Generated render, lazy-load, interaction, accessibility, and responsive evidence     | Product source truth                      |

The registry manifest and package exports remain product authorities. Preview filenames are the
development evidence joined to those authorities; they never become another product inventory.

## Target layout

```text
packages/ui/
  previews/
    button/
      button.preview.tsx
      button.variants.preview.tsx
      button.fixture.ts                 # optional

registry/
  components/
    carousel/
      carousel.tsx
      carousel.preview.tsx
      carousel.autoplay.preview.tsx
      carousel.fixture.ts               # optional
  patterns/
    chart/
      line-basic.tsx
      line-basic.preview.tsx
      line-basic.empty.preview.tsx
      line-basic.fixture.ts             # optional
  blocks/
    dashboard/
      overview.tsx
      overview.preview.tsx
      overview.fixture.ts               # optional

playground/src/catalog/
  inventory.ts                          # existing generated runtime grouping
  previews.ts                           # glob discovery and descriptors
  preview.tsx                           # observer, module loading, canvas, and error boundary
  catalog.tsx                           # generic family/search rendering

scripts/
  check-catalog-previews.mjs            # one offline closure check
```

Runtime preview files live outside `packages/ui/src` so the package compiler and emitted archive
cannot accidentally acquire development dependencies. Registry previews stay beside their source
because registry manifests already enumerate installed files explicitly. Both locations remain
private and are excluded from the public package and generated registry payloads.

No additional directory is introduced until one of these three catalog files gains a distinct
owner. The implementation may keep a small error-boundary class or observer helper inside
`preview.tsx`; it should not create a helper tree for single-use functions.

## Preview filename contract

For item subject `<item>`:

```text
<item>.preview.tsx             required canonical scene
<item>.<scene>.preview.tsx     optional named scene
<item>.fixture.ts              optional shared deterministic data
```

Rules:

1. The canonical scene is inferred from `<item>.preview.tsx`; no `default: true` metadata exists.
2. `<scene>` is a stable lower-case kebab name such as `variants`, `disabled`, `empty`, or
   `controlled`.
3. A preview module default-exports one React component with no required props.
4. Preview-local state belongs inside that component. State is never shared implicitly between
   scenes.
5. A fixture is added only when data is reused or large enough to obscure the example. There is no
   mandatory fixture file.
6. Optional metadata is limited to a finite canvas hint and an existing provenance reference:

```tsx
export const preview = {
  canvas: 'compact',
  source: 'shadcn/base-nova/button-demo',
} as const
```

7. Labels, family, canonical address, and scene identity are inferred. Preview authors do not repeat
   registry descriptions or counts.

The supported canvas hints are deliberately small:

| Canvas     | Use                                                                      |
| ---------- | ------------------------------------------------------------------------ |
| `compact`  | Alerts, badges, buttons, toggles, and similarly bounded specimens        |
| `panel`    | Forms, menus, tabs, calendars, and ordinary interactive compositions     |
| `wide`     | Charts, tables, carousels, sidebars, and horizontally meaningful content |
| `viewport` | Application blocks that need the available catalog viewport              |

`panel` is the default. The canvas controls only playground layout; it cannot set product colors,
typography, borders, shadows, or component internals.

## Discovery and identity

The playground uses two literal Vite globs:

```ts
const runtimePreviews = import.meta.glob('../../../packages/ui/previews/**/*.preview.tsx')
const registryPreviews = import.meta.glob('../../../registry/**/*.preview.tsx')
```

Vite's default glob behavior preserves each loader as a dynamic import and splits lazy modules at
build time. A normalization pass derives:

```ts
type PreviewDescriptor = {
  address: string
  scene: string
  canonical: boolean
  defaultCanvas: 'panel' | 'viewport'
  load: () => Promise<PreviewModule>
}
```

`PreviewDescriptor` is private playground vocabulary. It is not exported from `@astrale-os/ui` and
is not serialized into registry JSON.

The unloaded descriptor uses `panel` for components and patterns and `viewport` for blocks. Optional
module metadata may select `compact` or `wide` after the module is requested. Discovery and search
never load a module merely to read metadata. The observer prefetch boundary lets that adjustment
settle before an ordinary scroll target is visible; browser evidence rejects a user-visible scroll
jump.

Identity is stable and semantic:

```text
component/button#default
component/button#variants
pattern/chart/line-basic#default
block/dashboard/overview#empty
```

Runtime public exports map to `component/<subpath>` only inside the playground. Registry addresses
come directly from `registry/registry.json`. The checker rejects paths that cannot resolve exactly;
it never guesses an item from a title.

## Closed-set law

At qualification time:

```text
runtime visual exports
+ registry component/pattern/block addresses
= canonical preview addresses
= catalog canonical entries
= generated canonical browser smoke cases
```

Additional named previews must form a unique `(address, scene)` set and resolve to an existing
visual item. Themes are excluded from the canonical-preview side because they are environments
applied to previews. Future registry hooks, libraries, fonts, and other nonvisual items are
classified explicitly by their registry type rather than forced to render or silently ignored.

The checker reads the package manifest, generated runtime inventory, registry manifest, and file
paths. It reports every missing, orphaned, duplicate, path-malformed, or accidentally distributed
file in one run. It does not import or parse component JSX. Preview default exports, canvas values,
and provenance references are admitted when Vite loads the module and are exhaustively exercised by
the generated browser matrix.

## Lazy rendering lifecycle

Each catalog card has this local lifecycle:

```text
idle -> loading -> ready
                   |
                   -> render-error -> retry -> ready

idle -> loading -> module-error -> document reload
```

- The card's semantic shell and reserved canvas exist while idle.
- One shared `IntersectionObserver` starts loading when a card approaches the viewport.
- Directly opened previews and initially visible cards load immediately.
- The Vite loader resolves once into scene-local module state. The renderer does not declare a new
  component type during ordinary React renders, so catalog rerenders do not reset preview state.
- A loaded preview stays mounted while it remains in the current catalog result. Scrolling away does
  not unload or discard user state.
- Search and grouping operate on descriptors and do not eagerly import matching modules.
- Module-load failures and render failures are contained per scene. A render retry resets only its
  boundary. A failed ESM module fetch offers a document reload because browsers cache failed module
  imports for the lifetime of the document; it does not claim that the same loader can retry.
- No scroll, resize, or polling listener performs viewport math when `IntersectionObserver` is
  available.
- The initial implementation uses the browser API directly; no lazy-loading dependency is added.

The observer may prefetch a modest distance ahead so normal scrolling does not expose empty
canvases. Its threshold is tuned from browser evidence, not copied as a magic pixel constant.

## Catalog presentation

The overview renders one canonical preview per item. A family view renders every item and its named
scenes. An isolated address renders one scene at full available width for blocks, debugging, and
stable browser qualification.

Navigation uses native URL state and anchors; V1 does not add a router. Search, family selection, and
direct preview identity are linkable without allowing specimen links or pagination examples to
navigate the playground accidentally.

The shadcn/studio Alert gallery is a useful presentation reference for compact variations: many
small scenes can share a responsive grid. Astrale does not force that grid onto charts, calendars,
carousels, or blocks. Canvas hints choose the generic layout without adding preview-specific CSS.

V1 renders previews in the shared document rather than one iframe per card. This preserves live
theme variables, portals, hot reload, keyboard flow, and low overhead. `viewport` scenes render in
the isolated catalog address when they need the full shell. A future iframe mode requires a concrete
source incompatibility and its own accessibility/performance proof.

## Authoritative source policy

Preview migration must preserve the intake philosophy already enforced by Public UI V1.

Source priority:

1. The pinned official shadcn Base/Nova provider snapshot and its exact examples.
2. Current official shadcn component documentation when the example belongs to the pinned API.
3. A named external registry or source, such as shadcn/studio, only with an exact address or URL,
   version or revision, license, and digest recorded through the existing provider-provenance owner.
4. Existing Astrale-owned pattern/block source and its current tests when no upstream example owns
   that composition.

Allowed preview adaptation is mechanical:

- route imports to public Astrale entrypoints or the item beside the preview;
- provide deterministic data, controlled state, and no-op or observable callbacks;
- prevent demonstration links or forms from mutating the playground URL;
- format source and remove imports proven unused; and
- choose one generic catalog canvas.

Preview work may not:

- change item classes, variants, tokens, icons, DOM anatomy, defaults, or dependencies;
- add a `className` inside preview JSX unless it is preserved from an admitted exact example; only
  the generic catalog shell may author playground layout classes;
- add product styling to make a broken item look correct only in the playground;
- reconstruct source from a screenshot;
- treat shadcn/studio or another provider's distinct classes as a state of the official component;
  or
- hide a product defect behind a fixture.

If an authoritative example exposes a source defect, record it in [LEDGER.md](./LEDGER.md), repair
the owning item in a separate source-fidelity change, rerun its owner tests, and only then finish the
preview. The preview itself remains a truthful consumer.

Reference inputs:

- [shadcn component and registry index](https://ui.shadcn.com/llms.txt)
- [shadcn registry overview](https://ui.shadcn.com/docs/registry)
- [shadcn registry item contract](https://ui.shadcn.com/docs/registry/registry-item-json)
- [shadcn/studio Alert gallery](https://shadcnstudio.com/docs/components/alert?base=base)
- [Vite glob imports](https://vite.dev/guide/features.html#glob-import)
- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Base UI accessibility](https://base-ui.com/react/overview/accessibility)

## Accessibility contract

- Every card is a labelled region whose heading exists before its preview loads.
- Idle placeholders are not focusable and are not announced as repeated live updates.
- `aria-busy` is present only while a requested module is loading.
- Loading a preview never steals focus or changes scroll position.
- Skeletons and errors use public Astrale components; errors include a keyboard-operable retry.
- Preview state, IDs, labels, and descriptions remain local so repeated scenes do not collide.
- Overlay portals remain visible and are not clipped by the catalog canvas.
- Keyboard, focus restoration, reduced motion, accessible names, and serious/critical Axe checks
  remain part of browser qualification.
- Theme contrast is qualified by applying each released theme in light and dark mode to loaded
  family pages, not merely to an empty shell.

## Dependency direction and compatibility

```text
package exports -----------+
                           |
registry manifest ---------+--> catalog descriptors --> lazy preview renderer
                           |                              |
preview modules -----------+                              v
                                                browser qualification

theme workspace -----------------------------------------> loaded previews
```

Prohibited back-edges:

- runtime or registry source importing playground code;
- published package exports importing previews or fixtures;
- registry item `files` including previews or fixtures;
- preview metadata redefining registry title, description, dependencies, or address; and
- catalog code importing private runtime source instead of public package paths.

Existing public package exports, registry addresses, built registry JSON, theme artifacts, CLI
locks, and consumer installation behavior remain compatible and unchanged.
