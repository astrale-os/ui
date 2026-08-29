# Request V1 ledger

This is the only status-bearing document for Request V1. Candidate prose elsewhere must not be
used to infer implementation or ratification.

## Decisions

| ID | Status | Decision | Evidence or remaining gate |
| --- | --- | --- | --- |
| RQ-D01 | candidate | `request/` owns intake semantics and deterministic evidence, not the agent runtime | Architecture review and ratification |
| RQ-D02 | accepted | Public V1 is only `astrale ui request <query> [--json]` | CLI API, parser, JSON, fallback, and help proofs pass |
| RQ-D03 | accepted | Opening a prefilled form yields a draft; submission creates the request | GitHub documents custom issue-form field prefills; CLI never claims creation |
| RQ-D04 | accepted | No public type, provider, license, model, or agent flag | CLI/form/workflow structural tests prove the boundary |
| RQ-D05 | accepted | GitHub issue owns collaboration state; trusted acceptance gates agent work; one linked PR owns the candidate | Manual trusted workflow, closed record, and one-PR laws implemented |
| RQ-D06 | candidate | Search Astrale first, then dynamic shadcn registries, then the wider public web | Agent protocol POC pending |
| RQ-D07 | candidate | Shadcn directory health is discovery evidence, never quality/license admission | Official API/directory docs and live degraded-provider POC |
| RQ-D08 | candidate | One retained intake record per request groups exact source, license, paths, outputs, and adaptations | Schema/checker POC pending |
| RQ-D09 | candidate | V1 automatically admits only exact MIT evidence; every other license blocks pending explicit policy | Maintainer/legal ratification |
| RQ-D10 | candidate | Mechanical adaptation never includes visual, DOM, behavioral, accessibility, or copy invention | Diff checker POC pending |
| RQ-D11 | candidate | Catalog/search/registry output remains generated from existing authorities | Existing closure checks; fixture POC pending |
| RQ-D12 | candidate | Screenshots are mandatory evidence; live preview uses a replaceable GitHub deployment URL adapter | Preview adapter selection pending |
| RQ-D13 | candidate | Candidate execution uses unprivileged `pull_request`; a fixed base publisher may transfer only admitted static bytes without execution | Adversarial workflow POC pending |
| RQ-D14 | candidate | Request PRs never publish; existing release owns publication | Current workflow census and end-to-end proof pending |
| RQ-D15 | accepted | Managed execution uses the narrow `request/agent` dispatch/observe/PR contract; provider selection is injected | Three adapters pass one shared contract; selected Actions/Claude Code/Foundry delivery completed live |
| RQ-D16 | accepted | GitHub request/PR is portable continuity; every review revision is a fresh normalized run | PR-targeted revision and provider replacement rules pass deterministic proof |
| RQ-D17 | accepted | A possibly accepted dispatch cannot retry/fail over; one branch has one non-terminal writer | Unknown-outcome, digest, timeout, canonical concurrency, and reconciliation proofs pass |
| RQ-D18 | accepted | The issue body plus bounded owner/member/collaborator comments form one accepted attempt snapshot; public and bot comments never enter the objective | Comment admission, limits, digest, and reconciliation proofs |
| RQ-D19 | accepted | One authorized `ui:ready` label starts or revises from the trusted record; status remains in the trusted comment | Workflow gate, actor-permission, concurrency, and auto-operation proofs |

## Investigation questions

