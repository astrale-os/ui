# Public UI V1 acceptance

All unchecked criteria are target obligations. A check requires exact revision evidence recorded in
the migration ledger; prose agreement is not evidence.

The exact pre-publication cohort and locally passed subset are now recorded in
[PREPUBLICATION-HANDOFF.md](./PREPUBLICATION-HANDOFF.md). This checklist intentionally remains the
stable-release contract: local tarball evidence does not check public npm, provenance, remote CI,
branch protection, post-public generator/consumer, or manual assistive-technology obligations.

## A. Repository and ownership

- [ ] The repository is public only after the license, notice, secret/history, contribution,
      security, and governance review passes.
- [ ] The repository has exactly one publishable runtime workspace package: `@astrale-os/ui`.
- [ ] Legacy `components`, `styles`, `preset`, `utils`, `constants`, and umbrella package roots are
      absent after cutover, not retained as aliases.
- [ ] The exact target tree and dependency-direction checks pass.
- [ ] No generic `primitives`, `common`, `shared`, `helpers`, or `utils` responsibility bucket exists;
      the narrow public `class-name` owner is the only class-merging utility.
- [ ] Desktop/Shell policy names and imports are absent from package and registry production source.
- [ ] Every direct dependency has one manifest owner, source owner, and recorded rationale.
- [ ] No dependency is present only because shadcn originally generated an import that Astrale no
      longer uses.

## B. Public package API and archive

- [ ] `package.json` name, repository, license, engines, peers, side effects, files, exports, and
      public npm configuration match the target contract.
- [ ] Source and published export maps are mechanically equivalent.
- [ ] Every public export target is inside the packed archive and exists with its expected kind.
- [ ] Root, flat component, `class-name`, `theme.css`, `reset.css`, and preset subpaths resolve from a
      clean packed install.
- [ ] No public path exposes internal semantic family names or a private file.
- [ ] Root and subpath declarations compile in strict TypeScript consumer fixtures.
- [ ] Plain Node imports every server-safe ESM subpath without extension or source-path failure.
- [ ] Client-only owners reject or document unsupported server evaluation without breaking import
      of unrelated server-safe subpaths.
- [ ] Vite and SSR fixtures build without aliases to the repository or workspace.
- [ ] The tarball contains only emitted public code/CSS, README, license, notices, schemas, and
      package metadata.
- [ ] The tarball contains no test, catalog, history, source map, workspace checker, install script,
      secret, registry credential, or absolute path.
- [ ] `npm pack --dry-run` file inventory and integrity are retained as CI artifacts.
- [ ] A button-only bundle excludes unrelated overlay, date, carousel, chart, form, toast, sidebar,
      pattern, and block code.
- [ ] A dialog-only bundle includes only its real dependency closure.
- [ ] Importing package root has no browser, storage, cookie, network, theme-persistence, or analytics
      side effect.

## C. Runtime dependency and size discipline

- [ ] `shadcn` is absent from runtime dependencies and peers.
- [ ] Chart, date, calendar, carousel, form, validation, toast, theme-provider, router, AI, upload,
      markdown, and desktop libraries are absent from the base runtime dependency closure.
- [ ] A general-purpose icon library is absent from the runtime dependency closure; required
      control glyphs are owned, minimal, semantic, and replaceable through explicit slots.
- [ ] `@base-ui/react` is the sole primitive engine; no Radix package remains in source, manifests,
      lockfiles, declarations, or the packed dependency closure.
- [ ] Every component-specific external package is used by its owner and cannot be replaced by a
      smaller native/public owner without semantic loss.
- [ ] Clean npm and pnpm installations record package count, unpacked bytes, tarball bytes, CSS
      bytes, representative bundle bytes, and install time.
- [ ] Budgets are ratified from the first lean qualified baseline with semantic workloads, then
      enforced without hiding optional dependencies or changing lockfile topology.
- [ ] Budget checks fail above the accepted threshold and report the introducing dependency/files.
- [ ] The SDK and installed Astrale CLI size/dependency snapshots are unchanged by UI integration.

## D. Theme, presets, CSS, and visual character

- [ ] Semantic variables are namespaced and documented by role rather than raw color or product
      owner.
- [ ] The contract spans color, typography, density, sizing, radius, border, shadow, motion, focus,
      layering, and component character.
