# UI Domain V1 ledger

## Decisions

| ID | Decision | Status | Proof |
| --- | --- | --- | --- |
| D01 | `ui.astrale.ai` is a control plane, not a component or registry owner. | accepted | ADR ownership table |
| D02 | V1 owns only `Request` identity, ownership, idempotency, and submission receipt. | accepted | `schema/request/` |
| D03 | V1 mutation requires an authenticated Astrale Identity. | accepted | `request-function.ts` |
| D04 | GitHub remains collaboration authority; its issue state is not mirrored. | accepted | ADR state and authority |
| D05 | Component, preview, search, and embedding material never becomes graph nodes. | accepted | ADR deliberate exclusions |
| D06 | Local lexical search remains in the CLI until server-only value exists. | accepted | ADR search admission gate |
| D07 | V1 has no View. | accepted | application qualification |
| D08 | One Workflow and GitHub-backed Integration implement the callable. | accepted | Runtime composition |
| D09 | V1 does not depend on the Issues Domain. | accepted | Schema dependency closure |
| D10 | `outcome-unknown` must reconcile before a possibly duplicated external submission. | accepted | Workflow evidence |
| D11 | Reusing one owner's key for another intent returns `conflict` without effects. | implementation correction | callable and Workflow evidence |
| D12 | An empty reconciliation scan never authorizes retry; only an explicit provider rejection is retryable. | adversarial correction | Workflow and Provider evidence |
| D13 | The Application explicitly requires Kernel Query and Mutation; Runtime graph access is not implied by installation. | live correction | `application.ts` and composition test |
| D14 | The Domain-self session owns the internal idempotency ledger; `ownerId` scopes the indexed key while the ownership edge retains caller-facing policy. | live correction | Request Schema, Query, and replay proof |
| D15 | Receipt confirmation is one machine-derived transition with one auxiliary property delta in the same Node update. | live correction | SDK transition contract and realized Mutation AST |
| D16 | `domain/` is a private source workspace: it builds, packages declarations, deploys through its adapter, and installs by observed deployment URL without npm or Release Please authority. | release correction | private manifest, single-package release contract, deployment configuration |
| D17 | The UI repository owns this Domain at `domain/`; the general Domains repository must contain no copy or parallel release authority. | ownership correction | relocation PRs and closed-set repository searches |

## Open and deferred questions

| ID | Question | Gate |
| --- | --- | --- |
| Q01 | Domain persistence retains the exact admitted input; CLI normalization remains a caller concern. | resolved |
| Q02 | V1 idempotency is permanent for the lifetime of the owner and Request node. | resolved |
| Q03 | Provider failure detail remains private; key reuse exposes only the stable `conflict` result. | resolved |
| Q04 | Can anonymous intake ever be admitted, and with which rate, proof-of-human, and spend limits? | later public-intake ADR |
| Q05 | Runtime secrets supply a repository-scoped token and repository coordinate; the Provider owns bounded marker reconciliation. | resolved |
| Q06 | When does semantic/private/shared search justify a Domain Function and derived index? | search admission gate |
| Q07 | The Domain creates the GitHub issue directly; trusted agent triage remains repository-owned. | resolved |
| Q08 | The Domain has no npm bootstrap or package release; the UI repository releases only `@astrale-os/ui`, while Domain deployment and Kernel installation remain explicit lifecycle stages. | resolved |

None of Q01-Q08 authorizes expanding the V1 graph model.

## Phase acceptance

- [x] Scaffolded from the current beta `create-astrale-domain` release without workspace links.
- [x] Package uses exact current SDK and Cloudflare adapter beta versions.
- [x] The Domain workspace is private and has no npm, tag, or independent Release Please authority.
- [x] Schema has one bounded context with shallow exports and one file per semantic owner.
- [x] Ownership, authority, trust, alternatives, and deferred scope are recorded.
- [x] Submission lifecycle is explicit and exhaustively tested.
- [x] Dependency locks contain no workspace or local-link SDK resolution.
- [x] Typecheck, Schema tests, and lint pass from a frozen clean install.
- [x] Runtime exhaustively binds `request` to one Workflow and one Integration Provider.
- [x] Application build, declaration packaging, and local development startup pass.
- [x] Review confirms no agent, View, search service, deployment, or registry copy was implemented.
- [x] Adversarial review confirms unknown outcomes cannot authorize duplicate submission and trusted
      actor evidence is mandatory.
