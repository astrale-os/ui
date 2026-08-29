# Astrale UI request

`request/` is the private tooling owner for turning an accepted UI need into an evidence-backed
Astrale UI pull request. It never enters `@astrale-os/ui`, installed registry source, the SDK,
search artifacts, or consumer installs.

Durable orchestration contracts live in [`.spec`](./.spec/architecture.md). The managed-provider
Port and adapters live under [`agent/`](./agent/README.md). Earlier design evidence and remaining
product-level intake/preview gates remain in [`.history/v1`](./.history/v1/README.md).
The implemented managed-agent portability boundary is specified separately under
[`agent/`](./agent/README.md); it remains subordinate to the request workflow.

The intended boundary is deliberately small:

```text
free-text need -> public GitHub issue and maintainer discussion -> ui:ready
  -> reserved managed attempt -> provider-neutral run
  -> deterministic admission and visual evidence
  -> ordinary reviewable pull request
```

`pnpm request:check` runs the neutral/adapters/dispatcher contract suite. Add product refinements as
comments before applying `ui:ready`; comments from repository owners, members, and collaborators
are included chronologically, while public and bot comments are excluded. One label starts initial
work or revises the existing proposal from the trusted attempt record. Manual workflow dispatch
remains available for explicit reconciliation and cancellation.

```bash
gh issue edit 123 --repo astrale-os/ui --add-label ui:ready
```

Comments added after an attempt is reserved enter only the next labeled revision.

The default route dispatches the
credential-separated `UI Request Claude Code Worker`: Azure Foundry credentials exist only during
the proposal job, candidate code runs only in a separate credential-free qualification job, and
`UI_REQUEST_GITHUB_TOKEN` exists only in a fresh non-executing publisher job.
`UI_REQUEST_AGENT_PROVIDER` may instead select the qualified Copilot or Cursor adapter as trusted
configuration. Public issues and the CLI never carry those values.

Provider task success means only that one PR exists. Existing CI, provenance/license admission,
preview evidence, review, merge, release, and publication remain authoritative.