- [ ] Every component exposes stable, documented `data-slot` anatomy and state attributes.
- [ ] Component recipes consume semantic tokens; scans reject unapproved raw brand colors,
      one-off radii, shadows, z-indexes, and geometry.
- [ ] `theme.css` contains no Tailwind preflight/reset and does not restyle arbitrary host elements.
- [ ] `reset.css` is opt-in and its exact host effects have tests.
- [ ] Light/dark is class-based and computed styles prove both modes after CSS compilation.
- [ ] RTL behavior passes for direction-sensitive controls and overlays.
- [ ] Reduced-motion behavior disables or reduces nonessential animation without removing feedback.
- [ ] High-contrast/focus-visible presentation remains perceivable in every preset.
- [ ] At least three initial presets are visibly and structurally distinct across the complete
      catalog, not merely alternate color palettes.
- [ ] Preset application changes CSS/config only and never rewrites component behavior source.
- [ ] Switching presets leaves public props, DOM semantics, keyboard behavior, focus, and state
      transitions invariant.
- [ ] No React theme provider or persistence library is required to use package styling.
- [ ] Product icons can be replaced through explicit component-object slots without a global icon
      registry, string lookup, or component fork.
- [ ] Every visual runtime part accepts host `className` and `style`; Base-backed parts preserve
      `render` composition, and composite convenience wrappers expose props for internally emitted
      portal, backdrop, positioner, popup, indicator, arrow, and close parts where applicable.
- [ ] Patterns and blocks expose a root class/style plus stable part slots or class/prop maps; no
      frozen, module-private style object is the only route to customization.
- [ ] CSS import order, Tailwind v4 integration, host overrides, and multiple application roots are
      documented and tested.

## E. Component behavior

Every interactive owner must cover the applicable rows below with user-observable tests:

- [ ] controlled and uncontrolled state;
- [ ] default state and prop updates;
- [ ] keyboard navigation, activation, escape, home/end, arrows, typeahead, and tab order;
- [ ] pointer/touch activation and outside interaction;
- [ ] focus entry, trapping where modal, restoration, and disabled-focus exclusion;
- [ ] portal mounting and nested overlay stacking without manual consumer z-index;
- [ ] labels, descriptions, errors, required/invalid/disabled/read-only attributes;
- [ ] single/multiple/indeterminate/range selection where supported;
- [ ] grouping and required composition rules;
- [ ] open/close transition callbacks and cancellation;
- [ ] form submission and native element behavior where relevant;
- [ ] empty, loading, overflow, long text, dynamic content, and unmount states;
- [ ] SSR render and hydration without mismatch for supported owners;
- [ ] StrictMode behavior and cleanup of listeners/timers;
- [ ] RTL and reduced motion where meaningful; and
- [ ] no application I/O, persistence, or ambient singleton state.

Specific high-risk proofs:

- [ ] Dialog, alert dialog, sheet, drawer, popover, tooltip, hover card, and menus prove focus and
      dismissal behavior, including nesting.
- [ ] Select, radio, checkbox, switch, slider, tabs, accordion, toggle group, and command prove their
      exact selection/keyboard contracts.
- [ ] Input OTP proves paste, deletion, focus movement, invalid, and disabled behavior.
- [ ] Navigation and breadcrumb remain router-neutral.
- [ ] Resizable remains persistence-free and keyboard operable.
- [ ] Direction changes structure without creating a second component implementation.

## F. Accessibility

- [ ] Every catalog state runs automated axe checks with zero accepted critical or serious
      violations; exceptions require exact issue, owner, expiry, and manual proof.
- [ ] Accessible names, roles, states, relationships, live regions, errors, and descriptions match
      the component contract.
- [ ] All interactive journeys complete using keyboard only.
- [ ] Focus order and visible focus are manually reviewed for overlays, composite widgets, forms,
      tables, carousels, charts, sidebars, and blocks.
- [ ] Screen-reader smoke checks cover the highest-risk composite widgets in at least two major
      screen-reader/browser combinations before stable.
- [ ] Charts provide non-color identification and an accessible text/table summary.
- [ ] Carousels expose position, controls, pause behavior, and motion-safe autoplay.
- [ ] Toasts use appropriate live-region priority and do not steal focus.
- [ ] Errors are associated with controls and are not conveyed by color alone.
- [ ] Touch targets, zoom/reflow, contrast, forced colors, text spacing, and 200%/400% layouts meet
      the ratified accessibility target.

## G. Upstream intake

