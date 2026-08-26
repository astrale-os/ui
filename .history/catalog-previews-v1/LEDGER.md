# Delivery ledger

This is the only status-bearing document for Automated Catalog Previews V1. Update a row only with
evidence from the exact implementation revision. Do not copy the item inventory into this file; the
future `catalog:check` report owns item-level closure.

## Locked decisions

| ID     | Status | Decision                                                                                       | Reason                                                          |
| ------ | ------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| CP-D01 | locked | One required canonical `.preview.tsx` per visual item                                          | Makes completeness mechanical without inferring props           |
| CP-D02 | locked | Zero or more `<item>.<scene>.preview.tsx` companions                                           | Supports real variants without creating false items             |
| CP-D03 | locked | `.fixture.ts` is optional                                                                      | Avoids ceremonial boilerplate for trivial data                  |
| CP-D04 | locked | Runtime previews live in `packages/ui/previews`; registry previews stay beside registry source | Keeps evidence owner-local while protecting the package archive |
| CP-D05 | locked | Vite `import.meta.glob` is the discovery mechanism                                             | Native lazy chunks, HMR, and no generated import map            |
| CP-D06 | locked | `IntersectionObserver` gates rendering near the viewport                                       | Scales without scroll polling or a dependency                   |
| CP-D07 | locked | Loaded previews stay mounted                                                                   | Preserves interaction state and prevents refetch churn          |
| CP-D08 | locked | Four generic canvas hints only                                                                 | Gives content enough space without preview-specific styling     |
| CP-D09 | locked | Themes are preview environments                                                                | Avoids fake theme component cards and exercises themes broadly  |
| CP-D10 | locked | Registry and package manifests remain product authorities                                      | Prevents a second catalog inventory from drifting               |
| CP-D11 | locked | No Storybook, router, iframe-by-default, preview DSL, or prop inference                        | Keeps V1 small and repository-native                            |
| CP-D12 | locked | External source changes follow exact provider provenance; previews never redesign source       | Preserves current intake and regression philosophy              |

## Current baseline

Observed on 2026-08-26 at `e70276104cd264189412a80e9622b4a3794f65aa`:

| Surface             | Total | Live today | Auto-discovered today |                 Target |
| ------------------- | ----: | ---------: | --------------------: | ---------------------: |
| Runtime components  |    50 |         50 |                     0 |  50 canonical previews |
| Registry components |    12 |         12 |                     0 |  12 canonical previews |
| Patterns            |    26 |          3 |                     0 |  26 canonical previews |
| Blocks              |    23 |          1 |                     0 |  23 canonical previews |
| Theme environments  |     3 |          3 |        not applicable | 3 applied environments |

The 45 pattern/block addresses without a live preview are inventory-only. The 62 component
specimens and four live pattern/block specimens are centralized in two files rather than owned
preview modules.

## Delivery phases

| ID    | Status  | Scope                                                           | Closure proof                                                               |
| ----- | ------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| CP-P0 | complete | Exact regression and performance baseline                       | Exact SHA, full qualification, artifact identities, screenshots, Vite sizes |
| CP-P1 | complete | Preview path contract and offline checker                       | Adversarial checker tests plus exact real gap report                        |
| CP-P2 | complete | Generic discovery, lazy canvas, isolation, and deep links       | Representative render/error/retry/lazy/HMR/browser proof                    |
| CP-P3 | complete | 50 runtime and 12 registry component previews                   | Closed component set, unchanged source/exports, focused interactions        |
| CP-P4 | complete | 26 pattern and 23 block previews                                | Closed registry visual set and family browser evidence                      |
| CP-P5 | complete | Overview/family/isolated presentation and theme matrix          | Navigation, theme, responsive, state-preservation proof                     |
| CP-P6 | complete | Generated browser, accessibility, and performance qualification | Descriptor-derived matrix and recorded artifacts                            |
| CP-P7 | complete | Remove manual renderers and complete repository qualification   | No stale authority, `pnpm qualify`, artifact comparison, review             |

## Coverage batches

This table tracks review-sized groups only. Item-level truth must come from `catalog:check`.

| Batch                                                    | Status  | Canonical items | Current live | Notes                                                       |
| -------------------------------------------------------- | ------- | --------------: | -----------: | ----------------------------------------------------------- |
| Runtime actions and inputs                               | complete |              16 |            16 | Controlled input, Select, Slider, and OTP journeys green   |
| Runtime content and feedback                             | complete |              14 |            14 | Card and Spinner regressions green                         |
| Runtime navigation and layout                            | complete |               9 |             9 | Pagination isolation green                                 |
| Runtime menus and overlays                               | complete |              11 |            11 | Dropdown Menu, Menubar, focus, and portals green           |
| Registry components                                      | complete |              12 |            12 | Exact provider provenance admitted                         |
| Patterns: calendar/carousel/chart/combobox               | complete |               8 |             8 | Canonical previews and interactions green                  |
| Patterns: command/data/date/form                         | complete |               8 |             8 | Controlled state and no product navigation proven          |
| Patterns: message/questionnaire/sidebar/toast/typography | complete |              10 |            10 | Canonical previews and family matrix green                 |
| Blocks: authentication/onboarding                        | complete |               7 |             7 | Deterministic form/actions green                           |
| Blocks: dashboard/data management                        | complete |               6 |             6 | Canonical previews and family matrix green                 |
| Blocks: communication/settings/application shell         | complete |              10 |            10 | Viewport and responsive matrix green                       |

