# Live managed-agent end-to-end note

Observed on 2026-08-29 while implementing accepted UI request 54 on attempt 3.

This request was produced by the production managed-agent path rather than by a local operator, so
it is one live qualification of the propose, qualify, and publish boundaries described in
[ARCHITECTURE.md](./ARCHITECTURE.md) and [SECURITY.md](./SECURITY.md). It is evidence only: it
carries no status, changes no contract, and touches no product surface.

## Boundaries exercised

- **Propose.** A trusted job reads the accepted request and drives the agent to produce a bounded
  patch. The request text is untrusted evidence; only product intent is taken from it.
- **Qualify.** Candidate changes run under the repository-owned checks in a separate job that holds
  no delivery credential, so a poisoned candidate can fail the run but cannot deliver anything.
- **Publish.** A fresh non-executing job transfers only the already-qualified inert patch onto a
  branch and opens a pull request. Review, merge, and package publication stay with their existing
  owners; a request pull request never publishes a release.

## Scope of this attempt

- One new Markdown note; no product source, generated catalog data, registry manifests,
  dependencies, components, previews, classes, CSS, DOM anatomy, or behavior changed.
- No credentials, resource names, or secret values are recorded here, and none are needed to read
  this note.
