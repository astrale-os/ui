# Implementation plan

This plan is the executable decomposition of [MIGRATION.md](./MIGRATION.md). The migration ledger
owns phase semantics; this file owns concrete work order, changed repositories, commands, and
handoff gates.

## Repositories and isolated worktrees

| Repository | Target worktree | Owned changes |
| --- | --- | --- |
| `astrale-os/ui` | `/private/tmp/ui-public-v1-history-20260825` | package, specs, components, theme, registry, tests, workflows, release |
| `astrale-os/cli` | `/private/tmp/cli-public-ui-v1` | `astrale ui` command group, local tooling, tests, specs, skill |
| `astrale-os/sdk` | `/private/tmp/sdk-public-ui-v1` | optional generated React integration and zero-weight boundary proof |
| real GUI consumer | discovered exact-main worktree | migrate only live imports and desktop-specific ownership |

Do not edit dirty primary checkouts. Create the latter worktrees only when their owner slice starts.

## Work package 1 — Freeze executable authority

UI changes:

- add `packages/ui/.spec/api.d.ts`, exact `layout.ts`, public-only examples, package rationales, and
  the lock-file JSON Schema;
- add machine checks for exact exports, dependency direction, upstream closure, registry paths,
  legacy names, and archive contents;
- establish `pnpm check`, focused test commands, and one final `pnpm qualify`;
- add MIT `LICENSE` and third-party notice foundation; and
- record initial package/install/CSS measurements as evidence, not budgets.

Gate:

- target API and layout typecheck;
- every future public path has one declared owner;
- every observed upstream surface has one disposition; and
- no implementation claim is advanced yet.

## Work package 2 — Collapse package and theme

UI changes:

- replace the six-package workspace with `packages/ui`;
- move `cn` into `class-name`, remove public desktop constants/styles, and remove JavaScript Tailwind
  preset ownership;
- build theme contract, recipe stylesheet, opt-in reset, and Astrale/compact/expressive preset CSS;
- emit `.js`, `.d.ts`, and CSS under package-contained export targets;
- make CSS the only declared side effect; and
- add pack/import/Vite/SSR/archive/dependency tests.

Gate:

- clean packed root and subpath imports pass;
- theme import does not install preflight;
- dark, RTL, reduced-motion, and preset fixture checks pass; and
- package install graph contains no shadcn/chart/date/form/carousel/toast/theme-provider dependency;
  exact runtime icon dependencies remain unchanged from upstream.

## Work package 3 — Absorb runtime component owners

For each semantic batch:

1. obtain current candidate source through exact shadcn commands;
2. preserve the upstream source exactly while adapting imports and file ownership mechanically;
3. move the owner into the target family;
4. add its flat export and curated root export;
5. add focused behavior/API/a11y tests; and
6. update provenance and dependency rationale.

Batches:

- action, content, and feedback;
- input and disclosure;
- menu and navigation; and
- overlay and layout.

Move attachment, bubble, calendar, carousel, chart, combobox, marker, message, message-scroller,
questionnaire, sidebar, sonner, and `use-mobile` out of runtime ownership. Preserve their upstream
icons, classes, defaults, and behavior exactly; registry installation makes their dependencies and
source consumer-owned.

Gate:

- all package-target upstream rows are implemented and exposed;
- every direct runtime dependency has a real owner;
- root and subpath compile/import tests pass; and
- runtime contains no hidden browser persistence or application effects.

## Work package 4 — Registry patterns and blocks

UI changes:

- create root/family source registries with explicit includes;
- implement a useful V1 subset of every locked family in `REGISTRY-FAMILIES.md`, preserving distinct
  behavior rather than cosmetic duplication;
- provide at least two real variants per family and the higher-value chart/carousel/form/table/
  sidebar/message variants called out by the ledger;
- provide at least one complete, controlled composition for each block family and additional variants
  where the interaction materially differs;
- keep all I/O and application policy injected; and
- build, validate, dry-run, install, typecheck, and render every item from one manifest-derived
  inventory.