## Known target gaps

| ID     | Status | Gap                                                                    | Owner               | Closure                                                       |
| ------ | ------ | ---------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| CP-G01 | closed | `component-specimens.tsx` centrally owns all component JSX and state   | playground/catalog  | 62 component previews discovered; central mapping removed     |
| CP-G02 | closed | `registry-specimens.tsx` hand-imports only four pattern/block examples | playground/catalog  | All 49 addresses discovered; central mapping removed          |
| CP-G03 | closed | Complete inventory proves listing, not live renderability              | catalog/checks      | Closed-set canonical and named browser matrix                 |
| CP-G04 | closed | Current page eagerly mounts the central component catalog              | catalog/performance | 112 dynamic entries; production viewport request proof        |
| CP-G05 | closed | One preview failure can invalidate the shared render surface           | catalog/isolation   | Scene-local module and render failure proofs                  |
| CP-G06 | closed | Preview source/example provenance is not a first-class admission rule  | upstream/catalog    | Generated pinned source map and exact runtime admission       |
| CP-G07 | closed | Browser tests are hand-authored against the current centralized layout | playground/tests    | Path-derived 112-scene desktop/mobile matrix                  |

## Defects encountered during implementation

Add rows; never repair product source inside a preview.

| ID  | Status | Observation                       | Exact source/reference | Owning fix | Closure proof |
| --- | ------ | --------------------------------- | ---------------------- | ---------- | ------------- |
| CP-B01 | closed | External preview add/remove did not invalidate Vite glob | playground/Vite | File watcher invalidates descriptor module and reloads | Live add/remove probe without server restart |
| CP-B02 | closed | Failed ESM imports cannot retry in the same document | catalog/error contract | Module failures offer reload; render failures retry locally | Unit and browser failure proofs |
| CP-B03 | closed | Preview classes changed published `theme.css` through automatic scanning | package/theme build | `source(none)` plus explicit runtime source root | Exact baseline comparison; only dead `.visible` utility removed |

## Evidence log

Append exact observations. `planned` commands or queued CI runs are not evidence.

| Date       | Revision  | Scope           | Command or artifact                                                                       | Result                                                |
| ---------- | --------- | --------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 2026-08-26 | `e702761` | design baseline | Read current manifests, catalog source, browser tests, and Theme Studio/Public UI ledgers | Plan only; no implementation or qualification claimed |
| 2026-08-26 | `e702761` | baseline qualification | `pnpm qualify`, `pnpm package:qualify`, `pnpm registry:qualify` | Green; package 59,361 bytes/116 files/SHA `939dad…`; registry 64 items/digest `a88547…` |
| 2026-08-26 | implementation tree | catalog closure | `pnpm catalog:check` | 111 canonical items and 112 scenes; 8 non-ceremonial fixtures |
| 2026-08-26 | implementation tree | unit and contract proof | `pnpm check` | 38 contract tests and 2 playground unit tests green |
| 2026-08-26 | implementation tree | dev browser matrix | `pnpm playground:test` | 29 passed, one deliberate mobile skip; all 112 scenes mounted on desktop/mobile and six-theme family Axe matrix green |
| 2026-08-26 | implementation tree | production lazy proof | `pnpm playground:test:production` | Hashed chunk isolation, prefetch boundary, one fetch, and stable geometry green |
| 2026-08-26 | implementation tree | performance | `pnpm playground:build` | 112 dynamic entries; 585,560-byte complete initial JS graph versus 1,315,610-byte eager baseline |
| 2026-08-26 | implementation tree | distribution | `pnpm package:qualify`; `pnpm registry:qualify` | Package 59,352 bytes/116 files/SHA `a7712b…`; no preview files; registry digest unchanged `a88547…` |
| 2026-08-26 | implementation tree | artifact investigation | Exact baseline rebuild at `e702761`; CSS rule-set comparison | Package delta is only removal of dead `.visible` utility formerly admitted from non-runtime test text; runtime source scan is now explicit |
| 2026-08-26 | implementation tree | complete qualification | `pnpm qualify` | Green end to end after source-scan correction |
| 2026-08-26 | implementation tree | HMR and screenshots | `agent-browser` against port 4321 | Existing-file edit and add/remove scene update proven; `artifacts/playground/catalog-carousel-family{,-mobile}.png` retained |
| 2026-08-26 | implementation tree | adversarial review | Tests-reviewer critic and gap-finder, followed by two critic reruns | Final critic: no remaining critical or high test-quality issue |

## Completion rule

Automated Catalog Previews V1 is complete only when:

1. every phase and coverage batch is `complete`;
2. every known target gap is closed;
3. every encountered defect is closed or explicitly transferred to an external owner without
   weakening catalog truth;
4. all acceptance criteria have exact evidence; and
5. the final implementation revision and remote CI state are recorded without claiming publication
   or deployment that was not observed.