| ID | Status | Question | Closing proof |
| --- | --- | --- | --- |
| RQ-Q01 | open | Is query-only sufficient, or does one bounded context/reference input materially improve requests? | Disposable form and real-request trials |
| RQ-Q02 | open | What Unicode-safe query/context bound avoids GitHub `414` while preserving useful intent? | Measured URL matrix at below/exact/above bound |
| RQ-Q03 | open | Which static host provides the smallest isolated, expiring PR preview adapter for this public repo? | Two-adapter operational comparison and one live POC |
| RQ-Q04 | open | Where should required MIT notices live so installed source and npm/package output both comply? | Schema and package/install fixture proof |
| RQ-Q05 | open | Can the checker mechanically distinguish imported source refreshes from ordinary owned edits without false positives? | Merge-base fixture matrix across add/update/delete/refactor |
| RQ-Q06 | accepted | What narrow credential can the agent use to push/open a PR without ever executing candidate code in that trust zone? | An environment-scoped publishing token exists only in a fresh fixed publisher job after credential-free qualification; live PR #59 proves the separation |
| RQ-Q07 | open | Should runtime-package additions be allowed in V1 or require a separate maintainer-approved request state? | Package-size/dependency and ownership review |
| RQ-Q08 | open | Is exact MIT-only automatic admission too narrow for the first real request? | Real candidate corpus; policy remains narrow until evidence says otherwise |
| RQ-Q09 | accepted | Which managed route qualifies production first? | GitHub Actions + Claude Code + Azure Foundry completed issue #54 through worker run `33248754603`, PR #59, and ordinary PR CI |
| RQ-Q10 | accepted | Can GitHub request metadata persist/recover an attempt without another store? | Closed trusted comment plus canonical workflow concurrency; cross-process CAS is explicitly not claimed |

## Evidence

| Date | Revision | Scope | Command or source | Result |
| --- | --- | --- | --- | --- |
| 2026-08-28 | `6f73c351c7ec2225fa9acbe7a7a4f444a40c43ce` | UI ownership census | `git status --short`; `git rev-parse HEAD`; `git rev-parse origin/main`; repository `rg` census | Clean local/origin main; existing generated registry/search/catalog owners and direct preview links identified |
| 2026-08-28 | external live | Shadcn directory/API | Native `fetch("https://ui.shadcn.com/r/registries.json")` count by health/license field | 290 entries: 231 healthy, 20 degraded, 5 observing, 34 unavailable; all had health and none had a top-level license field |
| 2026-08-28 | external live | Registry query behavior | `pnpm dlx shadcn@4.18.0 search @shadcn -q "command palette" -l 5 --json` | Completed in under one second with zero lexical matches; agent research cannot depend on one literal registry query |
| 2026-08-28 | external live | Provider resilience | `pnpm dlx shadcn@4.18.0 search @pureui -q button -l 5 --json` | Bounded 10-second connect timeout; documented programmatic `continueOnError` is required for multi-provider research |
| 2026-08-28 | authoritative docs | GitHub submission/evidence/security | GitHub issue-form URL, artifact, deployment environment, and `pull_request_target` security documentation linked in `POC.md` | Form prefills, artifact evidence, provider-neutral deployment URLs, and privileged untrusted-code risks established |
| 2026-08-28 | local candidate | Focused design conformance | Strict `tsc` on candidate API/state; `oxlint request`; repository `format:check`; relative-link/final-newline check; `git diff --check` | 14 candidate files; type, lint, formatting, link, newline, and whitespace checks passed |
| 2026-08-28 | authoritative docs | Managed coding API census | GitHub Copilot agent tasks, Jules REST, Cursor Cloud Agents V1, Devin V3, GitHub partner agents, and official OpenAI Codex/Workspace Agent docs | Common portable product boundary is repository dispatch, polling observation, and one PR; provider sessions/features remain adapter-private |
| 2026-08-28 | local implementation | Durable `request/.spec`, managed-agent child, GitHub request store, dispatcher, issue form, workflow, and focused tests | Managed execution is implemented without entering the runtime/package/SDK graph; the broader provenance and live-preview intake V1 remains independently unratified |
| 2026-08-28 | CLI isolated worktree at `3c94e2c84caa02dde393c679d8e88da1e7eb0966` | Request draft unit/command/program help tests and focused typecheck | 31 passed, one unrelated workspace-mirror test skipped; exact command surface and JSON draft journey green |
| 2026-08-29 | local implementation | Managed-agent shared contract, provider matrices, request dispatcher/store/schema/workflow, current primary provider docs, and two-agent adversarial review | All Critical/High local findings corrected; live GitHub creation still HTTP 412 and Cursor live proof remains unavailable |
| 2026-08-29 | CLI isolated worktree | Unicode 512/513 boundary, safe macOS/Linux/Windows launcher argv, browser fallback, direct action, full Commander parsing, exact help surface | 34 passed, one unrelated workspace-mirror test skipped; no GitHub SDK/token/package dependency added |
| 2026-08-29 | UI branch `feat/managed-ui-request-agent` at base `87072ac580c26ff7825af345816ec92f0bfc9ef1` | Full repository qualification | Exact final `pnpm check`, `pnpm test:security`, and `git diff --check` pass with 50 request tests, catalog 1014/1015 closure, registry 902/58 closure, and unchanged package/playground/search gates |
| 2026-08-29 | Azure and selected worker | Redacted production Luna/Opus calls, live Claude Code Foundry call, current GitHub workflow API, exact locked Claude Code CLI, 90 request tests | Inference, agent transport, neutral adapter, and isolated proposal/qualification/publication jobs are green without exposing secret values |
| 2026-08-29 | live request issue #54 | Coordinator run `33248736805`; worker run `33248754603`; disposable PR #59; native CI run `33248841797` | Default-branch dispatch recovered the exact durable run, created one intended-repository PR, and entered ordinary CI; every check passed, then the evidence-only PR and branch were deliberately closed rather than merged |
| 2026-08-30 | local implementation | Accepted maintainer discussion snapshots and authorized `ui:ready` execution | 109 focused tests, full `pnpm check`, security policy, UTF-8/count bounds, reconciliation safety, duplicate-record rejection, executable permission-gate fixtures, and manual recovery pass |
| 2026-08-30 | live request issue #87 | Label-triggered attempts 1 and 2 through coordinator runs `33279423951` and `33279567570` | Both labels passed the write-authority gate and were consumed; the durable records exposed empty accepted-comment IDs despite preceding member comments, so live qualification remained failed and a bounded per-request collaborator-permission fallback was added before retrying |

