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
| CP-D13 | locked | Public defaults and sourced variants share one exact component family without duplicate addresses | Makes the complete component surface visible without creating a second inventory |
| CP-D14 | locked | One hidden left outline replaces repeated per-card isolation actions | Preserves full catalog width while making every family directly reachable |
| CP-D15 | locked | Catalog command search lazily composes the owned controlled command-palette pattern and canonical preview descriptors | Keeps Cmd/Ctrl+K navigation homoiconic, prevents a private or duplicate search inventory, and keeps cmdk/Dialog out of the initial graph |

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
| CP-G08 | closed | One continuous overview makes components, patterns, and blocks hard to navigate | playground/catalog | Three derived URL-backed kind tabs plus complete browser regression |
| CP-G09 | closed | Runtime examples appeared as five small groups while 737 Studio variants were appended far below | playground/catalog | Exact family grouping places the public default first and every distinct variant after it; closed-set uniqueness passes |
| CP-G10 | closed | Repeated eye actions added noise after every sourced variant became visible | playground/catalog | Eye actions removed; View family plus the hidden outline own ordinary navigation; direct isolation URLs remain qualified |
| CP-G11 | closed | Large catalogs required keyboard-first cross-kind discovery without restoring a permanent navigation rail | playground/catalog | Owned CommandDialog and Kbd composition searches the exact canonical family set through Cmd/Ctrl+K; click, keyboard selection, Escape, and Back restoration pass on desktop/mobile |

## Defects encountered during implementation

Add rows; never repair product source inside a preview.

| ID  | Status | Observation                       | Exact source/reference | Owning fix | Closure proof |
| --- | ------ | --------------------------------- | ---------------------- | ---------- | ------------- |
| CP-B01 | closed | External preview add/remove did not invalidate Vite glob | playground/Vite | File watcher invalidates descriptor module and reloads | Live add/remove probe without server restart |
| CP-B02 | closed | Failed ESM imports cannot retry in the same document | catalog/error contract | Module failures offer reload; render failures retry locally | Unit and browser failure proofs |
| CP-B03 | closed | Preview classes changed published `theme.css` through automatic scanning | package/theme build | `source(none)` plus explicit runtime source root | Exact baseline comparison; only dead `.visible` utility removed |
| CP-B04 | closed | Generic child `max-width: 100%` overrode sourced block constraints such as `max-w-2xl` | playground canvas | Remove the high-specificity maximum; viewport canvas owns width and centering only | Live computed-style probe: Team 672px and Sign-in 448px, both centered |
| CP-B05 | closed | Production lazy proof assumed all catalog kinds remained in one DOM and was absent from PR CI | playground qualification | Keep the scroll journey inside Blocks, isolate direct-load proof in a fresh context, and run it in the playground CI job | `pnpm playground:test:production` green after an exact production rebuild |
| CP-B06 | closed | PR CI exercised the production browser against the preceding Studio build, so the public bundle budget was first evaluated by release publication | playground qualification | Route CI through the owning public build, chunk verifier, and browser command; calibrate the raw ceiling to the measured complete public catalog without changing the lazy boundary | Public 627,187 raw / 170,699 gzip under 650,000; Studio 778,103 raw / 181,344 gzip under 1,000,000 |

## Evidence log

Append exact observations. `planned` commands or queued CI runs are not evidence.

