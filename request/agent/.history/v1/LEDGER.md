# Candidate decision and evidence ledger

Status values: `candidate`, `accepted`, `rejected`, `blocked`.

## Decisions

| ID | Status | Decision | Rationale / proof required |
| --- | --- | --- | --- |
| MA-D01 | accepted | Normalize repository dispatch → observation → one PR, not chat or generic inference | Shared contract and both adapters exercise this exact journey |
| MA-D02 | accepted | GitHub issue/PR and source are portable continuity; provider sessions are private | Opaque references and fresh PR-targeted revision preserve portability |
| MA-D03 | accepted | Provider selection is injected trusted composition | CLI, form, job, dispatcher, and record expose no provider choice |
| MA-D04 | accepted | Polling is authoritative; events only wake reconciliation | Restart observation is shared-contract qualified |
| MA-D05 | accepted | `AGENT_OUTCOME_UNKNOWN` forbids automatic retry/failover | Dispatcher adversarial tests prove block and explicit read-only reconciliation |
| MA-D06 | accepted | One non-terminal writer per request/PR branch | Canonical workflow concurrency is the explicit production serialization owner |
| MA-D07 | accepted | Successful V1 runs return exactly one intended-repository PR | Both mappings reject missing, multiple, and wrong-repository proposals |
| MA-D08 | accepted | Cancellation is total but its guarantee is explicit | None/requested/confirmed/terminal outcomes are represented without casts |
| MA-D09 | accepted | One selected adapter must complete live before enablement; a second live provider is continuing portability evidence | Three structurally different adapters pass one shared suite; Actions/Claude Code/Foundry is selected for live qualification |
| MA-D10 | accepted | Persist attempt/run binding in GitHub request metadata before adding infrastructure | Closed record schema, trusted actor, restart, duplicate/malformed/bounded scans proven |

## Open questions

| ID | Status | Question | Closure evidence |
| --- | --- | --- | --- |
| MA-Q01 | accepted | Which provider/account qualifies production first? | GitHub Actions worker + Claude Code + Azure Foundry selected; exact workflow-to-PR POC remains in the production-enable gate |
| MA-Q02 | accepted | Is GitHub issue metadata sufficient for attempt persistence and restart recovery? | GitHub comment record plus canonical Actions concurrency; no false cross-process CAS claim |
| MA-Q03 | accepted | What objective, identifier, message, and polling bounds belong in V1? | Durable limits, schema, byte-bound and timeout tests |
| MA-Q04 | accepted | Which provider errors prove pre-accept failure versus unknown acceptance? | HTTP/transport/timeout matrices fail closed; dispatch ambiguity remains unsafe |
| MA-Q05 | accepted | Should `waiting-for-input` ever support an in-run reply? | V1 safely uses a fresh PR-targeted run; in-run replies remain private/deferred |
| MA-Q06 | candidate | Does GitHub Copilot task preview support the required token/account and existing-PR revision journey? | Live API POC, not documentation inference |
| MA-Q07 | accepted | What is the operator reconciliation procedure for unknown outcomes? | Explicit settlement bound, exact marker/deterministic identity, read-only scan, absent/found/ambiguous outcomes |

## Current provider evidence

| ID | Surface | Evidence | Consequence |
| --- | --- | --- | --- |
| MA-E01 | GitHub Copilot agent tasks | Public-preview start/get/list API, task states, optional PR artifact; user-to-server token requirement | GitHub-native candidate; cancellation/follow-up not assumed |
| MA-E02 | Jules REST | Alpha session/activity/message/approval API with automatic PR output | Strong session-oriented contrast; maturity risk |
| MA-E03 | Cursor Cloud Agents V1 | Beta agent/run API with stream, cancellation, artifacts, existing PR, automatic PR | Rich candidate; provider options remain private |
| MA-E04 | Devin V3 | Organization/enterprise sessions, messages, statuses, structured output, PR list | Direct candidate; access/cost proof pending |
| MA-E05 | Codex SDK / Cloud | SDK is local programmatic control; no equivalent official managed coding-task REST control plane established | Self-hosted execution is a different adapter class, not V1 priority |
| MA-E06 | GitHub Actions + Claude Code + Azure Foundry | Current GitHub dispatch returns an exact run id; pinned Claude Code base action supports Foundry; production Azure Luna/Opus and Claude Code transport respond live | Selected V1 route; separate post-agent credential owns PR publication |