- [x] Two-pass test review found no remaining material gamed, dead, superficial, or redundant test.
- [x] ADR and Schema were ratified by the repository owner.
- [ ] Deployment admission and abuse limits are ratified for the identities allowed to invoke the
      shared GitHub writer.
- [x] An installed exact-main Kernel qualification proves anonymous denial and authenticated
      execution through a publicly reachable remote Domain.
- [x] One live request creates exactly one GitHub issue; same-key replay returns the same receipt and
      conflicting-intent replay returns `conflict` without another issue.
- [x] A separately provisioned concrete Identity is denied both Request-Class traversal and exact
      Request lookup with Kernel code `2004`.
- [x] The exact built CLI submits through the installed Domain, replays to the same receipt, and
      rejects anonymous invocation without GitHub credentials in the caller.
- [x] Managed-agent attempt 8 qualified and published reviewable UI PR #76; attempts 1-7 were
      correctly rejected without publication.
- [x] A clean frozen registry install builds against the published SDK atomic transition-delta
      release and its matching Cloudflare adapter cohort.

## Toolchain snapshot

| Tool | Version selected |
| --- | --- |
| `create-astrale-domain` | `0.3.0-beta.72` |
| `@astrale-os/sdk` | `0.5.0-beta.79` |
| `@astrale-os/adapter-cloudflare` | `0.5.0-beta.82` |
| Astrale CLI | `1.0.0-beta.54` |
| package manager | `pnpm@12.0.0` |

## Qualification evidence

Record exact commands and results here during qualification. A focused check is not a substitute
for the full sequence.

