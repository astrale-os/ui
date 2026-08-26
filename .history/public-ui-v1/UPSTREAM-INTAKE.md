# Upstream intake and fidelity ledger

Status: locked on 2026-08-26.

## Outcome

Astrale UI classifies and owns upstream artifacts without rewriting their visual or behavioral
design. Shadcn is the first provider, not the architecture. A provider address such as
`@shadcn/button`, `@ss-components/input-02`, a registry URL, or a future Astrale source resolves
through the same provenance and disposition record.

## Mechanical authority

- `schemas/upstream-crosswalk.schema.json` defines the provider-neutral record.
- `tooling/upstream/providers/shadcn/4.18.0/catalog.json` is the exact global plus Base/Nova union.
- `tooling/upstream/providers/shadcn/4.18.0/crosswalk.json` classifies every address as component,
  pattern/block input, specimen, headless source, theme asset, or upstream internal.
- `tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json` binds every emitted source to
  an exact digest and Astrale owner.
- `tooling/upstream/providers/shadcn/4.18.0/base-nova/components/` retains the exact CLI output.
- `scripts/upstream-fidelity.test.mjs` proves every owned runtime and registry component is
  derivable from those sources.

The superseded `upstream-components.legacy.tsv` hashed broad Astrale directories and could not prove
that an exact upstream artifact existed. It must never be used for completeness or fidelity claims.

## Closed baseline

The shadcn CLI returns different catalogs with and without a Base/Nova project context. Therefore a
single unscoped `search` result is not complete.

| Scope | Addresses |
| --- | ---: |
| Global `@shadcn` | 471 |
| Base/Nova project | 216 |
| Unique union | 543 |
| Union `registry:ui` | 63 |
| Emitted Base/Nova UI sources | 62 |
| Fileless Base/Nova UI addresses | 1 (`@shadcn/form`) |
| Runtime component owners | 50 |
| Consumer-owned registry components | 12 |

The union contains 100 blocks, 305 examples, 63 UI entries, 52 fonts, 13 internals, five themes,
two styles, one component, one hook, and one library item. Examples are specimens, not automatically
patterns. Blocks remain blocks. Provider UI entries remain components even when a higher Astrale
pattern composes them.

## Allowed adaptation

For an ingested component, Astrale may only:

1. rewrite provider-local imports to semantic private runtime imports or public registry imports;
2. format source mechanically;
3. remove an import proven unused by Astrale's compiler configuration;
4. route files into semantic runtime owners or exact `component/*` registry addresses; and
5. declare the exact external dependencies and operational styles required by the source.

Astrale may not change component classes, variants, icons, DOM anatomy, default values, state
contracts, prop contracts, or composition decisions during intake. Product changes must happen
later as explicit Astrale-owned revisions with their own review, never disguised as normalization.

## Operational support sources

Base/Nova components require `shadcn/tailwind.css`; it is vendored verbatim and compiled through
`theme.css`. Native default normalization requires Tailwind Preflight; it is vendored verbatim and
exposed only through opt-in `reset.css`. Both are digest-qualified. The shadcn CLI is not a runtime
dependency.

## Refresh and proof

```bash
pnpm intake:refresh
pnpm intake:apply -- /absolute/path/to/qualified-shadcn-project
pnpm runtime:sync
pnpm intake:check
```

`intake:refresh` is networked and intentionally updates the committed catalog for review.
`intake:apply` must point at a clean project initialized with the pinned profile and populated via
qualified CLI commands. It regenerates registry components, public runtime exports, and playground
inventory. `intake:check` is offline and rejects source, digest, disposition, runtime, or registry
drift.

## Third-party providers

Third-party intake must preserve the exact provider address and source proof. The CLI may delegate
resolution to the upstream registry protocol, but Astrale classification and installation cannot
special-case the `@shadcn` namespace. A future `astrale ui add @ss-components/input-02` therefore
resolves, records, and installs that address without relabeling it as an Astrale-authored component.
