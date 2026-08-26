# Public UI V1 migration

This directory is the durable design, migration, and qualification ledger for replacing the
legacy private UI workspace with one public Astrale UI product:

- `@astrale-os/ui` is the only public runtime package;
- lower-level reusable components are imported from that package;
- customizable patterns and blocks are installed as owned application source from this repository's
  shadcn-compatible registry; and
- `astrale ui` provides the first-party discovery, initialization, installation, and maintenance
  journey without making the SDK or the installed CLI depend on the UI runtime or shadcn.

This is temporal migration authority, not evidence that the target has been implemented. Current
source, package exports, registry manifests, tests, and release observations supersede these files
after cutover. The migration may not advance a gate merely because its planned files exist.

## Exact baselines

| Surface                | Ref or query                                                                 | Exact observation on 2026-08-25                   |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| UI source              | `astrale-os/ui` `origin/main`                                                | `d460f711c05e4f14f1467c7992e3193e0ceb913a`        |
| Astrale CLI            | `astrale-os/cli` `origin/main`                                               | `d8aa9d902c99513e34389d65a9a1aaa496083086`        |
| Astrale SDK            | `astrale-os/sdk` `origin/main`                                               | `c3a71076a103f6ed2be565fbda3f5c718e9fd2c5`        |
| shadcn CLI             | `pnpm dlx shadcn@latest --version`                                           | `4.18.0`                                          |
| shadcn project profile | pinned `shadcn init -b base -p nova` disposable intake                         | Base UI, Nova, Tailwind v4, React client components |
| Base UI                | `@base-ui/react` selected by the pinned intake                                 | `1.7.0`                                          |
| shadcn registry        | union of global and Base/Nova project-scoped search                           | 543 addresses; 63 `registry:ui` entries           |
| shadcn documentation   | [components index](https://ui.shadcn.com/docs/components)                    | 64 documented surfaces                            |
| public npm             | isolated direct `registry.npmjs.org` lookups outside the repository `.npmrc` | all six current names return `404`                |

The isolated authoring worktree is `/private/tmp/ui-public-v1-history-20260825`. The primary UI
checkout was dirty and behind `origin/main`; it was not modified.

## Locked product boundary

1. There is one public runtime package: `@astrale-os/ui`.
2. There is no public `ui-components`, `ui-styles`, `ui-utils`, `ui-constants`, `ui-preset`,
   `ui-patterns`, or `ui-blocks` runtime package in V1.
3. Package internals are organized by semantic owner, but those family names never leak into public
   import paths.
4. Public imports are `@astrale-os/ui`, `@astrale-os/ui/button`,
   `@astrale-os/ui/dialog`, `@astrale-os/ui/theme.css`, `@astrale-os/ui/reset.css`, and explicit
   preset CSS subpaths. There are no public `/internal`, `/action/button`, or source-file imports.
5. Patterns are families containing multiple installable types and variants. A directory named
   `chart` or `carousel` is never treated as one canonical chart or carousel.
6. Blocks are complete feature-region compositions. They may include view and headless/controller
   files, but they never own fetching, authentication, routing, persistence, or ambient application
   state.
7. Base UI is the V1 internal behavioral substrate. Its open-part, `render`-composition, accessible,
   unstyled philosophy governs Astrale wrappers, but its package paths are not public Astrale import
   paths or a theme axis.
8. A preset can change color, typography, density, radius, shadow, motion, and component character
   coherently. Components and registry source consume semantic tokens and stable `data-slot`
   anatomy rather than hard-coded brand values.
9. `@astrale-os/sdk` has no dependency, peer dependency, export, or runtime knowledge of UI.
10. `astrale ui` is a top-level CLI namespace, while the UI repository owns registry content and
    compatibility metadata. The CLI invokes an exact qualified shadcn CLI on demand instead of
    shipping shadcn or UI dependencies in `@astrale-os/cli`.
11. The migration is a clean cutover. Private packages are migrated and removed before the first
    public stable release; they do not become indefinite compatibility facades.

## Ledgers

- [GOAL.md](./GOAL.md) defines the execution outcome, completion boundary, non-goals, and working
  rules.
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) defines the concrete work packages,
  repository ownership, gates, review, and final handoff.
- [ARCHITECTURE.md](./ARCHITECTURE.md) owns the target layout, dependency direction, public package
  surface, theme system, and registry responsibility model.
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) owns the host override, open-part, render, class, style, and
  slot laws for runtime wrappers, patterns, and blocks.
- [decisions.tsv](./decisions.tsv) is the compact decision and open-blocker ledger.
- [UPSTREAM-INTAKE.md](./UPSTREAM-INTAKE.md) defines the provider-neutral intake and exact-fidelity
  contract. The committed catalogs, crosswalk, provenance, and source proofs under
  `tooling/upstream/providers/` are the mechanical authority.
- [upstream-components.legacy.tsv](./upstream-components.legacy.tsv) is the superseded 2026-08-25
  hand-maintained snapshot and is retained only as migration history.
- [REGISTRY-FAMILIES.md](./REGISTRY-FAMILIES.md) owns the pattern-family and block-family model,
  initial variant obligations, and registry item laws.
- [CLI-AND-SDK.md](./CLI-AND-SDK.md) owns the target `astrale ui` journey and the zero-weight SDK
  integration boundary.
- [DEFECTS.md](./DEFECTS.md) maps every material legacy audit finding to an owner and closure proof.
- [MIGRATION.md](./MIGRATION.md) owns the ordered cutover graph and phase termination gates.
- [ACCEPTANCE.md](./ACCEPTANCE.md) owns the complete product, package, registry, accessibility,
  visual, consumer, security, CI, and release acceptance criteria.
- [CI-AND-RELEASE.md](./CI-AND-RELEASE.md) owns the target workflow topology and final trusted
  publisher handoff.
- [CONSUMER-CENSUS.md](./CONSUMER-CENSUS.md) owns the refreshed live-consumer inventory and public
  npm cutover gate.
- [QUALIFICATION.md](./QUALIFICATION.md) records the exact local proof and remaining external gaps.
- [PREPUBLICATION-HANDOFF.md](./PREPUBLICATION-HANDOFF.md) records the final local cohort, artifact
  identity, evidence limits, and trusted V1 beta release sequence.
- [PUBLIC-BETA-LEDGER.md](./PUBLIC-BETA-LEDGER.md) supersedes prepublication status with the exact
  published cohort, delivery defects, merged owners, CI proof, and external Domain/View journey.

## Status vocabulary

- `observed`: exact baseline evidence was collected; no target claim is implied.
- `locked`: target design is decided and migration work may rely on it.
- `candidate`: a bounded design awaiting the named proof or owner decision.
- `blocked`: implementation must not proceed through the associated gate.
- `implemented`: source exists but has not completed its required evidence.
- `qualified`: the exact source revision passed every mapped local and CI proof.
- `published`: the exact tarball and registry release were independently observed.

Only evidence may change `implemented` to `qualified` or `published`.

## Current state

The public beta cutover is complete through the exact releases and evidence recorded in
`PUBLIC-BETA-LEDGER.md`. Earlier prepublication status paragraphs are retained as temporal evidence,
not current release state.