| Check | Result | Evidence |
| --- | --- | --- |
| repository relocation | pass | the 59 tracked files from `astrale-os/domains:ui/` were copied mechanically; the only content deltas before qualification were repository/release metadata, the exact Zod pin, its lockfile specifier, and this ledger |
| private release ownership | pass | one public package remains (`@astrale-os/ui`); `domain/package.json` is private, retains only the declaration-output `publishConfig` projection required by `astrale-domain package`, has no registry, access mode, or `prepack`, and no Domain publish workflow or Release Please component exists |
| clean standalone install | pass | `pnpm --dir domain install --frozen-lockfile`; the nearest `domain/pnpm-workspace.yaml` owns the standalone lock and unchanged supply-chain policy |
| dependency provenance | pass | SDK `0.5.0-beta.79`, adapter `0.5.0-beta.82`; no `link:`, `workspace:`, or `file:` resolution |
| standalone lock supply-chain policy | pass | PR #125's first isolated run exposed a locally cached fresh-resolution lock; the lock was rebuilt from the already-admitted root cohort, deduplicated to the UI closure, and reverified with the unchanged seven-day policy across 308 entries |
| typecheck | pass | `pnpm typecheck` |
| tests | pass | `pnpm test`: 9 files, 33 tests; Application requirements, atomic receipt, ownership scope, replay, conflict, and provider boundaries pass |
| lint | pass | `pnpm lint`: 48 Domain files, 0 warnings, 0 suppressed, one static-analysis indeterminate; repository policy and Oxlint pass |
| build | pass | relocated `ui.astrale.ai` build `sha256:dce685549ce00ed27f87939562bcbe0a8791100dd5d778497bd69643237c61ff` |
| package | pass | 8 public Schema declarations; 18 packed files, 5,061 bytes; Provider and Workflow excluded |
| local dev | pass | ready on an explicit loopback port; `/health` returned `{"status":"ready"}` |
| UI repository qualification | pass | root `pnpm check`: runtime build, formatting, lint, workspace types, 42 contracts, playground unit tests, search, 97 request/agent tests, Domain qualification, 1,015-item catalog closure, registry closure, and playground types |
| workspace install | pass | root frozen lock admits the Domain as an independent workspace package while the Domain retains its standalone frozen lock |
| workspace lint | pass | publication/dependency policy and Oxlint |
| workspace typecheck | pass | 9 runnable projects |
| workspace tests | pass | root routing plus 9 runnable projects |
| adversarial tests review | pass | two-agent gap and critic passes; all critical source defects corrected and final suite review PASS |
| scope review | pass | no agent, View, search service, registry copy, tracked credential, or deployment effect |
| exact-main Kernel install | pass | Kernel revision `sha256:f982ac882bbb7666ac3174b8728cf2cfdf6c54464979644fb3af83540441837a`; UI generation committed on a fresh graph |
| anonymous live call | pass | rejected with protocol code `2001` before Provider execution |
| authenticated live call | pass | Request `d1413d13-9d7a-4011-8d66-7e6c117dc88d` submitted as GitHub issue #68 |
| same-key live replay | pass | returned the exact same Request id and issue #68; graph retained exactly one Request |
| conflicting-intent replay | pass | returned `conflict` for the same Request id without another GitHub issue |
| cross-owner isolation | pass | a separately provisioned concrete Domain Identity received code `2004` for both `query /:ui.astrale.ai:class.Request` and exact `get @d1413d13-9d7a-4011-8d66-7e6c117dc88d` |
| managed-agent attempt 1 | correctly rejected | proposal completed; qualification rejected stale `search/public/index.json`; review also rejected unsourced visual authorship and missing provenance |
| managed-agent attempt 2 | correctly rejected | agent again authored unsourced visual code and omitted search generation; credential-free qualification rejected stale `search/public/index.json`; no branch or PR was published |
| managed-agent attempt 3 | correctly rejected | the source-first agent made no change because it could not prove exact external source bytes; the proposal owner rejected an empty patch without publication |
| managed-agent attempt 4 | correctly rejected | the Azure environment could not reach exact upstream source bytes; no candidate was fabricated or published |
| managed-agent attempt 5 | correctly rejected | discovery failed before model execution because Claude Code could not resolve the Draft 2020 meta-schema declaration; UI PR #73 removed the incompatible declaration |
| managed-agent attempt 6 | correctly rejected | discovery, bounded fetch, read-only evidence sealing, implementation, and post-agent digest verification passed; credential-free qualification rejected one unformatted copied source before publication; UI PR #74 assigns deterministic formatting to qualification |
| managed-agent attempt 7 | correctly rejected | the source-faithful candidate passed formatting, but qualification detected that registry/search generation had executed before formatting and therefore rejected stale generated bytes; no branch or PR was published |
| managed-agent attempt 8 | pass | managed run `33267665052` completed discovery, immutable-source verification, implementation, post-agent digest verification, full `pnpm check`, and isolated publication; UI PR #76 passed all remote checks and merged as `e47398e7693e89b02aeaecca162371ff4d1b75bc`, closing issue #68 |
| managed candidate browser proof | pass | the exact PR #76 head was discovered through Cmd+K, opened by direct URL, rendered its source-faithful heatmap and accessible status labels/legend at desktop and mobile viewports, returned with native Back, and produced no browser errors |
| request automation corrections | merged and qualified | UI PRs #69, #72, #73, #74, and #75 enforce source-first provenance, a sealed immutable source bridge, CLI-compatible structured discovery, deterministic formatting before generated artifacts, complete credential-free qualification, and a non-executing publisher |
| built CLI request | pass | CLI PR #297 exact build created issue #70, replayed to the same Request `4eadbb11-b9c7-48f3-93b7-b988ac0794f7`, and rejected `--anonymous` with code `2001`; #70 was then closed as qualification-only |
| SDK transition delta | merged and published | SDK PR #331 specifies and proves the atomic auxiliary property delta; Release PR #332 published SDK `0.5.0-beta.78` and adapter `0.5.0-beta.81` |
| published dependency cohort | pass | npm exposes SDK `0.5.0-beta.78` and adapter-cloudflare `0.5.0-beta.81`; frozen standalone and umbrella installs, Domain qualification, and full 9-project workspace qualification pass |

## DX observation

`astrale-domain lint` reports one indeterminate `MUT-PURE` notice because static analysis cannot yet
prove that `mutation.expect.query(...)` is the canonical inert precondition builder. The realized
Mutation test proves one Query precondition and one atomic document. This is an SDK linter
capability observation, not a suppressed diagnostic or product workaround.
