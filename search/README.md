# Astrale UI search

This top-level owner generates the immutable Astrale UI discovery artifacts consumed by
`astrale ui search`. It is intentionally separate from the runtime package, source registry,
playground, and CLI:

- registry manifests and runtime exports own what exists;
- `search` derives searchable evidence from those authorities;
- the CLI owns release resolution, integrity-admitted caching, free-text retrieval, presentation,
  canonical demo hydration, and handoff to `astrale ui add`;
- component source, classes, CSS, DOM anatomy, and behavior remain untouched.

Durable contracts live in [`.spec`](./.spec/architecture.md). Design evidence and the delivery
ledger remain in [`.history/v1`](./.history/v1/README.md).

`pnpm search:build` regenerates `search/public` from the authoritative runtime exports, registry
manifests, and canonical demos. `pnpm search:check` proves closed-set equality, deterministic
output, path safety, ranking behavior, adaptive partition parity, and specification conformance.
The generated data is served by exact Git commit and is deliberately excluded from the public
`@astrale-os/ui` npm package and SDK graph.
