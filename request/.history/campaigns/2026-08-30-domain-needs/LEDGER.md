# Domain-needs UI request campaign

Status: **active**  
Started: 2026-08-30  
Source revisions: `astrale-os/domains@bc6dda21`; `astrale-os/ui@14e3ffe5`

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
| DN-01 | `services/ui/blocks/secret-manager.tsx` | Secret manager with masked values, reveal/copy, add/update, and delete confirmation | unrelated reveal/spinner/carousel results | pending | pending | pending | pending |
| DN-02 | `services/ui/blocks/log-stream.tsx` | Live log stream with severity filter, pause/resume, follow-tail, copy, and empty state | media controls and generic lists only | pending | pending | pending | pending |
| DN-03 | `services/ui/blocks/recurrence-builder.tsx` | Recurrence/schedule builder with cadence, time, timezone, summary, and validation | timezone selectors only | pending | pending | pending | pending |
| DN-04 | `services/ui/blocks/master-detail-workspace.tsx` | Responsive master-detail workspace with searchable list, resizable inspector, and mobile detail navigation | resizable primitives only | pending | pending | pending | pending |
| DN-05 | `services/ui/service/endpoint.tsx`; `ai-gateway/ui/inference/ai-model-console.tsx` | API endpoint explorer with method/URL, editable request, response status/body, timing, and copy | status heatmap and unrelated controls | pending | pending | pending | pending |
| DN-06 | `ai-gateway/ui/catalog/ai-model-catalog.tsx` | AI model comparison surface for provider, modalities, context, capabilities, and price | pricing popover and generic cards only | pending | pending | pending | pending |
| DN-07 | `integrations/ui/catalog/integration-app-catalog.tsx`; `integrations/ui/connection/integration-connection-panel.tsx` | Integration catalog and OAuth connection-state panel with connect, refresh, revoke, and error states | generic connected cards/forms only | pending | pending | pending | pending |
| DN-08 | `issues/ui/inbox/issue-list.tsx`; `issues/ui/issue/issue-detail.tsx` | Issue triage inbox with priority, assignee, tags, state, selection, and activity thread | kanban/inbox/message pieces, no triage workspace | pending | pending | pending | pending |
| DN-09 | `grc/ui/charts/risk-matrix.tsx` | Accessible likelihood-impact risk matrix with populated cells, legend, selection, and detail callback | generic status heatmap only | pending | pending | pending | pending |
| DN-10 | `grc/ui/compliance/review-screen.tsx`; `grc/ui/compliance/programme-screen.tsx` | Compliance-control evidence review with checklist, owner/status, progress, evidence rows, and review actions | generic checklist progress only | pending | pending | pending | pending |

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
| PD-02 | correction in PR #101 | Beta.17 publication stopped because a moving spinner could be sampled at an identical transform even though CSS reported `spin`/`running`. | Motion proof observes advancement of the Web Animations clock while retaining the production spinner and its transform behavior. |

## Evidence log

| Time (UTC) | Evidence |
| --- | --- |
| 2026-08-30 02:41 | Release PR #85 merged as `14e3ffe5`; beta.17 release and exact search-contract qualification started. |
| 2026-08-30 02:48 | Cloudflare deployment `d59dd19e-2425-45c8-a004-0fcb1cc1ae92` served a healthy `ui.astrale.ai` Publication; first adapter readiness observation encountered local negative-DNS cache after the provider effect. |
| 2026-08-30 02:54 | Admin catalog entry `@2e2270fa-738a-4c9a-953b-4bb40310eb7c` published for `ui.astrale.ai`; target instance reported `provisioning/reserve-tenant`. |
| 2026-08-30 02:59 | Replaying retained operation `cli.instance.create.06cbe067-adc6-46ee-9728-2958e6c122ae` advanced the same Instance to `ready`; catalog install then succeeded. |
