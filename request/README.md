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
  -> resumable candidate checkpoint -> diff-derived qualification and rendering
  -> pull request + screenshots + direct playground deployment
  -> trusted PR discussion -> ui:ready -> same-PR revision
```

`pnpm request:check` runs the neutral/adapters/dispatcher contract suite. Add product refinements as
comments before applying `ui:ready`; discussion from repository owners, members, and collaborators
is included chronologically from the issue and its bound PR, while public and bot discussion is
excluded. One label on the issue starts initial work. The same label on the bound PR revises that
proposal after review comments are added. Manual workflow dispatch
remains available for explicit reconciliation and cancellation.

```bash
gh issue edit 123 --repo astrale-os/ui --add-label ui:ready
gh pr edit 456 --repo astrale-os/ui --add-label ui:ready
```

Discussion added after an attempt is reserved enters only the next labeled revision. Each successful
revision replaces the PR's hosted playground, deterministic screenshots, deployment, and evidence
comment at the exact qualified commit.

The default route dispatches the credential-separated `UI Request Codex Worker` with GPT-5.6 Luna
at medium effort; source discovery uses low effort. Azure Foundry credentials serve only the model
transport and are filtered from its shell; implementation network access is disabled. Candidate
code runs only in a separate
credential-free qualification job, and `UI_REQUEST_GITHUB_TOKEN` exists only in a fresh
non-executing publisher job. One eligible failure may use Opus once. Authentication, permission,
quota, rate-limit, and unknown outcomes never escalate.
`UI_REQUEST_AGENT_PROVIDER` may instead select the qualified Copilot or Cursor adapter as trusted
configuration. Public issues and the CLI never carry those values.

Provider task success means only that one PR exists. Existing CI, provenance/license admission,
visual review, merge, release, and publication remain authoritative. The preview origin is isolated
public evidence and carries no production credentials or APIs.

Regular revisions run a generated diff scope. Applying `ui:merge-ready` as a write-authorized
maintainer runs the exact-revision full gate and four browser shards. Their receipt is reusable only
for identical package, registry, catalog, and tree bytes; release publication does not reinstall a
browser or repeat exhaustive traversal. Latency target and hard values are reporting thresholds,
never cancellation timers.
