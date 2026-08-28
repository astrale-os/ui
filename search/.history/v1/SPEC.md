# Candidate specification

## Public journey

```text
astrale ui search <query> [--project <path>] [--limit <n>] [--offset <n>] [--json]
```

- `query` is required after trimming and is bounded by [limits.ts](./limits.ts) in Unicode code
  points.
- Result count and pagination bounds come from [limits.ts](./limits.ts).
- The default offset is zero.
- Search has no public classification or provider filter.
- An empty match set succeeds with `total: 0`, `nextOffset: null`, and `results: []`.
- Human output presents the same candidate order and code as JSON.
- JSON follows [api.d.ts](./api.d.ts). Registry candidates use `command`, never
  `installCommand`. Runtime candidates use `packageImport`.
- Scores, engine details, internal classification, family, and source-provider ranking fields are
  not public.

`astrale ui list` is removed at cutover. `astrale ui inspect` is not introduced. Registry
enumeration required by interactive `ui add` remains a private CLI operation.

Canonical JSON shape:

```json
{
  "query": "editable payment table with export",
  "release": {
    "version": "0.3.0-beta.N",
    "commit": "40-character commit"
  },
  "offset": 0,
  "limit": 5,
  "total": 12,
  "nextOffset": 5,
  "results": [
    {
      "address": "block/data-table/data-table-12",
      "title": "Data Table 12",
      "description": "Data table with export functionality supporting CSV, Excel, and multiple formats",
      "dependencies": ["@tanstack/react-table", "papaparse", "xlsx"],
      "code": { "language": "tsx", "source": "..." },
      "command": "astrale ui add block/data-table/data-table-12"
    }
  ]
}
```

## Release semantics

An initialized project searches the exact version and 40-character commit in
`astrale-ui.lock.json`. A project lock whose release has no supported search artifact fails with
`UI_SEARCH_UNAVAILABLE` and directs the user to `astrale ui doctor` followed by the intentional
upgrade path `astrale ui init --force`.

Outside an initialized project, search resolves the current public npm `beta` release. Search never
silently crosses from a project lock to another release.

The immutable release commit is the cache identity. Search does not load or validate the complete
registry before querying. Only selected result code is hydrated after ranking, concurrently and
from the same commit.

## Corpus authority

The searchable set is exactly:

```text
visual @astrale-os/ui package subpaths
+ every public registry item
= generated SearchDocument identities
= index document identities
```

Package exports and registry manifests remain the product authorities. Search introduces no second
inventory. A source change rebuilds derived evidence; an address addition or removal changes the
closed set automatically.

Each document carries:

1. identity evidence from its canonical address, title, and mechanically derived family words;
2. its existing registry description;
3. dependency package names;
4. behavioral evidence extracted from canonical TypeScript/TSX source: identifiers, JSX-visible
   text, accessible labels, placeholders, prop names, and imported symbols; and
5. a safe release-relative path to canonical demo or theme code.

Extraction excludes class strings, CSS/token values, `data-slot` values, URLs, emails, generated
identifiers, and module-path boilerplate. Language-keyword stopwords apply only to source evidence,
so user and manifest terms such as `export` remain searchable. Numeric identity/query terms are
preserved so `button-17` is distinct from `button-26`; standalone numeric source noise is excluded.
The candidate takes at most 16 deduplicated behavioral terms per document at lower weight than
descriptions. The production parser is syntax-aware rather than a regular-expression contract.

## Retrieval semantics

V1 uses a prebuilt local lexical inverted index with field-aware BM25-style scoring. Exact terms
rank above prefixes; prefixes rank above bounded edit-distance matches. A query term may retain
both bounded prefix and one-edit candidates, preventing an irrelevant prefix collision from
hiding the typo correction. Identity and descriptions
rank above mechanically extracted behavior, which ranks above dependency evidence. Generic
reranking may reward full phrases, query-token coverage, and exact addresses, but cannot contain
per-item exceptions.

The current candidate is an owned, versioned `lexical-v1` static-postings artifact with no search
runtime dependency. Generation folds field weights and document-length normalization into posting
evidence. The CLI applies inverse frequency, saturation, prefix/fuzzy weight, query coverage, and a
bounded phrase rerank. A generated exact-address posting bypasses token ambiguity without entering
the free-text lexicon.

The release envelope supports two physical layouts behind the same scorer:

- `single` while the raw serialized payload is within the single-artifact limit;
- `partitioned` above that boundary, with one compact term/part manifest, deterministic term-hash
  posting parts, and result-metadata parts derived from family ownership and split again when a part
  exceeds its bound.

The manifest maps terms and document identities to physical parts. It carries a complete scoring
fingerprint and all runtime scoring parameters; consumers reject an incompatible or malformed
manifest instead of combining cached partitions across scoring generations. Family is private distribution
metadata, not a public filter or ranking requirement. The generator increases the power-of-two term
partition count until every physical part satisfies [limits.ts](./limits.ts). The semantic
`SearchDocument` and public `SearchResponse` remain independent of either physical layout.

The production generator uses `@babel/parser` only as a root development dependency for
syntax-aware TypeScript/TSX/JSX observation. It does not enter `@astrale-os/ui`, installed registry
source, or the Astrale CLI runtime. The POC qualified the parser across the complete current source
tree; version selection remains in the root manifest rather than this contract.

Semantic retrieval may later run as a second internal retriever over the same generated document.
Independent result sets are fused by rank rather than exposing or directly adding incomparable
scores. Lexical retrieval remains present for exact technical vocabulary and addresses.

A mechanically derived import/composition graph may later support related results or bounded
reranking. It is not the V1 candidate generator because graph centrality would promote ubiquitous
runtime components over the exact requested composition.

## Determinism and ordering

For one release, normalized query, offset, and limit, candidate ordering is deterministic. Exact
address recognition uses NFKC normalization and case folding. Ties resolve by title and then
canonical address. One fixed scorer-versioned rerank window covers the complete accepted
offset-plus-limit range, so changing page size cannot change earlier pages. Pagination operates on
that complete accessible order. Search
does not depend on prior queries, cache warmth, catalog family loading, or filesystem enumeration
order.

## Failures

- `UI_SEARCH_QUERY_INVALID` owns empty, oversized, or invalid pagination input.
- `UI_SEARCH_UNAVAILABLE` owns missing/unsupported release artifacts, malformed index data, unsafe
  code paths, bounded response violations, and failed exact-release hydration.
- No match is not a failure.
- Search never converts an unexpected internal defect into an empty success.

Candidate numeric safety bounds and measured local performance budgets live only in
[limits.ts](./limits.ts). Network, release resolution, and code hydration remain separately reported
evidence rather than being hidden inside the local retrieval budget.
