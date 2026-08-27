# Theme Studio V2 delivery ledger

## Source authority

| Surface | Authority | Intake rule |
| --- | --- | --- |
| Color picker | Adobe React Aria registry `tailwind-colorpicker`, version `1.20.0` | Exact 10-file source; owned imports and formatting only |
| Starter themes | Shadcn Studio public theme registry, snapshot `2026-08-27` | Exact published token values projected into Astrale Theme Document V2 |
| Observatory focus | Official shadcn `@shadcn/theme-zinc` registry item | Exact low-chroma light/dark `ring` and `sidebar-ring` values; component classes unchanged |
| Theme behavior | Astrale Theme Document and public registry contracts | Deterministic schema, migration, CSS projection, and install proof |

Color-picker source digest:
`sha256:43069e33d32ac73f0e91f6994ab7fa6cc3148c88907ff47593588bde99061dbe`.

## Delivery status

| ID | Status | Acceptance | Evidence |
| --- | --- | --- | --- |
| TH-P1 | complete | Source-faithful owned color picker | 10 provider snapshots; fidelity test; registry build and external install |
| TH-P2 | complete | Theme Document V2 | schema, deterministic V1 migration, CSS projection, contract tests |
| TH-P3 | complete | Rich live editor | 32 colors across both modes; heading/body/mono; geometry, density, effects, motion |
| TH-P4 | complete | Starter library | 9 Shadcn Studio themes plus 3 Astrale themes; automatic discovery of all 12 |
| TH-P5 | complete | Performance and accessibility | drawer-only dynamic studio chunk; desktop/mobile theme and keyboard journeys |
| TH-P6 | complete | Distribution proof | 74 registry items and 84 owned files installed into a clean external project |

## Preset inventory

| Source | Themes |
| --- | --- |
| Shadcn Studio | Art Deco, Claude, Clean Slate, Ghibli Studio, Marshmallow, Marvel, Modern Minimal, Neo Brutalism, Spotify |
| Astrale | Atelier, Observatory, Terminal |

## Qualification evidence

| Date | Proof | Result |
| --- | --- | --- |
| 2026-08-27 | `pnpm check` | repository contracts, source fidelity, typecheck, lint, and catalog checks green |
| 2026-08-27 | theme editing Playwright journey | color picker, history, typography, randomize, persistence, import, and export green |
| 2026-08-27 | 12-theme accessibility matrix | structural checks green for all exact themes; Astrale presets also meet the repository contrast gate |
| 2026-08-27 | public production build | 113 dynamic previews, 0 Studio previews, 520,352/600,000 initial raw bytes |
| 2026-08-27 | internal production catalog | 1,015 dynamic previews, 902 Studio previews; all 902 mount on desktop and mobile |
| 2026-08-27 | deterministic package qualification | repeatable 59,456-byte tarball; external pnpm and npm consumers green |
| 2026-08-27 | public registry qualification | 74 items, 84 installed files, strict external TypeScript green |
| 2026-08-27 | Observatory focus regression | official Base Input source comparison, live computed-style/screenshot, editable-token browser journey | shadcn `ring/50` anatomy retained; neutral Zinc tokens applied in both modes and remain configurable |

## Explicit source constraint

Some exact Shadcn Studio presets publish color pairs that do not pass the repository's strict WCAG
contrast assertion. They remain exact by design. CI still rejects serious structural accessibility
violations for every starter and applies the full contrast gate to Astrale-owned presets. Changing an
upstream preset requires a new sourced intake, not an undocumented local color decision.
