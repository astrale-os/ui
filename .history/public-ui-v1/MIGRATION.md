# Ordered migration ledger

The migration is subtraction-first and gate-driven. A phase may be developed in smaller PRs, but a
later phase cannot claim qualification from incomplete earlier ownership or evidence.

## Phase 0 — Ratify public foundations

Status: `blocked`

Work:

- ratify one exact repository/package license and add `LICENSE`, manifest license, README terms,
  contribution/security policy, and third-party notice policy;
- approve making `astrale-os/ui` public before relying on its GitHub source registry;
- lock the first Public UI V1 prerelease version and tag convention;
- confirm `@astrale-os/ui` ownership in the public npm `@astrale-os` scope; and
- preserve the exact legacy baseline and consumer census.

Exit:

- `UI-D021` is ratified;
- no legal or repository-visibility contradiction remains;
- the public cutover can be tested without exposing secrets or unintended history; and
- a maintainer has approved the public boundary, not the implementation detail of each component.

## Phase 1 — Install migration guardrails

Status: `not-started`

Work:

- add target layout and public-export/dependency-direction checks;
- create pack/consumer fixtures and a registry validation/build harness;
- add upstream provenance format and mechanically compare the official docs/registry union with
  `upstream-components.tsv`;
- add a direct dependency ownership/rationale check; and
- establish initial install, tarball, CSS, and bundle measurements without turning them into
  budgets yet.

Exit:

- the target tree rejects undeclared legacy package roots and private deep imports;
- every official upstream surface is ledgered exactly once;
- packed-consumer failures are observable before component movement begins; and
- measurements are repeatable from one command in a clean temporary directory.

## Phase 2 — Establish the collapsed package and theme contract

Status: `not-started`

Work:

- create `packages/ui` with emitted JavaScript/declarations, flat exports, `class-name`, explicit CSS
  subpaths, clean `sideEffects`, and no install scripts;
- implement namespaced semantic tokens, stable `data-slot` anatomy rules, class-based dark mode,
  RTL, reduced motion, and an opt-in reset;
- implement the default preset plus candidate compact/expressive presets;
- create packed Node/Vite/SSR/style fixtures; and
- stop adding any new behavior to the six legacy packages.

Exit:

- package root, class-name, theme, reset, and preset subpaths pack and resolve;
- host styles are unchanged without `reset.css`;
- three presets are materially distinct in the catalog prototype rather than token aliases;
- no React/UI dependency enters SDK or CLI; and
- package performance baselines become proposed budgets only after review.

## Phase 3 — Intake and own package components

Status: `not-started`

Components move by semantic batch, not one giant upstream dump:

1. content, feedback, and action;
2. input and disclosure;
3. menu and navigation;
4. overlay and layout.

For every owner:

- retrieve the candidate through exact shadcn CLI `4.18.0` and the Base UI/Nova/Tailwind v4 profile;
- record provenance and digest;
- normalize public imports, slots, tokens, errors, controlled state, and dependency ownership;
- write public API/type, behavior, keyboard/focus, accessibility, visual, SSR, and package subpath
  evidence; and
- migrate the real GUI consumer slice where the owner is first needed.

Exit:

- every package-target row in `upstream-components.tsv` is `qualified`;
- the root and every flat subpath import from a packed clean consumer;
- direct dependencies have one real owner and no high-level optional library remains;
- root/subpath bundle evidence excludes unrelated owners; and
- catalog coverage spans every component state and qualified preset.

## Phase 4 — Build pattern families

Status: `not-started`

Work:

- create root/include registry manifests and the family trees in `REGISTRY-FAMILIES.md`;
- move/replace calendar, carousel, chart, form, sidebar, sonner/toast, command-dialog, and mobile
  behavior from the legacy runtime package;
- ingest missing combobox, data-table, date-picker, message, questionnaire, and typography families;
- implement every minimum V1 variant as an independent registry item; and
- enforce controlled/application-neutral behavior with item-local dependencies.

Exit:

- each family contains multiple qualified item variants;
- every item validates, builds, dry-runs, installs, typechecks, tests, and bundles in a clean fixture;
- installing an item adds only its declared dependency closure;
- sidebar/message/form/data items perform no hidden I/O; and
- no pattern source imports a private package path or legacy package.

## Phase 5 — Build blocks and the complete catalog

Status: `not-started`

Work:

- implement the minimum block compositions in `REGISTRY-FAMILIES.md`;
- split headless/controller logic from views when behavior warrants it;
- inject all application effects and policy;
- complete catalog examples and state matrices for package, pattern, block, and preset surfaces; and
- run the full preset/theme/accessibility/visual cross-product at supported breakpoints.

Exit:

- every V1 block installs as self-contained source from one repository SHA;
- blocks have no ambient router/auth/network/storage dependency;
- every catalog example builds against the packed package and built registry; and
- visual review proves presets alter the system coherently without behavior forks.

