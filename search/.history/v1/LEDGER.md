# Search V1 ledger

This is the only status-bearing document for the Search V1 design, implementation, and release
initiative.

## Decisions

| ID | Status | Decision | Evidence or remaining gate |
| --- | --- | --- | --- |
| SR-D01 | implemented | `search/` is the top-level producer owner; CLI remains the consumer/runtime owner | Durable UI and CLI specifications plus dependency checks |
| SR-D02 | implemented | The sole public discovery journey is `astrale ui search <free-text>` | CLI command/help contract |
| SR-D03 | implemented | Registry results use `command`, not `installCommand` | Generated corpus and public response contract |
| SR-D04 | implemented | Remove public `ui list`; do not introduce `inspect` or a public type filter | Source/help/declaration removal census |
| SR-D05 | implemented | Search the union of 50 visual runtime subpaths and every registry item | Production 1,026-document inverse closure |
| SR-D06 | implemented | Use descriptions plus at most 16 low-weight syntax-derived behavior terms; no per-item tags | Production relevance suite |
| SR-D07 | implemented | Use adaptive single/partitioned `lexical-v1` static postings and immutable local cache | Generator split/parity and CLI cache/partition tests |
| SR-D08 | implemented | Own the static scorer without a CLI search dependency; use `@babel/parser` only for build-time TSX observation | Package boundary and exact dependency checks |
| SR-D09 | implemented | Project lock is authoritative; npm `beta` is only the outside-project fallback | CLI lock/fallback tests |
| SR-D10 | implemented | Every returned candidate includes canonical code by default | Hydration and machine-output tests |
| SR-D11 | ratified | Semantic search is a later parallel retriever fused by rank; lexical remains mandatory | Deliberate V1 deferral |
| SR-D12 | ratified | A generated composition graph may support related/reranking later but is not V1 retrieval | Deliberate V1 deferral |
| SR-D13 | implemented | Use the safety limits and measured local budgets in `limits.ts` | Production 1x/10x/100x benchmark and admission tests |
| SR-D14 | implemented | Full deterministic regeneration precedes any incremental index work | Byte-stable build/check; 100x build 2,199.700ms |

## Investigation questions

| ID | Status | Question | Closing proof |
| --- | --- | --- | --- |
| SR-Q01 | proven | Are descriptions alone relevant enough, and where does source behavior improve them? | Metadata HitRate/Recall/MRR/nDCG@5 0.857/0.790/0.810/0.780; behavior-16 1.000/0.933/0.952/0.923 |
| SR-Q02 | proven | Does bounded syntax evidence exclude visual boilerplate without losing useful behavior? | Current-term audit, style masking, 16/24/96 comparison, Babel full-tree parse |
| SR-Q03 | proven | Is a single artifact still fast and compact at 100x? | No: single load 1,573.252ms; partitioned manifest+selected+query p95 121.391ms |
| SR-Q04 | proven | Does bounded prefix/fuzzy handling improve typos without ranking noise? | The top five for isolated `carosel` are all carousel variants; a 40-prefix collision retains the one-edit candidate within the public top ten |
| SR-Q05 | proven | Can serialized single and partitioned data preserve ordering and exact identity? | JSON round-trip, 21-query order/pagination parity, and 1,026 exact-address rank-one checks pass for exact and case-folded forms |
| SR-Q06 | proven | Can exact demo code be hydrated for all documents through safe release-relative paths? | Every support and demo path is rejected before read unless repository-relative; all 1,026 canonical code paths exist; largest file 13,101 bytes |

## POC evidence

| Date | Revision | Scope | Command | Result |
| --- | --- | --- | --- | --- |
| 2026-08-27 | `063c9c6` | Baseline audit | Read package exports, registry manifests/index, canonical source, existing CLI list/release path | 976 registry items, 50 visual runtime subpaths; no normative search contract; current list is a linear substring scan |
| 2026-08-28 | local on `063c9c6` | Corpus and relevance | `pnpm search:poc`; `pnpm search:poc:test` | 1,026 closed documents; metadata HitRate/Recall/MRR/nDCG@5 0.857/0.790/0.810/0.780; behavior-16 1.000/0.933/0.952/0.923 with Recall@10 1.000; 10 focused tests green |
| 2026-08-28 | local on `063c9c6` | Current performance | `pnpm search:poc` on Node 24.18.1/macOS | Single: 794,344 raw / 101,675 Brotli; 3.827ms load; 2.109ms query p95; 21.844ms build |
| 2026-08-28 | local on `063c9c6` | 10x performance | `pnpm search:poc` with 10,260 docs/12,145 terms | Partition candidate: 1.013ms manifest + 6.963ms selected p95 + 4.548ms query p95; 158,748 selected Brotli p95 |
| 2026-08-28 | local on `063c9c6` | 100x performance | `pnpm search:poc` with 102,600 docs/104,485 terms | Single load 1,573.252ms; partition candidate 11.832ms manifest + 94.578ms selected p95 + 14.981ms query p95; 705,879 selected Brotli p95; 2,445.314ms build; every part below 4 MiB raw |
| 2026-08-28 | isolated temp POC | Syntax parser | `@babel/parser@8.0.4` over runtime previews and registry TSX | 2,174 files / 3,347,355 bytes / 414,256 nodes in 382.177ms; zero parse failures; parser is MIT and build-time only |
| 2026-08-28 | local on `063c9c6` | Repository qualification | `pnpm check` | Build, formatting, lint, workspace types, 41 contract tests, playground unit tests, 10 search POC tests, catalog closure, registry generation/typecheck/contracts, and playground typecheck passed |