| Date       | Revision  | Scope           | Command or artifact                                                                       | Result                                                |
| ---------- | --------- | --------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 2026-08-26 | `e702761` | design baseline | Read current manifests, catalog source, browser tests, and Theme Studio/Public UI ledgers | Plan only; no implementation or qualification claimed |
| 2026-08-26 | `e702761` | baseline qualification | `pnpm qualify`, `pnpm package:qualify`, `pnpm registry:qualify` | Green; package 59,361 bytes/116 files/SHA `939dad…`; registry 64 items/digest `a88547…` |
| 2026-08-26 | `e656410` | catalog closure | `pnpm catalog:check` | 111 canonical items and 112 scenes; 8 non-ceremonial fixtures |
| 2026-08-26 | `e656410` | unit and contract proof | `pnpm check` | 38 contract tests and 2 playground unit tests green |
| 2026-08-26 | `e656410` | dev browser matrix | `pnpm playground:test` | 29 passed, one deliberate mobile skip; all 112 scenes mounted on desktop/mobile and six-theme family Axe matrix green |
| 2026-08-26 | `e656410` | production lazy proof | `pnpm playground:test:production` | Hashed chunk isolation, prefetch boundary, one fetch, and stable geometry green |
| 2026-08-26 | `e656410` | performance | `pnpm playground:build` | 112 dynamic entries; 585,560-byte complete initial JS graph versus 1,315,610-byte eager baseline |
| 2026-08-26 | `e656410` | distribution | `pnpm package:qualify`; `pnpm registry:qualify` | Beta.9 package 59,352 bytes/116 files/SHA `2cfc87…`; no preview files; registry digest unchanged `a88547…` |
| 2026-08-26 | `e656410` | artifact investigation | Exact baseline rebuild at `e702761`; CSS rule-set comparison | Package delta is only removal of dead `.visible` utility formerly admitted from non-runtime test text; runtime source scan is now explicit |
| 2026-08-26 | `e656410` | complete qualification | `pnpm qualify` | Green end to end after source-scan correction |
| 2026-08-26 | `e656410` | HMR and screenshots | `agent-browser` against port 4321 | Existing-file edit and add/remove scene update proven; `artifacts/playground/catalog-carousel-family{,-mobile}.png` retained |
| 2026-08-26 | `e656410` | adversarial review | Tests-reviewer critic and gap-finder, followed by two critic reruns | Final critic: no remaining critical or high test-quality issue |
| 2026-08-26 | `dc647b6` | catalog navigation follow-up | `pnpm qualify`; agent-browser; three-round tests-reviewer audit | Green: 32 browser passes, two deliberate viewport-neutral skips, one production-lazy pass, unchanged 59,352-byte/116-file package and registry digests; final critic found no issue |
| 2026-08-27 | local internal tree | component family integration | browser census plus public and internal closed-set Playwright assertions | 800 component previews visible; every public and Studio address occurs once under exactly one family on desktop and mobile |
| 2026-08-27 | local playground | outline navigation follow-up | agent-browser screenshot; desktop/mobile outline, family, native Back, focus, and lazy-geometry journeys | Hidden by default; exact family/count census; no per-card eye action; family jumps and restoration green |
| 2026-08-27 | local playground | command navigation follow-up | exact local Studio `command-10` composition; generated canonical family groups; focused desktop/mobile Playwright and agent-browser inspection | Search trigger uses owned Button/SearchIcon/Kbd, Cmd/Ctrl+K opens the owned controlled pattern, exact family count has no duplicates, and selection/Escape/Back focus journeys pass |
| 2026-08-27 | local playground | command navigation closure | `pnpm check`; focused desktop/mobile Playwright; public production build/chunk verifier; production lazy Playwright; three-round tests-reviewer audit | 40/40 contracts and 2/2 unit tests green; shortcut repeat/ownership/modal/focus and zero-preview-import search paths green; exact Calendar selection loads; command owner is a lazy chunk; initial graph 539,606/600,000 bytes; production lazy proof green; final critic found no issue |
| 2026-08-27 | `68b8010` release | publication preflight | Trusted Publish run `33103754214` | Correctly stopped before either registry publish: complete public catalog measured 627,187 raw bytes against the stale 600,000-byte ceiling |
| 2026-08-27 | local release fix | exact production boundaries | `pnpm playground:build`; `pnpm playground:test:production` | Studio: 1,015 dynamic previews, 902 provider previews, 58 family loaders, 778,103 raw / 181,344 gzip initial JS; public: 113 dynamic previews, no provider loaders, 627,187 raw / 170,699 gzip initial JS; production lazy browser proof green |

## Completion rule

Automated Catalog Previews V1 is complete only when:

1. every phase and coverage batch is `complete`;
2. every known target gap is closed;
3. every encountered defect is closed or explicitly transferred to an external owner without
   weakening catalog truth;
4. all acceptance criteria have exact evidence; and
5. the final implementation revision and remote CI state are recorded without claiming publication
   or deployment that was not observed.