## Phase 6 — Deliver `astrale ui`

Status: `not-started`

Work:

- add the UI group and commands to the current CLI program owner and specification;
- add exact release/ref resolution, lock schema/admission, project discovery, process delegation,
  cancellation, dry-run/diff, machine output, and security checks;
- invoke the release-qualified shadcn version through the detected package runner on demand;
- update CLI help digest, skill documentation, release/package checks, and dependency boundary; and
- qualify pnpm, npm, yarn, and Bun consumer journeys.

Exit:

- every command and negative path in `CLI-AND-SDK.md` passes;
- the packed Astrale CLI dependency closure is unchanged by UI runtime or shadcn packages;
- all registry reads for an operation use one resolved commit;
- interrupted and failed operations leave no false lock or partial success; and
- `astrale ui add` is the catalog's canonical installation command.

## Phase 7 — Migrate consumers and remove legacy packages

Status: `not-started`

Work:

- refresh the consumer census at exact repository heads;
- migrate GUI from `@astrale-os/ui-components` to public package subpaths and registry source;
- relocate desktop-specific policy to GUI/Shell owners;
- prove Admin references are either real consumers to migrate or historical artifacts to leave
  untouched;
- add the explicit generator `--ui astrale|none` journey only after package/CLI qualification; and
- delete legacy package roots, workspace entries, release entries, aliases, and dependencies.

Exit:

- no supported source, lockfile, test, CI, docs, or package manifest resolves any legacy UI package;
- GUI and explicitly generated React applications qualify against packed `@astrale-os/ui`;
- SDK, custom frontend, and headless generated variants remain UI-free;
- the repository contains one versioned runtime package; and
- no compatibility facade or redirect package remains.

## Phase 8 — Required CI and release topology

Status: `not-started`

Work:

- install all required PR jobs in `CI-AND-RELEASE.md` and require them in branch protection;
- collapse Release Please to the one package and exact tag/release lifecycle;
- build release artifacts from the tag SHA with frozen dependencies and no mutable source link;
- generate SBOM, provenance-ready pack metadata, registry evidence, bundle/install reports, and
  retained visual artifacts; and
- configure `publish.yml` for public npm OIDC but keep it unable to publish until the package's
  trusted publisher exists.

Exit:

- release PR and exact release revision both complete the supported qualification graph;
- publish job has `id-token: write`, no npm write token, GitHub-hosted runner, current supported npm,
  and public registry configuration;
- workflow contract tests reject GitHub Packages as a source or manual token fallback; and
- the only remaining publication blocker is trusted-publisher and repository-visibility setup.

## Phase 9 — Trusted Public UI V1 prerelease

Status: `not-started-user-gate`

This is the first point at which the user is asked to act.

Public npm already contains the legacy `@astrale-os/ui` lineage through `0.2.1`, so no manual
package bootstrap is required or allowed.

1. Present the exact qualified SHA, tarball name, integrity, manifest, file list, dependency census,
   accepted CI run, and proposed Release Please beta lifecycle.
2. Ask the user to configure the npm trusted publisher for organization `astrale-os`, repository
   `ui`, workflow filename `publish.yml`, and allowed action `npm publish` (plus the chosen GitHub
   environment if one was ratified).
3. Complete the governance/history review, expose the repository, merge the implementation PR, and
   merge the resulting Release Please beta PR.
4. Observe the exact prerelease on public npm and install it in isolated pnpm and npm consumers with
   no GitHub Packages configuration.
5. Verify OIDC provenance and the dependent private GitHub Packages mirror; keep legacy `latest`
   unchanged.

Exit:

- the first Public UI V1 beta installs and executes from clean consumers;
- package page, provenance, repository, license, readme, exports, registry tag, and source SHA agree;
- no publishing token or manual bootstrap credential was introduced; and
- post-publish observations are retained rather than inferred from workflow dispatch.

## Phase 10 — Stable release

Status: `not-started`

Work:

- complete a real prerelease adoption window with GUI and generated-app consumers;
- close or explicitly defer every defect with evidence;
- review semver surface, preset names, registry addresses, CLI machine codes, and support policy;
- produce migration notes from private package names to the one public package and registry; and
- publish stable only from the trusted workflow.

Exit:

- `ACCEPTANCE.md` is entirely green at the exact stable tag;
- the public npm `latest` tag and GitHub release identify the same version/SHA;
- every supported example installs from public inputs only; and
- remaining work is new product evolution, not an incomplete V1 cutover.

## Phase update protocol

Each implementation PR updates this ledger with:

- exact source and upstream SHAs;
- defects and upstream rows advanced;
- focused commands and results;
- retained CI/visual/package/registry evidence links;
- dependency and size deltas;
- adversarial review result; and
- remaining blockers.

Queued CI, source-linked tests, registry dry runs, or a requested publish do not advance a phase to
qualified or published.