Exact references and caveats are retained in [PROVIDERS.md](./PROVIDERS.md).

## Local design evidence

| Date | Revision | Evidence | Result |
| --- | --- | --- | --- |
| 2026-08-28 | `6f73c351c7ec2225fa9acbe7a7a4f444a40c43ce` plus untracked candidate | Strict `tsc` across parent/child APIs, states, and example; `oxlint request`; repository `format:check`; recursive relative-link/final-newline/trailing-whitespace checks; JSON parse | 31 request files and 17 child files pass focused design conformance; no production or live-provider proof claimed |
| 2026-08-28 | local implementation on `87072ac580c26ff7825af345816ec92f0bfc9ef1` | `pnpm request:check`; `pnpm lint`; `pnpm test:security`; provider/dispatcher/state/schema tests | GitHub and Cursor adapters plus dispatcher pass 22 focused tests; strict durable spec examples typecheck |
| 2026-08-28 | live GitHub `astrale-os/ui#51` | Authenticated task list, dispatcher attempts 1-2, explicit reconciliation, issue cleanup | Read/list returned zero tasks; task start returned HTTP 412; both uncertain attempts reconciled to confirmed absence; no task, branch, or PR was created; disposable issue closed |
| 2026-08-28 | environment census | Credential names and available CLIs only; no secret values read | GitHub user-to-server OAuth is available; no Cursor/Jules/Devin credential or CLI is configured |
| 2026-08-29 | local implementation review | Shared conformance, provider matrices, durable schema, production runner, dispatcher/store/workflow adversarial suites; two-agent critic/gap review | 50 focused tests pass; all reported Critical/High local implementation defects were corrected |
| 2026-08-29 | authoritative provider refresh | GitHub agent-task API `2026-03-10`; Cursor Cloud Agents V1 public-beta endpoint reference | Pagination, permissions, exact request/response fields, deterministic Cursor agent IDs, target metadata, and run PR fields reverified against current primary docs |
| 2026-08-29 | UI branch `feat/managed-ui-request-agent` at base `87072ac580c26ff7825af345816ec92f0bfc9ef1` | `pnpm check`; `pnpm test:security`; `git diff --check` | Exact final tree passes build, format, lint, workspace typecheck, 41 repository contracts, playground unit, search, 50 request tests, catalog/registry/playground closure, security policy, and whitespace proof |
| 2026-08-29 | live credential recheck | Environment variable-name census; `gh auth status` | No `CURSOR_API_KEY`, `COPILOT_AGENT_TOKEN`, `GITHUB_TOKEN`, or `GH_TOKEN` is present; the configured `bdjafer` GitHub token reports invalid, so no further remote write attempt is authorized or possible |
| 2026-08-29 | Azure production deployment | Redacted direct calls through `domains/ai-gateway/.env.prod`; Claude Code `2.1.223` with Foundry resource authentication | `gpt-5.6-luna` returned `AZURE_LUNA_OK`, `claude-opus-5` returned `AZURE_OPUS_OK`, and Claude Code returned `CLAUDE_CODE_FOUNDRY_OK`; no secret value entered output or repository state |
| 2026-08-29 | local Actions/Claude Code adapter | GitHub API `2026-03-10`, immutable base-action `a874e9ecd7bb36efdad65429c6b35815f5a08f10`, `pnpm check`, `pnpm test:security`, `git diff --check` | Three adapters and 89 request tests pass; reruns, forged reconciliation, failure artifacts, branch poisoning, revision freshness, state/failure matrices, dispatch ambiguity, and three-job credential isolation are covered; live workflow-to-PR proof remains |

## Review ledger

