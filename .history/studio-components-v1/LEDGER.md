# Delivery ledger

This is the only status authority. `inventory.json` owns item-level identity; generated
qualification owns item-level status. Never hand-maintain 902 status rows in Markdown.

## Locked authority

| Field | Value |
| --- | --- |
| Workbook | `authority/shadcn_studio_complete_component_registry_2026-08-26.xlsx` |
| Workbook SHA-256 | `6e6b6ea2c14f961a4dd1d68c654487459a7100f39f8ce61a6c1f910e84fd7285` |
| Verified date | 2026-08-26 |
| Rows | 902 |
| Families | 58 |
| Classification | 737 component / 148 pattern / 17 block |
| Animated | 68 |
| Upstream namespace | `@ss-components` |
| Profile | shadcn `4.18.0`, `base-nova`, Base UI, Lucide |
| Astrale baseline | `5324042f592e0a2ed0a9eda5bf8da971dfc66e9f` |
| Distribution | local/internal only; no commit or public artifact |

## Phases

| ID | Status | Scope | Closure evidence |
| --- | --- | --- | --- |
| ST-P0 | complete | Freeze workbook, validate rows, baseline, census | Authority report and exact baseline artifacts |
| ST-P1 | complete | Intake/check tooling and Accordion vertical slice | 16/16 source, fidelity, render, CLI proof |
| ST-P2 | complete | Fetch/adapt/generate all 58 families | Generated 902-item closed-set report |
| ST-P3 | complete | Disposition pre-existing Astrale compositions | No sibling consumer found; retained as explicit `consumer-source` compatibility, outside Studio authority |
| ST-P4 | complete | Complete lazy local catalog | 902/902 canonical desktop render; mobile rerun pending under ST-P6 |
| ST-P5 | complete | Registry and external-project qualification | Official build of all 902; clean CLI installs for Accordion, translated Drawer, and Data Table |
| ST-P6 | complete | Full qualification and adversarial review | Baseline `5324042f592e`; uncommitted isolated worktree; public and Studio proof green |

## Batch status

| Batch | Expected | Fetched | Adapted | Fidelity | Catalog | Qualified | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Accordion–Button Group | 187 | 187 | 187 | 187 | 187 | 187 | complete |
| Calendar–Context Menu | 127 | 127 | 127 | 127 | 127 | 127 | complete |
| Data Table–Input | 139 | 139 | 139 | 139 | 139 | 139 | complete |
| Input Mask–Navigation Menu | 64 | 64 | 64 | 64 | 64 | 64 | complete |
| Pagination–Scroll Area | 100 | 100 | 100 | 100 | 100 | 100 | complete |
| Select–Stepper | 137 | 137 | 137 | 137 | 137 | 137 | complete |
| Switch–Typography | 148 | 148 | 148 | 148 | 148 | 148 | complete |
| **Total** | **902** | **902** | **902** | **902** | **902** | **902** | complete |

## Open gates and defects

| ID | Status | Observation | Required closure |
| --- | --- | --- | --- |
| ST-G01 | closed | Public redistribution is incompatible with Studio's standard license terms | User constrained delivery to uncommitted local/internal use |
| ST-G02 | closed | All 902 licensed items resolved without process credentials | Raw and CLI-resolved closure is 902/902 |
| ST-G03 | closed | Current Astrale-authored patterns/blocks required an external consumer census | Workspace sibling census found no address consumer; compatibility items remain explicitly `consumer-source` and are not claimed as Studio authority |
| ST-G04 | closed | Previous preview path parser accepted only two-segment components | Generated descriptors admit exact three-segment workbook addresses |
| ST-G05 | closed | Studio Drawer variants emit Vaul contracts under the Base profile | Reversible vocabulary-only Base profile bridge; full typecheck green; physical right-side Drawer proof green |
| ST-G06 | closed | One Studio SVG used HTML-style React attribute names and emitted console errors | Reversible React spelling bridge preserves SVG output; browser console rerun is part of ST-P6 |
| ST-G07 | closed | Filtered cards could remain idle after moving into the viewport | Synchronous near-viewport admission complements the shared observer; exact search now reaches `ready` |
| ST-G08 | closed | Dev dependency discovery reloaded the page while the exhaustive lazy catalog was traversed | Internal qualification now serves the already-built production graph; no dependency scan can reset preview state |
| ST-G09 | closed | Studio support files and Astrale wrappers resolved separate Base UI and cmdk context owners | The playground resolver deduplicates both behavioral engines and declares cmdk explicitly; upstream item source is unchanged |

## Evidence

| Date | Revision/source | Scope | Evidence | Result |
| --- | --- | --- | --- | --- |
| 2026-08-27 | supplied workbook | workbook integrity | OOXML extraction, formula/cell validation, SHA-256, Quick Look render | 902 unique rows, 58 continuous families, exact audit equality; visual overview inspected |
| 2026-08-27 | `5324042` | repository baseline | manifests, package exports, registry tree, catalog preview contracts, CI workflows | 50 runtime components; 61 registry compositions plus 3 themes; 111 canonical items and 112 scenes per existing ledger |
| 2026-08-27 | live `@ss-components` | registry feasibility | shadcn `4.18.0 view` under Base/Nova profile | `accordion-01`, `accordion-16`, `alert-01`, and `button-55` returned structured source items successfully |
| 2026-08-27 | live `@ss-components` | raw and resolved closure | 902 raw item JSON files, 902 `shadcn add` Base/Nova resolutions, 1,008 declared files | 902/902; 944 unique targets; no unequal target collision |
| 2026-08-27 | generated internal registry | adaptation and source fidelity | syntax-aware import routing, reversible Base Drawer/React bridges, manifest equality, alias closure, and exact filesystem census | 902 items, 1,008 item files plus 75 exact CLI-resolved support files, 902 canonical previews; full TypeScript check green |
| 2026-08-27 | generated internal registry | official registry compilation | `shadcn@4.18.0 build` | 902 item JSON files plus registry index generated successfully |
| 2026-08-27 | isolated consumer | CLI ownership proof | official `shadcn add` over local registry, followed by strict TypeScript | Accordion 1, Drawer 7, Data Table 1, and dependency-bearing Card 13 installed into canonical owned paths and typechecked; Card 13 owns its Rating support file |
| 2026-08-27 | local playground | closed browser rendering | Playwright traversal of all workbook addresses | 902/902 lazy previews reached `ready` on desktop and mobile with zero page/console errors; post-support-closure desktop rerun green |
| 2026-08-27 | local playground | production lazy boundary | explicit `--studio` Vite manifest and initial graph verification | 902 Studio previews are dynamic and absent from the initial graph; 926,337/1,000,000 raw initial bytes |
| 2026-08-27 | clean public scope | no-license reproducibility | temporarily removed `.internal`, then ran `pnpm check`; explicit `--public` production verification rejects any Studio source or chunk | public checks green; 112 dynamic previews; zero Studio previews; 590,115/600,000 raw initial bytes; internal tests skip cleanly |
| 2026-08-27 | independent test review | critic and gap finder, followed by second critic | lazy precondition strengthened; install closure, manifest/build closure, stale-file closure, transform scope, optional hydration, and production lazy proof added | second critic: no findings |
| 2026-08-27 | internal production catalog | post-theme integration regression pass | production preview traversal after Base UI/cmdk resolver unification | all 902 Studio variants reached `ready` on desktop and mobile; filtered offscreen admission green in both projects |
