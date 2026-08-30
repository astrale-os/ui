# Domain-needs UI request campaign

Status: **paused after DN-02 by user request; DN-03 through DN-10 remain queued**
Started: 2026-08-30  
Source revisions: `astrale-os/domains@bc6dda21`; campaign base `astrale-os/ui@14e3ffe5`

This ledger tracks ten source-backed UI needs through the complete production loop:

```text
public CLI request -> UI Domain -> GitHub issue -> maintainer admission -> managed agent
  -> one candidate PR -> revision-keyed playground evidence -> review revision(s)
  -> ordinary CI -> merge -> preview cleanup
```

The request describes product intent and observable behavior only. The managed agent still owns
authoritative public/MIT source discovery, immutable provenance, faithful mechanical adaptation,
classification, and generated registry/search/catalog output. No request authorizes invented visual
or CSS decisions.

## Intake selection

The needs below come from current Domain-owned UI surfaces. A lexical search was run against
`@astrale-os/ui@0.3.0-beta.16`; the recorded gap means no top candidate satisfies the complete need,
not that individual primitives are absent.

| ID | Domain evidence | Requested outcome | Search-gap observation | Issue | Agent/PR | Review | Merge |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DN-01 | `services/ui/blocks/secret-manager.tsx` | Secret manager with masked values, reveal/copy, add/update, and delete confirmation | unrelated reveal/spinner/carousel results | [#102](https://github.com/astrale-os/ui/issues/102) | [#115](https://github.com/astrale-os/ui/pull/115), final revision `c4aedaf8` | accepted: source fidelity, default and rejected-action scenes, full host-action loop, accessible names, token contrast, 390 px layout, no browser errors | `7fdef812` |
| DN-02 | `services/ui/blocks/log-stream.tsx` | Live log stream with severity filter, pause/resume, follow-tail, copy, and empty state | media controls and generic lists only | [#103](https://github.com/astrale-os/ui/issues/103) | managed attempts 1–3 failed closed; deterministic recovery [#121](https://github.com/astrale-os/ui/pull/121), final revision `6133e6c` | accepted: source fidelity, default/loading/empty/error/rejected scenes, interaction loop, 310/310 mobile containment, no browser errors, exhaustive CI | `2acc36f6` |
| DN-03 | `services/ui/blocks/recurrence-builder.tsx` | Recurrence/schedule builder with cadence, time, timezone, summary, and validation | timezone selectors only | [#104](https://github.com/astrale-os/ui/issues/104) | admitted; source pinned | pending | pending |
| DN-04 | `services/ui/blocks/master-detail-workspace.tsx` | Responsive master-detail workspace with searchable list, resizable inspector, and mobile detail navigation | resizable primitives only | [#105](https://github.com/astrale-os/ui/issues/105) | admitted; source pinned | pending | pending |
| DN-05 | `services/ui/service/endpoint.tsx`; `ai-gateway/ui/inference/ai-model-console.tsx` | API endpoint explorer with method/URL, editable request, response status/body, timing, and copy | status heatmap and unrelated controls | [#106](https://github.com/astrale-os/ui/issues/106) | admitted; source pinned | pending | pending |
| DN-06 | `ai-gateway/ui/catalog/ai-model-catalog.tsx` | AI model comparison surface for provider, modalities, context, capabilities, and price | pricing popover and generic cards only | [#107](https://github.com/astrale-os/ui/issues/107) | admitted; source pinned | pending | pending |
| DN-07 | `integrations/ui/catalog/integration-app-catalog.tsx`; `integrations/ui/connection/integration-connection-panel.tsx` | Integration catalog and OAuth connection-state panel with connect, refresh, revoke, and error states | generic connected cards/forms only | [#108](https://github.com/astrale-os/ui/issues/108) | admitted; source pinned | pending | pending |
| DN-08 | `issues/ui/inbox/issue-list.tsx`; `issues/ui/issue/issue-detail.tsx` | Issue triage inbox with priority, assignee, tags, state, selection, and activity thread | kanban/inbox/message pieces, no triage workspace | [#109](https://github.com/astrale-os/ui/issues/109) | admitted; source pinned | pending | pending |
| DN-09 | `grc/ui/charts/risk-matrix.tsx` | Accessible likelihood-impact risk matrix with populated cells, legend, selection, and detail callback | generic status heatmap only | [#110](https://github.com/astrale-os/ui/issues/110) | admitted; source pinned | pending | pending |
| DN-10 | `grc/ui/compliance/review-screen.tsx`; `grc/ui/compliance/programme-screen.tsx` | Compliance-control evidence review with checklist, owner/status, progress, evidence rows, and review actions | generic checklist progress only | [#111](https://github.com/astrale-os/ui/issues/111) | admitted; source pinned | pending | pending |

## Campaign gates

Each row closes only after all of the following are recorded:

- the issue was created by `astrale ui request`, not a direct GitHub bypass;
- accepted issue and PR comments are reflected in the next normalized agent attempt;
- source and license evidence are immutable and mechanically adapted without redesign;
- the same PR carries revision-keyed desktop and mobile screenshots plus a direct playground URL;
- the candidate is exercised in the browser for interaction, responsive layout, keyboard access,
  focus, browser errors, and exact revision identity;
- requested corrections, if any, update the same PR and refresh its evidence;
- ordinary repository CI is green before merge;
- merge closes the issue and scoped preview cleanup makes the old revision URL unavailable.

## Product defects

| ID | State | Defect | Resolution evidence |
| --- | --- | --- | --- |
| PD-01 | closed | The previously installed `ui.astrale.ai` Worker and Kernel callable disappeared, so the public prefix returned Kernel code `3001`. | New signing identity retained; Cloudflare Worker deployed; Admin catalog publication restored; the interrupted Admin provisioning operation was safely replayed with its retained operation ID; UI installed on ready instance `bryan`. |
| PD-02 | closed in [#113](https://github.com/astrale-os/ui/pull/113) | Beta.17 publication first exposed transform sampling ambiguity; a later parallel CI run showed that a background-throttled page can also retain a running animation at timeline position zero. | The stable semantic proof now requires the exact `spin`/`running`/infinite CSS contract and more than one distinct transform in the browser-compiled keyframes. Production spinner source and CSS remain unchanged. |
| PD-03 | closed in [#101](https://github.com/astrale-os/ui/pull/101) and live | The managed Kernel rejected a Domain-self mutation that used the private dependency-owned Shell User as a `request_owned_by` endpoint (`MUTATION_LOCATOR_INVALID`); omitting the required edge then correctly failed post-state validation. | V1 retains caller identity as required `ownerId`, matches it on every state transition, keeps Requests callable-private, and makes the unused observation edge optional. The rebuilt Domain installed and created all ten issues through the public CLI. |
| PD-04 | closed in [#113](https://github.com/astrale-os/ui/pull/113) | Qualification linted immutable upstream evidence as though it were Astrale-owned product code, rejecting faithful source bytes for provider-local unused imports. | `tooling/upstream/providers/**` is excluded from operational lint while adapted registry product code remains fully linted and fidelity-checked. |
| PD-05 | correction in [#116](https://github.com/astrale-os/ui/pull/116) | The implementation instruction made immutable-source fidelity explicit but did not state that a source-faithful inert control fails an accepted behavioral criterion. DN-01 revision 1 therefore qualified despite omitting add/update/copy/delete and requested operational states. | The base-controlled prompt now requires every observable acceptance item plus focused action/state, rejected-outcome, keyboard-name, and responsive tests while preserving source defaults and fidelity proof. |
| PD-06 | closed in [#117](https://github.com/astrale-os/ui/pull/117) | Credential-separated candidate qualification ran the repository contract but did not execute the candidate-owned registry behavior suite. DN-01 revision 2 was therefore published before its ambiguous checkbox query was exercised by ordinary CI. | Qualification now runs `pnpm check && pnpm test:registry-behavior` before any candidate branch is published; local proof and exhaustive repository CI passed before merge as `cc67abe0`. |
| PD-07 | closed in [#118](https://github.com/astrale-os/ui/pull/118) | Preview planning compared a revision only with the immediately preceding proposal SHA. A test-only correction therefore passed behavior qualification but lost the canonical previews introduced by earlier revisions and could not publish exact-revision evidence. | The worker now records the proposal branch's true merge base with main and plans evidence from that cumulative diff, retaining the same bounded preview identities across non-visual revisions; exhaustive CI passed before merge as `9b939b11`. |
| PD-08 | closed in [#119](https://github.com/astrale-os/ui/pull/119) | The 8 KiB single-comment body limit was also incorrectly used as the aggregate limit for all trusted issue and PR discussion. Ten legitimate review comments totaling 8.9 KiB made DN-01 attempt 9 fail admission and would force history deletion to continue. | The per-comment 8 KiB limit remains; a distinct bounded 32 KiB aggregate discussion limit now supports iterative review while the existing 64 KiB managed-objective and 65,535-byte dispatch bounds still fail closed. Exact boundary tests and exhaustive CI passed before merge as `89536880`. |
| PD-09 | closed in [#120](https://github.com/astrale-os/ui/pull/120) | Status Monitor manually assigned Tooltip popup IDs and `aria-describedby`, but Base UI owns its popup identity and documents the Tooltip as visual-only. The visible popup worked while the manual relationship intermittently referenced a nonexistent element, failing repeated exact-main playground runs. | Manual tooltip identity overrides were removed, trigger accessible names now include the same incident detail as the visual tooltip per official Base UI guidance, and the fidelity declaration records the exact operational adaptation. Focused desktop passed 5/5 and mobile 3/3 locally; exhaustive remote CI passed before merge as `dfe482ec`. |

## Evidence log

| Time (UTC) | Evidence |
| --- | --- |
| 2026-08-30 02:41 | Release PR #85 merged as `14e3ffe5`; beta.17 release and exact search-contract qualification started. |
| 2026-08-30 02:48 | Cloudflare deployment `d59dd19e-2425-45c8-a004-0fcb1cc1ae92` served a healthy `ui.astrale.ai` Publication; first adapter readiness observation encountered local negative-DNS cache after the provider effect. |
| 2026-08-30 02:54 | Admin catalog entry `@2e2270fa-738a-4c9a-953b-4bb40310eb7c` published for `ui.astrale.ai`; target instance reported `provisioning/reserve-tenant`. |
| 2026-08-30 02:59 | Replaying retained operation `cli.instance.create.06cbe067-adc6-46ee-9728-2958e6c122ae` advanced the same Instance to `ready`; catalog install then succeeded. |
| 2026-08-30 05:39 | Corrected Domain installed on `bryan`; `astrale ui request` created Request `4098ea8d-dc79-4d79-bcf3-af4e8cac119b` and GitHub issue #102 without caller GitHub credentials. The subsequently qualified exact source builds as `sha256:31f725246a2855f4a581e76a7f779f6a39082f66fc951786aee0738f0d692d38`. |
| 2026-08-30 04:04 | Requests #103–#111 were created through the same public CLI/Domain path; every issue received a verified immutable permissive source refinement before admission. |
| 2026-08-30 04:35 | PR #113 merged as `f7f29c44`; exhaustive CI passed. Release `v0.3.0-beta.18` published successfully to npm and the GitHub Packages mirror. |
| 2026-08-30 04:57 | DN-01 attempt 3 preserved upstream fidelity and reached candidate qualification. It exposed one mechanical nullable Base UI `Select` callback mismatch; the exact non-visual correction was added to accepted discussion for attempt 4. |
| 2026-08-30 05:33 | DN-01 attempt 4 qualified and published PR #115 revision `1937054d4155` with revision-keyed Pages evidence. Hosted desktop/mobile review rejected it: add/save and all row menu actions were inert, async feedback and accessible names were absent, and fixed-width source anatomy was clipped at 390 px. The exact observed failures were added to the same PR for attempt 5. |
| 2026-08-30 05:37 | PR #116 opened with the reusable managed-agent acceptance instruction correction; focused 122 request tests, formatting, and lint passed locally. |
| 2026-08-30 06:05 | DN-01 revision 2 `ba8e646e05cd` completed create, copy, update, reveal, confirmed delete, pending/success feedback, accessible names, value-safe confirmation, and a 390 px responsive browser traversal. Review still rejected it because the error outcome was test-only rather than independently hosted and exact upstream red/amber/emerald utility colors failed repository contrast checks. Ordinary CI also exposed a candidate-owned ambiguous checkbox query. All three corrections were accepted onto the same PR for attempt 6. |
| 2026-08-30 06:12 | PR #117 opened to close the qualification gap that allowed candidate registry behavior tests to run only after publication. |
| 2026-08-30 06:18 | PR #117 merged as `cc67abe0` after contracts on Node 24/26, package and registry, playground development and production traversal, Domain, security, CodeQL, and dependency review all passed. |
| 2026-08-30 06:29 | DN-01 attempt 7 mechanically corrected the Base UI checkbox query and passed the newly enforced registry behavior gate, but cumulative preview evidence planning rejected its test-only revision. PR #118 opened with focused 122-test proof for that request-system defect. |
| 2026-08-30 06:37 | PR #118 merged as `9b939b11` after package/registry and development/production playground traversal proved the cumulative-preview workflow correction. |
| 2026-08-30 06:44 | DN-01 attempt 8 passed pre-publication registry behavior and cumulative preview planning, then published exact revision `aabb09a2` with both default and rejected-action scenes. Hosted acceptance created a masked variable, observed pending/success and pending/error action feedback without value leakage, retained data after rejection, showed no 390 px overflow, preserved accessible names/focus, and reported no browser errors. |
| 2026-08-30 06:50 | DN-01 revision `aabb09a2` passed package/registry but ordinary desktop/mobile playground CI rejected six candidate Playwright label-substring selectors against Base UI's semantic and hidden controls. Exact role-based corrections were accepted for attempt 9. A separate generated-theme 4.48 contrast miss was not candidate-owned; concurrent exact-main CI independently showed a pre-existing status-monitor timing miss. |
| 2026-08-30 06:52 | DN-01 attempt 9 failed closed before dispatch because legitimate trusted discussion reached 8.9 KiB. PR #119 opened with exact per-comment and aggregate UTF-8 boundary tests to preserve review history and keep iteration bounded. |
| 2026-08-30 07:02 | PR #119 exhaustive CI repeated exact main's Status Monitor tooltip-ID failure. Official Base UI guidance and installed source confirmed Tooltip is visual-only and owns its popup identity; PR #120 opened with a source-fidelity-declared semantics correction and 5 desktop plus 3 mobile focused passes. |
| 2026-08-30 07:17 | PR #120 merged as `dfe482ec` after all package/registry, development/production playground, accessibility, Domain, and security gates passed. |
| 2026-08-30 07:23 | PR #119 rebased onto the tooltip correction and merged as `89536880` after every exhaustive gate passed, including a 4m38s clean playground traversal. |
| 2026-08-30 07:40 | DN-01 attempt 9 published final revision `c4aedaf8` with only the accepted semantic Playwright selectors changed from the product-approved revision. All ordinary CI passed, including a 6m58s exhaustive playground run; PR #115 merged as `7fdef812` and automatically closed issue #102. |
| 2026-08-30 07:41 | DN-01 cleanup workflow `33299747981` succeeded; its exact revision-keyed playground URL returns HTTP 404 after scoped Pages removal. |
| 2026-08-30 08:26 | DN-02 attempt 1 run `33299847753` completed its source-backed implementation and passed build, format, lint, typecheck, generated output, and Logpilot fidelity proof, then failed closed before publication: the registry manifest declared owned `log-utils.ts` and `types.ts` while those two implementation files were absent. The exact non-visual closure correction was accepted for attempt 2. |
| 2026-08-30 09:14 | DN-02 attempt 2 run `33301649120` spent 43m25s in managed implementation, closed the source-tree defect, and passed 23/25 registry behavior cases. It failed before publication only because two fake-timer tests hung inside `userEvent.click`; the inert candidate reproduced locally and passed both in 168ms when only those timer-bound clicks used synchronous Testing Library events. |
| 2026-08-30 09:49 | DN-02 attempt 3 run `33303736525` spent 28m35s in managed implementation but regressed the already-fixed `log-utils.ts` and `types.ts` ownership closure. No candidate was published. To stop repeated paid reconstruction, PR #121 deterministically replayed attempt 2's credential-free inert artifact plus the exact locally proven test-only correction. |
| 2026-08-30 09:50 | Azure Cost Management rejected spend and budget access for the signed-in AI-resource administrator. Azure Monitor token meters estimated Claude Opus 5 month-to-date consumption at `$142.46` using published global rates; the user raised the campaign stop ceiling from `$150` to `$200`. No later managed attempt was launched. Azure budgets are alerting rather than hard enforcement and require subscription Cost Management Contributor authority not held by this identity. |
| 2026-08-30 09:59 | PR #121 revision `f1b8530` passed package/registry and hosted interaction review, then exhaustive playground CI exposed an ambiguous text locator and a catalog-only wide-preview intrinsic-width defect. Imported Logpilot source/classes remained unchanged: the five preview fixtures received only `w-full min-w-0`, tests now exercise the authoritative expandable-row behavior, and the dedicated source-color audit remains separate from the global family audit. |
| 2026-08-30 10:12 | PR #121 revision `6133e6c` passed 18/18 provenance/registry contracts, 25/25 composition behavior cases, and all 14 focused desktop/mobile Log Viewer Playwright cases. Exact hosted evidence reports revision identity, 310/310 preview scroll/client width at 390 px, every toolbar control inside bounds, and no browser errors. Exhaustive ordinary CI remained in progress. |
| 2026-08-30 10:20 | PR #121 revision `6133e6c` passed all ordinary CI gates, including the 5m43s exhaustive development traversal and production playground pass. It merged as `2acc36f6`, automatically closed issue #103, and the exact revision-keyed Pages preview was removed as `bfe4729`; the old URL subsequently returned HTTP 404. Per user direction, the campaign stopped before DN-03 and no further managed model attempt was launched. |
| 2026-08-30 10:44 | Release PR #114 passed its independently dispatched exhaustive CI and exact current-CLI consumer qualification, then merged as `23b27c9e`. Trusted publication run `33306642505` published `@astrale-os/ui@0.3.0-beta.19` to npm with SLSA provenance and mirrored the same immutable version to GitHub Packages; both registries resolve the `beta` tag to beta.19. |