## Review findings

| ID | Status | Finding | Disposition |
| --- | --- | --- | --- |
| RQ-R01 | closed | Initial preview design both prohibited privileged artifact consumption and required credentialed deployment | Split unprivileged build from a fixed base-controlled inert-byte publisher; added revision/path/size admission |
| RQ-R02 | closed | Public issues/comments/source text could trigger unbounded work or prompt-inject a write-capable agent | Added trusted acceptance gate, authorized write instructions, and explicit data-not-instruction trust rule |
| RQ-R03 | closed | Browser-open failure, query normalization, public disclosure, and lifecycle resume semantics were ambiguous | Added truthful URL fallback, preservation rules, public acknowledgement, and one typed transition authority |
| RQ-R04 | closed | Final depth pass found no unresolved Critical or High design contradiction | Open POCs remain explicit ratification blockers rather than being presented as implementation |
| RQ-R05 | closed | A generic agent/chat API would expose models, sessions, tools, environments, and incomparable features without a parent consumer | Replaced it with the narrow child managed-work contract; only cancellation strength remains descriptive |
| RQ-R06 | closed | Provider-specific secret isolation conflicted with historical “no provider branch” wording | Product/Port remain neutral; trusted composition intentionally uses mutually exclusive credential-specific steps |
| RQ-R07 | closed | Raw workflow inputs could inject shell source or evade per-request concurrency through numeric aliases | Environment-only shell transport, canonical runner admission, and normalized concurrency key added |
| RQ-R08 | closed | Production composition itself was initially inferred from adapter/dispatcher unit tests | Real store plus dispatcher runner fixtures now prove both credential routes, exact output/exit behavior, strict arguments, and cancellation without redispatch |
| RQ-R09 | closed | A later PAT in the same job remained reachable from candidate-poisoned hooks, git config, or process state | Split proposal, qualification, and publication into fresh jobs carrying only a bounded inert patch; exact publisher shell and credential census are executable contracts |

## Completion rule

Design is ready for ratification only when every pre-ratification acceptance item is checked, every
material investigation question is closed or deliberately deferred without affecting V1, and the
review ledger has no unresolved Critical or High finding. Green document/type checks alone do not
authorize implementation.
