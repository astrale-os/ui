# Benchmark workloads

Observed numbers belong in [LEDGER.md](./LEDGER.md). This file owns stable workloads and metrics,
not environment-specific results or unmeasured budgets.

## Corpus workloads

| ID | Workload | Purpose |
| --- | --- | --- |
| `CURRENT` | Exact current searchable union | Real closure, relevance, artifact size, and latency |
| `SCALE-10` | Ten deterministic identity-distinct replicas of `CURRENT` | Approximately 10x postings and document metadata |
| `SCALE-100` | One hundred deterministic identity-distinct replicas of `CURRENT` | Required 100x stress boundary |

Replication is deliberately unfavorable to result-set cardinality and adds one deterministic
identity-distinct non-query term per replica/document pair. It therefore stresses postings,
metadata, and lexicon growth while leaving the real query semantics unchanged. It is still a
synthetic upper-bound workload rather than a prediction of future corpus composition.

For each workload record:

- document and unique-term counts;
- build time;
- raw, gzip level 9, and Brotli quality 6 serialized bytes;
- parse/hydration time;
- warm query p50 and p95 over the same query set; and
- combined build/load process heap as diagnostic evidence, not a runtime-only budget.

The POC also partitions postings by deterministic term hash and result metadata by mechanically
derived family. Record total artifact cost, one manifest size/load, and per-query selected shard
file, byte, and parse cost. The benchmark must call the same query planner as the partitioned
executor, and generation fails if the manifest or any posting/metadata part exceeds its candidate
raw-byte bound. This is a distribution experiment, not approval of a production custom engine or
a public family concept.

## Relevance workload

`search/.spec/benchmarks/relevance.cases.json` contains stable user intents and acceptable
candidate sets. It is
a sparse search-quality benchmark, not component metadata and not one row per inventory item.

Record:

- HitRate@5 and HitRate@10 (at least one acceptable candidate);
- true relevant-set Recall@5 and Recall@10;
- mean reciprocal rank at 5;
- binary nDCG@5; and
- the top five addresses for every query.

The initial workload covers exact technical terms, multi-intent compositions, runtime components,
provider variants, blocks, patterns, and themes. A production search failure may add a regression
query; ordinary inventory growth does not require a new benchmark row.

## Closed-set workload

For every searchable document:

1. its exact address retrieves that identity at rank one;
2. its result points to an existing safe canonical code file;
3. exactly one distribution instruction is present; and
4. serialized then loaded retrieval preserves ordering for the relevance workload.

## Budget ratification

Hard input/file limits and performance budgets are ratified only after `CURRENT`, `SCALE-10`, and
`SCALE-100` run on the same recorded environment. Network time remains a separately reported
external observation; it is never hidden inside warm query latency.

For a single artifact, compare its one-time local decode plus warm query p95 with the applicable
budget. For partitioned data, compare manifest decode plus selected-part decode p95 plus query p95.
