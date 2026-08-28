# Goal

Provide one agent-native discovery command that translates free-text UI intent into a short,
relevant, immediately usable candidate set:

```bash
astrale ui search "editable payment table with export"
```

Every returned candidate includes exact demo code and either the source-install command or the
runtime package import. An agent does not need to understand Astrale's internal component,
pattern, block, theme, provider, or package ownership taxonomy.

## Required outcome

1. Search the closed union of every current registry item and every visual runtime component.
2. Preserve the app's immutable UI release lock; outside an initialized app, use the current npm
   `beta` release.
3. Return five candidates by default with deterministic pagination and code for each candidate.
4. Keep warm retrieval blazingly fast at the current corpus and at deterministic 10x and 100x
   workloads.
5. Generate all search evidence mechanically from current manifests, canonical code, and package
   exports. Do not maintain per-component intent tags, aliases, or capability records.
6. Keep the search artifact and engine replaceable so semantic or hybrid retrieval can be added
   without changing the public command or response.
7. Remove `ui list` without retaining a deprecated or hidden public alias once the new journey is
   qualified.

## Ratification boundary

This initiative pauses before production implementation. Ratification requires the candidate
contract to be coherent, the POC risks to be measured, residual decisions to be explicit, and the
acceptance mapping to be reviewable. Ratification then promotes the accepted contract from this
history directory into `search/.spec/`.

## Non-goals

- no hosted search service, database, daemon, service worker, or custom bundler;
- no vector embeddings or query-time model dependency in V1;
- no public type/classification filters, `list`, `inspect`, or search-score output;
- no hand-authored per-item keywords, synonyms, intent ontology, or ranking exceptions;
- no modification of imported component source, CSS, classes, DOM, or behavior;
- no coupling to shadcn-specific item names that would prevent another registry provider;
- no SDK dependency on UI or search artifacts; and
- no incremental indexer until full deterministic rebuild cost demonstrates a real problem.
