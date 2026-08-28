# Acceptance

## Pre-ratification acceptance

- [x] Candidate API expresses the complete CLI response using `command`, never `installCommand`.
- [x] Ownership leaves registry content, CLI presentation, installation, and SDK boundaries
      unambiguous.
- [x] The POC derives exactly the current registry/runtime closed set with no manual family list.
- [x] Existing descriptions and mechanically extracted behavioral evidence are measured separately.
- [x] Stable relevance cases retain their acceptable sets; the POC reports their top five plus
      HitRate@5/10, true Recall@5/10, MRR@5, and nDCG@5.
- [x] Current, 10x, and 100x raw/gzip/Brotli size, load, warm latency, and document/term counts are
      recorded without conflating network time.
- [x] Exact/case-folded-address rank-one, pagination parity, artifact compatibility, path safety,
      deterministic regeneration, partition bounds, and serialization closure pass.
- [x] Engine, typo, behavior-term bound, artifact shape, safety limits, and performance budgets have
      a candidate disposition or an explicit deferred owner.
- [x] An adversarial contract and test review leaves no unresolved Critical or High in-scope
      ambiguity.

## Full implementation acceptance

- [x] One generated release artifact covers every searchable surface exactly once and fails CI on
      drift, duplication, unsafe paths, malformed output, or nondeterminism.
- [x] Search operates without first loading the full registry and fetches code only for paginated
      top results.
- [x] Search uses the project lock when present, falls back to public npm `beta` only outside an
      initialized app, and rejects a pre-index lock with the specified upgrade guidance.
- [x] Search, pagination, code output, runtime imports, registry commands, empty results, malformed
      artifacts, and bounded failures pass focused tests.
- [x] `ui list`, `listUi`, `--type`, `--version`, old help, examples, and hints are absent from source,
      built output, declarations, and command tests.
- [ ] A published-artifact external project searches, dry-runs, installs, and typechecks one returned
      candidate while remaining pinned across a simulated `beta` advance.
- [x] UI and CLI package/release qualification remain green, and the SDK package graph is unchanged.

## Regression invariants

- Component source, class strings, CSS, DOM anatomy, behavior, preview loading, and registry install
  output do not change as a consequence of search indexing.
- Search ordering for one release and query is deterministic regardless of cache warmth or
  filesystem enumeration order.
- No hand-maintained per-item intent metadata or public taxonomy filter is introduced.
- A failed search artifact or code hydration cannot be reported as a successful empty match set.