Gate:

- no singleton family masquerades as a family;
- every registry item installs independently with item-local dependencies;
- generated registry output is deterministic; and
- source scans reject private/deep/legacy imports and hidden I/O.

## Work package 5 — Catalog and browser evidence

UI changes:

- build a restrained editorial/technical catalog focused on component states and preset comparison,
  not a marketing site;
- render package components plus every registry item from public surfaces;
- add automated axe checks, keyboard/focus browser journeys, and stable Playwright screenshots for
  representative state/preset/mode/viewport combinations; and
- keep catalog/build/test dependencies private to the workspace root.

Gate:

- the catalog state inventory is closed;
- no serious/critical automated accessibility violation remains;
- visual baselines are deterministic and reviewed; and
- preset changes are materially coherent without component forks.

## Work package 6 — `astrale ui`

CLI changes:

- specify and register the UI command group without Kernel options;
- implement project discovery, exact UI version/ref resolution, compatibility lookup, lock
  validation, package-runner invocation, list/add dry-run, local-change refusal, doctor, and
  preset commands;
- delegate registry transformations to the exact release-qualified shadcn CLI via pnpm/npm/yarn/Bun
  on demand;
- preserve existing stdout/stderr JSON conventions and typed `AstraleError` codes;
- update program help digest, layout, package boundaries, skill documentation, and command tests.

Gate:

- local and machine journeys pass, including interruption/path/security failures;
- one operation reads one resolved repository SHA;
- failed operations do not advance the lock; and
- packed CLI dependencies contain no UI/shadcn/React/Base UI/Radix/Tailwind package.

## Work package 7 — Consumers and generator

Cross-repository changes:

- refresh exact consumer census;
- migrate the live GUI to packed `@astrale-os/ui` paths and move Dock/Taskbar/Window/macOS policy to
  its existing GUI/Shell owner;
- add explicit `create-astrale-domain --ui astrale|none` only if the packed UI/CLI journey is already
  green;
- keep SDK runtime and non-React generated variants UI-free; and
- run real consumer builds/tests from packed tarballs, not workspace source aliases.

Gate:

- no supported source/manifest/lock/test/CI reference resolves a legacy UI package;
- GUI and explicit Astrale React generation qualify;
- SDK and installed CLI dependency/size boundaries remain unchanged; and
- no compatibility package remains.

## Work package 8 — CI and release readiness

UI changes:

- replace one broad CI job with required contract/component/package/registry/consumer/browser/
  security/release-contract jobs backed by repository scripts;
- collapse Release Please to one package and `v<version>` tag authority;
- configure `publish.yml` for exact tag/SHA admission and OIDC public npm publication with no token
  fallback; and
- add public-registry clean-install observation as a post-publish gate.

Gate:

- local `pnpm qualify` covers the same supported semantics as CI;
- workflow contract tests reject private registry/token/multi-package regressions;
- exact release tarball can be produced reproducibly; and
- only repository visibility, trusted-publisher configuration, and the first V1 beta release remain.

## Work package 9 — Review and closure

1. Run an adversarial architecture/API/specification pass against target source and all real
   consumers.
2. Gather all source and test context, then launch the required independent test critic and gap
   finder in parallel.
3. Delete superficial/redundant tests, rewrite gamed tests, add critical/high missing cases, and fix
   implementation defects they expose.
4. Launch the critic again; repeat until no gamed/dead test remains.
5. Run focused checks, `pnpm qualify`, packed downstream qualification, stale-name/removal scans, and
   final scope inspection.
6. Update the migration/defect/acceptance ledgers only with exact observed evidence.

## Final handoff

Provide:

- exact revisions/worktrees and clean scope status;
- implemented public surface and registry inventory;
- test counts and strongest evidence level per surface;
- tarball file list, integrity, install graph, CSS and representative bundle measurements;
- CI/release workflow contract status;
- any external or environment-only gaps; and
- the exact first-prerelease/public-repository/trusted-publisher sequence for the user.