| Pass | Status | Required review |
| --- | --- | --- |
| Boundary review | accepted | Reject generic chat, provider configuration, and unrelated request/search ownership |
| API depth review | accepted | Every public field must affect a caller journey and have consumer/evidence/qualification |
| State review | accepted | Complete transitions, waiting distinctions, terminal monotonicity, unknown-state handling |
| Security review | accepted | Credentials, least privilege, prompt/source trust, one-writer and unknown-outcome laws |
| Provider review | candidate | Three exact fixture mappings pass one shared contract; selected Actions/Claude Code/Foundry workflow-to-PR delivery remains required |
| Product review | accepted | Existing request, CI, preview, review, and publication gates remain owners |

## Review findings

| ID | Status | Finding | Disposition |
| --- | --- | --- | --- |
| MA-R01 | accepted | A generic chat/agent API would leak incomparable models, sessions, tools, sandboxes, and events | Reduced the port to dispatch, observe, cancel-awareness, and one PR outcome |
| MA-R02 | accepted | Separate public session/run IDs would encode one provider's lifecycle and add no caller decision | Replaced them with one opaque adapter-owned `RunRef.id` |
| MA-R03 | accepted | Streaming, continuation, images, plan approval, and delivery flags had no V1 consumer | Removed them from the public descriptor; only cancellation strength changes orchestration |
| MA-R04 | accepted | A PR array allowed a supposedly one-PR run to expose ambiguous cardinality | Replaced it with one optional artifact and made it mandatory on `succeeded` |
| MA-R05 | accepted | Static interface shape cannot prove vendor neutrality | Three materially different adapters pass one shared executable contract; one selected live delivery gates enablement and another live provider remains continuing evidence |
| MA-R06 | accepted | The first live GitHub rejection was initially indistinguishable from possible acceptance | Added read-only `reconcile`, exact attempt markers, a 30-second settlement bound, confirmed-absence recovery, and HTTP 412 precondition classification |
| MA-R07 | accepted | Initial reconciliation could collide attempt `1` with `10`, scan incompletely, or retain stale failure state | Exact-line markers, bounded pagination with fail-closed exhaustion, objective-digest binding, and stale-field removal added |
| MA-R08 | accepted | Workflow input interpolation and spelling aliases could bypass shell/concurrency safety | Inputs now enter through environment values, the runner admits only canonical integers, and concurrency normalizes the issue identity |
| MA-R09 | accepted | Provider responses could leak raw result text or unsafe URLs across the neutral boundary | Generic failures, UTF-8 bounds, HTTPS credential-free URL admission, and hostile fixtures added |
| MA-R10 | accepted | Initial runner tests did not prove credential ownership, strict arguments, or safety-critical operation forwarding | Exact authorization headers, unknown-argument rejection, and real-store cancel forwarding without dispatch are now enforced |
| MA-R11 | accepted | Candidate schema had drifted from reconciliation and runtime bounds | Promoted a durable V1 schema with dispatch/observe/reconcile/cancel results and shared UTF-8/timestamp/repository admission proof |
| MA-R12 | accepted | Step ordering did not isolate a later PAT from candidate-poisoned hooks, config, or process state | Proposal, qualification, and publication are separate fresh jobs; only a bounded inert patch crosses them and publisher shell is exact-test locked |
| MA-R13 | accepted | GitHub reruns reuse a run id and could resume a terminal normalized writer | Opaque identity binds `run_attempt`; a later rerun is protocol-incompatible and requires a fresh authorized attempt |
| MA-R14 | accepted | Predictable branches and title-only reconciliation admitted pre-poisoning or forged manual runs | Branches include a digest, initial runs reject existing branches, and reconciliation binds exact actor/path/ref/title/attempt |
| MA-R15 | accepted | A failed workflow could lose an already-created PR and permit a duplicate initial proposal | Every observation checks the exact head PR; terminal failures retain it and the dispatcher requires explicit revision |

## Completion rule

The design may be ratified when all critical questions are accepted or deliberately deferred with a
safe V1 default, the schema and measured limits are ratified, multiple adapters validate the common
denominator, and the acceptance plan is executable. Production completion additionally requires
every acceptance checkbox and live evidence from the selected adapter.
