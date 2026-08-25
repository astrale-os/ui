# Consumer census

## Qualified implementation update

The authoritative post-migration cohort is recorded in
[PREPUBLICATION-HANDOFF.md](./PREPUBLICATION-HANDOFF.md): GUI `2ef24d6` has no legacy imports and
qualifies against packed public paths; Admin `6dfb012` and Domains `a5c51e9` remove the final stale
routing allowances; SDK `79a09d7` proves the zero-weight boundary; and CLI `47ae876` owns the
on-demand journey. No public npm lockfile claim is made before publication. The table below is kept
as the pre-implementation census that motivated those commits.

Snapshot: 2026-08-25. Each repository head was refreshed before this census.

| Repository | Exact `origin/main` | Live legacy files | Ownership and cutover |
| --- | --- | ---: | --- |
| `astrale-os/gui` | `ba1b2c9afd1fa9ed97de525c176a8ee9580a93de` | 17 | one manifest plus 16 source imports; migrate to public `@astrale-os/ui` only after npm publication so its committed lockfile resolves public metadata |
| `astrale-os/admin` | `e63e2d4248493779f4469153af86efd21ac63565` | 10 | one manifest, eight render/style sources, and workspace registry routing; migrate after GUI using packed/public topology |
| `astrale-os/domains` | `cd667d111da05b76c599ce60ba7d741994a40abb` | 1 | workspace registry routing only; remove the legacy exception after all authored Domain clients have moved |
| `astrale-os/sdk` | `32a398c7c932c717b540d8c3a342094c7c851a96` | 0 | no UI dependency, export, React declaration, or `sdk/ui` namespace is allowed |
| `astrale-os/cli` | `d8aa9d902c99513e34389d65a9a1aaa496083086` | 0 runtime dependencies | owns on-demand `astrale ui`; the packed CLI must not contain React, Base UI, Tailwind, shadcn, or the UI package |

The census excludes historical snapshots, generated worktrees, and archived debug copies. Those are
evidence, not supported package consumers.

## Publication boundary

The first public npm publication is a real gate, not paperwork. A supported consumer PR must commit
a lockfile whose `@astrale-os/ui` resolution and integrity come from the public npm registry. A
workspace link, temporary tarball locator, private GitHub Packages route, or manually authored lock
entry would not prove that topology and must not be merged.

Before publication, this repository proves the package using the exact produced tarball in a clean
external fixture. After publication:

1. migrate GUI against the published exact version and qualify its full supported suite;
2. migrate Admin and remove its UI source-scanning/private-registry exceptions;
3. remove the remaining Domains registry exception;
4. rerun the closed census across manifests, lockfiles, CI, source, tests, and documentation; and
5. enable generator `--ui astrale` only after that same public package and `astrale ui doctor`
   journey pass from an external generated project.