## Production implementation evidence

| Date | Revision | Scope | Command | Result |
| --- | --- | --- | --- | --- |
| 2026-08-28 | local on UI `063c9c6` | Generated corpus | `pnpm search:check` | 976 registry + 50 runtime = 1,026 exact documents; byte-stable single artifact; 6 production tests, adaptive serialized sharding, and strict spec typecheck passed |
| 2026-08-28 | local on UI `063c9c6` | Production scale benchmark | `pnpm search:benchmark` | 1x/10x/100x: 1,026/10,260/102,600 docs; final build 24.840/206.263/2,056.446ms; query p95 1.172/3.899/13.456ms, all enforced below budget |
| 2026-08-28 | local on UI `063c9c6` | Current artifact | `pnpm search:build` | `single`, 884,794 raw / 173,096 gzip / 149,170 Brotli bytes; 3,033 terms |
| 2026-08-28 | CLI worktree from `3f59832` | Consumer and full regression | `pnpm test`; pinned Bun 1.4 build; typecheck/lint/format/public-boundary checks | 1,070 tests passed; one isolated-worktree skill-mirror check skipped; standalone bundle and public subpaths built; release-only advance from `39da860` requalified |
| 2026-08-28 | UI + CLI worktrees | Cross-owner exact contract | `pnpm qualification:ui-search ../ui` | Real generated single and forced-partition bytes passed through the CLI for 1,026 exact addresses plus 21 relevance intents per layout; exact demo digests passed |
| 2026-08-28 | local on UI `063c9c6` | Package and SDK boundary | `pnpm check`; `pnpm package:qualify` | Full UI repository green; deterministic 60,458-byte / 117-file tarball unchanged by search; no search artifact, parser, or SDK dependency added |

Publication and a released external-project journey remain release evidence, not an unrecorded
local claim.

## POC corrections

| ID | Status | Observation | Candidate correction |
| --- | --- | --- | --- |
| SR-P01 | closed | TypeScript 7 native preview exposes no compiler AST API | Qualify `@babel/parser` as a root development-only parser |
| SR-P02 | closed | Unbounded 96-term behavior evidence slightly reduced MRR and inflated artifacts | Cap at 16 and weight below descriptions; same relevance as 24 terms |
| SR-P03 | closed | Core registry code initially pointed at implementation rather than demo usage | Core uses canonical preview; variants use owned demo source; themes use CSS |
| SR-P04 | closed | Token-only partition ranking lost exact numbered/runtime addresses | Generate a non-lexicon exact-address posting; all 1,026 rank first |
| SR-P05 | closed | One 100x JSON artifact loaded in over one second | Adaptive partitioning with pre-normalized term postings and lazy metadata parts |
| SR-P06 | closed | The first report mislabeled a boolean relevant-hit metric as recall | Report HitRate separately and compute true relevant-set Recall; assertions cover both |
| SR-P07 | closed | Generic tokenization discarded variant numbers and the user intent `export` | Preserve numeric identity/query terms and scope language keywords to source extraction only |
| SR-P08 | closed | The first shard executor case-tested addresses before normalization and trusted runtime-global scoring | Normalize first; embed and validate the complete scorer fingerprint and parameters |
| SR-P09 | closed | Option-dependent rerank pools could destabilize pagination | Use one scorer-versioned 1,010-candidate bound covering the accepted maximum offset and limit |
| SR-P10 | closed | The first shard benchmark approximated rather than executed the consumer load plan | One shared planner drives retrieval and selected-part measurement; generation enforces each 4 MiB bound |
| SR-P11 | closed | A weak prefix could suppress a useful one-edit candidate | Resolve up to eight nearest prefixes and eight one-edit terms together; adversarial 40-prefix proof passes |
| SR-P12 | closed | Variant demo choice depended on manifest order | Select the unique non-support source owner whose basename equals the canonical address subject |

## Review findings

| ID | Status | Finding | Disposition |
| --- | --- | --- | --- |
| SR-R01 | closed | Adversarial gap review found two critical, six high, and two medium POC gaps | SR-P06 through SR-P12; path admission, compatibility, determinism, and pagination tests now pass |
| SR-R02 | closed | Test-quality reviews found metric, canonical path, boundary pagination, adaptive partition, compatibility, and cross-layout proof gaps | Corrected; final critic pass found no unresolved Critical or High POC-test defect; all 10 tests pass |
| SR-R03 | closed | Final implementation reviews found an unreachable pagination tail, incomplete partition admission, missing cross-owner proof, and a non-causal release check | All corrected; CLI CI and exact released-UI qualification run the real both-layout consumer contract, and publication depends on that exact-SHA gate; final critic and gap passes are Critical/High clear |

## Completion rule

The local implementation is complete: every ratified producer, consumer, removal, package,
performance, and regression criterion has recorded evidence, and the final adversarial reviews have
no unresolved Critical or High finding. The only unchecked acceptance item is intentionally a
release proof: after the UI and CLI changes are merged and published, an external project must run
the exact published search, dry-run, install, typecheck, and pinning journey. It is not claimed from
local source qualification.