- [ ] The mechanical inventory equals the union of the current official 64 documentation surfaces
      and 62 registry items, including docs-only and registry-only differences.
- [ ] No row in `upstream-components.tsv` remains merely `observed` at V1 completion.
- [ ] Every ingested owner records exact shadcn CLI version, Base UI base and version, Nova style, Tailwind version,
      source item, retrieval date, and content digest.
- [ ] Upstream source is retrieved through qualified shadcn commands, never copied from a moving raw
      URL.
- [ ] Astrale normalization and intentional deviations are reviewable.
- [ ] License and third-party notices cover all retained upstream code.
- [ ] An upstream refresh intentionally updates the CLI pin, detects new/removed items, and refuses
      to overwrite Astrale-owned changes.

## H. Pattern families

- [ ] Every family in `REGISTRY-FAMILIES.md` contains its minimum independent V1 item set.
- [ ] Each family manifest validates and has unique stable slashful item names.
- [ ] Each item installs from one resolved repository commit SHA.
- [ ] Production source imports only public `@astrale-os/ui` paths, item-local files, and declared
      npm dependencies.
- [ ] Installing one item installs no unrelated family dependency.
- [ ] All application-significant values have controlled props or injected adapters.
- [ ] Headless/controller logic has behavior tests separate from view snapshots.
- [ ] Calendar variants cover single/range, controlled state, multi-month, disabled dates, and
      localization.
- [ ] Carousel variants cover horizontal/vertical, controlled state, responsive sizing, keyboard,
      reduced motion, and opt-in autoplay.
- [ ] Chart variants cover the minimum type matrix, responsive behavior, semantic palettes,
      interaction, empty data, invalid data, accessibility summaries, and formatter injection.
- [ ] Form variants prove dependency isolation and equivalent error/submit/reset semantics across
      adapters.
- [ ] Sidebar injects persistence, shortcut, breakpoint, and navigation ownership and has no direct
      cookie/storage/media/router effect.
- [ ] Message and questionnaire patterns are transport/submission neutral.
- [ ] Data-table server-controlled variants perform no data request.
- [ ] Toast variants prove live-region, queue, action, promise, and dismissal behavior.

## I. Blocks

- [ ] Every initial block family contains the minimum compositions in `REGISTRY-FAMILIES.md`.
- [ ] Blocks install as self-contained source with no moving same-repository dependency.
- [ ] Authentication blocks receive submit/provider/error state; they do not authenticate users.
- [ ] Dashboard/data blocks receive all data and mutations; they do not fetch.
- [ ] Application shell blocks receive routes/location/actions; they do not import a router.
- [ ] Communication blocks receive messages/send/upload actions; they own no transport or storage.
- [ ] Settings/onboarding blocks receive persistence and navigation actions.
- [ ] Loading, empty, error, partial, permission-denied, destructive, narrow, and overflow states are
      represented where meaningful.
- [ ] Blocks remain usable when consumers replace their controller with direct controlled props.

## J. Registry build and install

- [ ] Root `registry.json` has exact metadata and explicit includes for all family registries.
- [ ] Source and built registries validate against current official schemas.
- [ ] Duplicate names, invalid types, missing files, traversal, remote source paths, absolute targets,
      and cycles reject.
- [ ] `shadcn build` produces deterministic built JSON from identical source/lock inputs.
- [ ] Built output is compared by digest and retained as release evidence, not hand-edited.
- [ ] Every item passes `view`, add dry-run, add, repeat add, diff, local edit, deletion, and explicit
      overwrite cases.
- [ ] Every installed item typechecks, tests, lints, builds, and renders in a fresh supported fixture.
- [ ] Registry fixtures cover common alias layouts and project paths containing spaces.
- [ ] Network/ref failure, malformed payload, oversized payload, interrupted install, and dependency
      failure preserve prior files and lock truth.
- [ ] Installed output contains no repository path, test fixture, secret, telemetry, or undeclared
      environment requirement.

## K. `astrale ui`

- [ ] The exact command tree and help digest includes every locked UI command and no accidental
      command.
- [ ] Command specification, implementation, tests, skill documentation, and examples agree.
- [ ] `init` supports clean and existing shadcn React/Tailwind v4 projects without destroying
      unrelated configuration.
