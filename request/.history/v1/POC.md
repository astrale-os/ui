# Reconnaissance and risk POCs

Observed on 2026-08-28 from UI revision `6f73c351c7ec2225fa9acbe7a7a4f444a40c43ce`.

## Existing Astrale seams

- The repository is clean at the same local and `origin/main` revision.
- The existing registry source, family manifests, package exports, search corpus, and catalog
  previews already provide generated closed-set owners. Request does not need another catalog.
- Playground direct links already use `?preview=<encoded address#scene>`, support native
  history/scroll restoration, and isolate preview failures.
- Current GitHub workflows build and exhaustively traverse the playground and upload artifacts, but
  the repository has no configured Pages or PR preview deployment.
- Existing upstream records prove that digested source/provider intake already has a repository
  precedent, but the shapes are provider-specific and do not consistently retain exact license
  evidence. The request record must close that gap rather than create another parallel provenance
  convention.

## Shadcn directory/API POC

Authoritative documentation:

- <https://ui.shadcn.com/docs/registry/api-reference>
- <https://ui.shadcn.com/docs/registry/registry-index>
- <https://ui.shadcn.com/r/registries.json>

Findings:

- `shadcn/registry` is a documented stable programmatic API; CLI command internals are explicitly
  not stable API.
- `getRegistries()` discovers the current namespace directory.
- `searchRegistries()` supports query, pagination, type narrowing, custom config, and
  `continueOnError` for partial-provider failure.
- Public GitHub registries can be addressed without being listed in the directory.
- The live directory contained 290 registry entries during the POC: 231 healthy, 20 degraded, 5
  observing, and 34 unavailable. All 290 had health observations; none had a top-level license
  field. A live search against one unavailable provider timed out.
- Directory health and item metadata do not establish item-level license rights.

Consequence: use the programmatic API as one dynamic discovery adapter; never scrape the directory
UI, bake its namespaces into code, or stop wider web research at directory results.

## GitHub submission POC

Authoritative documentation:

- <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-a-url-query>
- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema>

Findings:

- A GitHub issue URL can select a template and prefill issue-form fields by their stable IDs.
- GitHub currently documents issue forms as public preview, so the adapter needs a focused
  compatibility test rather than becoming semantic authority.
- The browser uses the user's existing GitHub session; Astrale CLI needs no GitHub token.
- The URL may fail with `414 URI Too Long`, so query/context size must be measured before a hard
  limit is ratified.
- Opening a URL does not create an issue. The CLI contract must call it a draft until submission.

Consequence: the issue-form URL is the smallest viable V1 submission adapter. Direct API creation
is deferred until there is a real need for a separate authenticated transport.

## Evidence and preview POC

Authoritative documentation:

- <https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts>
- <https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/deploy-to-environment>

Findings:

- GitHub artifacts are suitable for screenshots and built-playground evidence and have explicit
  retention.
- A workflow environment URL appears as a PR `View deployment` action, providing a provider-neutral
  seam for a live preview.
- Artifacts are not themselves a durable public live application URL.

Consequence: require screenshot artifacts and a GitHub deployment URL; select the static preview
host as an implementation adapter before ratification.

## Untrusted workflow POC

Authoritative documentation:

- <https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target>

Finding: GitHub explicitly warns that executing PR code from `pull_request_target`, privileged
`workflow_run`, or equivalent credential-bearing workflows creates a supply-chain compromise path.

Consequence: candidate execution is exclusively unprivileged `pull_request` work. Privileged jobs
may handle metadata only and never consume candidate code or its artifacts.

## POCs still required before ratification

1. Measure a practical issue-form prefill bound across Unicode and reference URLs; decide whether
   the public command needs only `query` or a bounded optional context field.
2. Create a disposable issue-form branch and prove human mode, `--json`, URL encoding, cancellation,
   and truthful draft semantics without changing the released CLI.
3. Build one fake new registry entry from an existing MIT fixture and prove diff-derived provenance
   closure, adaptation reporting, duplicate detection, generation, install, and removal.
4. Select and qualify one isolated static preview adapter; prove head-revision refresh, exact direct
   link, no production credentials/origin, screenshot artifact, and PR-close cleanup.
5. Run an adversarial workflow test showing candidate source and package scripts cannot observe a
   privileged token or secret, while the base-controlled publisher can transfer only admitted
   static bytes without executing artifact-controlled input.
