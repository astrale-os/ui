# Architecture

## Ownership

| Owner | Owns | Must not own |
| --- | --- | --- |
| `authority/*.xlsx` | Immutable user-supplied inventory | Status or implementation source |
| `inventory.json` | Exact row-normalized crosswalk and canonical addresses | Upstream source bodies |
| `.internal/shadcn-studio/upstream` | Verbatim registry responses by ID and profile | Astrale adaptations |
| `.internal/shadcn-studio/registry` | Mechanically adapted installable source and manifests | Runtime exports or design changes |
| `.internal/shadcn-studio/provenance.json` | Upstream/adapted digests and reversible transform evidence | Product prose |
| `scripts/studio-components/*` | Intake, validation, adaptation, registry generation | Item-specific JSX or class choices |
| `playground/src/catalog` | Existing discovery, lazy rendering, isolation, and navigation | Studio component implementations |
| `LEDGER.md` | Delivery status and exact proof references | Duplicate inventory |

## Address and layout law

Classification and family come only from the workbook. The mapping is mechanical:

```text
Component / Accordion / accordion-01
-> component/accordion/accordion-01

Pattern / Autocomplete / autocomplete-01
-> pattern/autocomplete/autocomplete-01

Block / Data Table / data-table-01
-> block/data-table/data-table-01
```

Local generated layout:

```text
.internal/shadcn-studio/
  upstream/base-nova/<id>.json
  registry/<components|patterns|blocks>/<family>/<id>/
    <upstream target files>
    <id>.preview.tsx
  manifests/<classification>/<family>.json
  provenance.json
  qualification.json
```

One upstream registry item may contain several files. All are retained with their declared type and
relative role. Shared upstream UI files are content-addressed and deduplicated only when their
formatted source digests are equal; a collision with unequal bodies fails intake.

## Runtime and distribution boundary

Studio variants are consumer-owned source, never `@astrale-os/ui` runtime exports. Existing runtime
components satisfy upstream imports where their source contract is exactly the pinned Base/Nova
owner. Otherwise the upstream item-local dependency is retained inside the internal registry.

The public `registry/registry.source.json`, `registry/public/r`, npm archive, and Git index do not
include `.internal/shadcn-studio`. The local registry builder composes the public registry snapshot
with the generated internal manifests only for local serving, playground use, and CLI qualification.

## Mechanical adaptation contract

Allowed transformations are finite and recorded per file:

1. Resolve the selected Base/Nova/Lucide output through shadcn CLI v4.
2. Route imports for exact Astrale runtime owners to public `@astrale-os/ui/<owner>` paths.
3. Resolve every remaining `@/` import against the exact CLI stage, recursively vendor that source
   into the item, and preserve its original install target. This compensates mechanically for
   missing Studio registry-dependency declarations without inventing an implementation.
4. Change output targets to `components/astrale/<canonical-address>.tsx`.
5. Bridge Studio's stale Vaul Drawer vocabulary to the selected official Base Drawer vocabulary:
   `direction` to `swipeDirection`, `top`/`bottom` to `up`/`down`, Vaul state attributes to Base
   state attributes, and the one direct Vaul `Content` part to Base `Popup`.
6. Normalize invalid React SVG attribute spellings to their React equivalents. This preserves the
   emitted SVG attributes while removing React runtime diagnostics.
7. Add only tooling-required directives or extensions that the shadcn CLI itself would emit.
8. Reverse all operational transforms and compare byte-for-byte with the resolved CLI source.

No class token, CSS declaration, JSX node, displayed string, animation, default value, or callback
behavior may change. The two profile/syntax bridges above may rename only equivalent operational
contracts; they may not choose a new value. A reverse transform must reproduce upstream source byte
for byte. A source that cannot satisfy that law stays failed; it is never repaired manually.

## Preview and fixture contract

The installed demo component is the canonical preview. There is no second hand-authored specimen.
Each workbook row already represents a distinct variant, so the variant ID is an item, not a named
preview scene. Additional preview scenes are admitted only when the authoritative registry item
itself provides them.

The existing catalog remains descriptor-first and lazy:

- search and family lists read metadata only;
- `IntersectionObserver` loads source near the viewport;
- loaded previews remain mounted;
- blocks receive the viewport canvas and other classifications default to panel;
- one failed item is isolated and cannot take down the catalog;
- direct addresses remain linkable and native back restores the prior anchor and scroll position.

Hydration is optional. A normal clean checkout discovers no Studio catalog and preserves the public
112-scene playground and its 600 KB raw initial-JavaScript budget. Local Studio mode discovers all
902 ignored previews, admits a 1 MB raw initial budget for their compact descriptor/import map, and
still requires every preview module to remain a dynamic entry outside the initial graph. Public
Playwright and production qualification explicitly use public mode; `pnpm studio:qualify` explicitly
uses licensed local mode.

## Replacement law

Existing Astrale-authored pattern/block source is never silently overwritten. The migration census
assigns exactly one disposition:

- `replace`: an authoritative Studio address has the same intended surface;
- `remove`: no authoritative source owns it and no external consumer requires compatibility;
- `retain-authoritative`: an existing non-Astrale source and fidelity proof already own it;
- `blocked-consumer`: a real consumer must migrate before removal.

Replacement happens only after the new address compiles, renders, interacts, installs, and records
its source proof. Compatibility aliases may contain addresses only; they may not retain old JSX.

## Qualification model

Every item receives cheap generated checks: identity, schema, source digest, import closure,
typecheck/build inclusion, canonical preview discovery, render-without-error, and clean CLI install
closure. Behavior and accessibility journeys are family-driven from upstream semantics, not one
invented generic click. Each of the 58 families has at least one keyboard and interaction journey;
all variants receive generated render and Axe smoke in desktop and mobile partitions. Animated
variants additionally prove motion in normal mode and reduced-motion behavior without asserting a
different design.