- [ ] `init --dry-run` performs no write or dependency install.
- [ ] Repeated `init` is a no-op when exact desired state already exists.
- [ ] `list`, `view`, and `add` without args have useful interactive behavior; `--ci` never prompts.
- [ ] `add` accepts multiple items and reports the complete transitive file/dependency plan.
- [ ] All operations resolve one release ref to one 40-character commit and read only that snapshot.
- [ ] `astrale-ui.lock.json` validates structurally and semantically before use.
- [ ] Lock advancement happens only after successful dependency/file operations.
- [ ] Diff detects unchanged, modified, deleted, and upstream-changed files.
- [ ] Local source is never overwritten without explicit `--overwrite` plus confirmation or `--yes`
      in CI.
- [ ] Cancellation and child failure settle without orphan process or false success.
- [ ] JSON output and stable rejection codes pass contract tests; errors redact secrets.
- [ ] pnpm, npm, yarn, and Bun runner construction and supported journeys qualify.
- [ ] The CLI package gains no shadcn or UI dependency and invokes the exact release-qualified
      shadcn version rather than `latest`.

## L. Consumers, SDK, and generator

- [ ] A refreshed cross-repository census identifies every live manifest, source import, lockfile,
      test, CI, and documentation consumer.
- [ ] GUI migrates through packed public paths and qualifies its supported application suite.
- [ ] Desktop-specific UI moves to GUI/Shell semantic owners with no public package leakage.
- [ ] No live consumer resolves any legacy UI package after cutover.
- [ ] `@astrale-os/sdk` manifest, exports, declarations, install graph, tarball, and size contain no UI
      change.
- [ ] `create-astrale-domain --ui none` generates the same UI-free runtime boundary as before.
- [ ] Explicit Astrale React generation installs the packed UI package, uses only public paths,
      passes `astrale ui doctor`, and typechecks/tests/builds/packs.
- [ ] Custom and headless generated variants contain no React or UI dependency.
- [ ] Generated projects use public registry/npm topology during final qualification, not workspace
      links or private GitHub Packages.

## M. CI, security, and supply chain

- [ ] Required CI jobs match `CI-AND-RELEASE.md` and branch protection requires them.
- [ ] Dependencies install from a frozen lockfile under each supported Node version.
- [ ] Actions and shared workflows are pinned to reviewed immutable revisions.
- [ ] Dependency review, production audit, license scan, secret scan, and CodeQL/static security
      analysis have explicit policies and retained reports.
- [ ] Registry content receives the same code review/security checks as package source.
- [ ] No workflow logs package registry credentials or source contents that may contain secrets.
- [ ] Visual artifacts and diffs are retained for review; baseline updates require explicit approval.
- [ ] Tests that access the network use explicit fixtures or exact immutable sources and classify
      network failure separately from product failure.
- [ ] Release qualification runs from an exact clean tag revision, not a dirty workspace or moving
      branch.

## N. Release and public npm

- [ ] Release Please has one package/version/changelog/tag authority.
- [ ] Release PRs pass the complete required gate set before merge.
- [ ] `publish.yml` has `contents: read` and `id-token: write`, uses a GitHub-hosted runner and a
      trusted current npm version, and contains no npm write token fallback.
- [ ] Publish checks out and verifies the exact release tag/SHA, installs frozen dependencies,
      qualifies, packs once, and publishes that exact archive.
- [ ] The first Public UI V1 prerelease occurs only through the trusted workflow after every
      technical gate is green and the user receives exact SHA/tarball/integrity evidence.
- [ ] The user configures npm trusted publishing for `astrale-os/ui`, repository `ui`, workflow
      `publish.yml`, and the ratified allowed action/environment.
- [ ] The V1 beta proves OIDC publication and automatic provenance before stable.
- [ ] Traditional automation token publishing remains disabled; no bootstrap credential is created.
- [ ] Public npm version, dist-tags, integrity, provenance, repository, license, README, GitHub tag,
      and source SHA agree.
- [ ] Independent clean npm and pnpm consumers install by exact version and dist-tag, import package
      paths, build an app, and install a registry item.
- [ ] Public registry qualification does not use `.npmrc` scope redirects or GitHub Packages.
- [ ] Stable `latest` is assigned only after the prerelease adoption and all acceptance criteria.

## Completion statement

Public UI V1 is complete only when all sections are checked against one exact stable tag and no
mapped defect or blocking decision remains. Green source tests alone are not package, registry,
accessibility, visual, public npm, provenance, or downstream evidence.
