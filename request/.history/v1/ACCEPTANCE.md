# Acceptance criteria

## Pre-ratification

- [x] Current package, registry, search, preview, CI, and release owners are inventoried.
- [x] The public journey has no classification, provider, agent, or model surface.
- [x] Shadcn discovery uses its documented API rather than directory scraping or a namespace list.
- [x] GitHub form submission, artifacts, deployment URL, and untrusted-workflow facts are backed by
      authoritative documentation.
- [x] Provenance, license, adaptation, duplicate, preview, and trust semantics have candidate
      owners.
- [ ] Query/context transport bounds are measured.
- [ ] The issue-form draft journey is proven on a disposable branch.
- [ ] Diff-derived intake closure is proven with a fixture candidate and corruptions.
- [x] An isolated live preview adapter is selected and qualified.
- [x] Untrusted candidate execution is structurally separated from privileged credentials.
- [ ] No unresolved decision can materially change the public API, infrastructure, or trust model.

## Implementation

- [x] `request/.spec/` contains only the ratified managed-execution consequences and typechecks
      strictly; broader intake design remains historical.
- [ ] One schema-valid retained intake record closes every new imported source path and output.
- [ ] Exact source and license digests, notices, and adaptation categories are enforced.
- [ ] No provider, family, component, pattern, block, or theme inventory is maintained by hand in
      request code.
- [ ] Existing Astrale coverage is searched before external discovery.
- [ ] Provider outage yields bounded partial research rather than a false clean result or global
      failure.
- [ ] Runtime-versus-registry placement is reviewable output, not requester input.
- [ ] Classes, CSS, tokens, DOM anatomy, behavior, accessibility, and copy remain source-faithful
      unless an explicit reviewed source-backed delta says otherwise.
- [ ] Every new visual entry has canonical preview/fixture closure and no manual catalog row.
- [ ] Registry build, search generation, package boundary, dependency closure, install, typecheck,
      and tests remain green.
- [ ] A failed preview or family remains isolated from all other catalog entries.

## CLI and collaboration

- [x] `astrale ui request <query>` opens the canonical prefilled form and truthfully requires user
      submission.
- [x] Headless/browser-open failure prints the same usable draft URL without claiming issue
      creation.
- [x] `--json` emits the same draft without browser side effects.
- [x] The CLI adds no GitHub token, secondary authentication, or GitHub SDK dependency.
- [x] The issue supports clarification without requiring implementation taxonomy.
- [x] Public submission cannot start unbounded agent work before trusted maintainer acceptance.
- [x] The agent opens one linked PR with required rationale, provenance, adaptations, evidence, and
      `Resolves #<request>`.
- [x] Maintainer PR comments update the same branch, evidence, and preview.
- [x] Two materially different managed provider adapters pass the child contract suite; trusted
      provider credentials are composed only in mutually exclusive isolated workflow steps.
- [x] Every accepted run survives coordinator restart through a persisted opaque run reference and
      succeeds only with one intended-repository PR.
- [x] An ambiguous dispatch outcome forbids retry/failover and production composition serializes
      the canonical request identity so one request/PR branch never has two non-terminal writers.
- [x] Provider/model/credential/environment/tool options remain absent from CLI, issue, and managed
      job input.

## Security and visual evidence

- [x] Candidate commands receive no GitHub token or repository/environment secret; checkout uses
      read-only permission with credential persistence disabled; preview uses an isolated origin.
- [x] Privileged workflows never execute candidate code or artifact-controlled commands; the
      preview publisher transfers only admitted revision-bound static bytes through fixed pinned
      code.
- [x] Each changed visual preview has deterministic screenshot evidence.
- [x] The PR exposes an auto-refreshed direct playground URL at the exact candidate preview.
- [ ] Preview output has no production cookies, bindings, storage, APIs, or credentials and expires
      on PR close.
- [ ] Native playground HMR and direct-link behavior remain green locally.

## End-to-end and release

- [ ] A real need completes request -> issue -> agent research -> PR -> review iteration -> refreshed
      evidence -> merge. Issue through merge is proven by #96/#97; the deployed UI Domain submission
      prefix is currently unavailable.
- [ ] The merged addresses equal package/registry/search/catalog identities without manual repair.
- [ ] A clean external project finds the entry through `astrale ui search`, adds it, typechecks it,
      and owns the installed source.
- [ ] Publication occurs only through the existing release workflow and is separately verified.
- [x] Final adversarial semantic and test-quality reviews have no unresolved local Critical or High
      gap; the selected live provider completed the disposable workflow-to-PR qualification.
