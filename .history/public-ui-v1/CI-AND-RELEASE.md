# CI and release design

## One local qualification vocabulary

Repository scripts, not workflow YAML, own test composition:

```text
pnpm check                 format, lint, typecheck, ownership, exports, manifests
pnpm test:components       behavior and public API tests
pnpm test:accessibility    automated accessibility plus catalog state census
pnpm test:registry         schema, deterministic build, item and negative-path tests
pnpm test:consumers        pack and clean install/build/import fixtures
pnpm test:visual           browser screenshot matrix and approved baselines
pnpm test:security         dependency, license, secret, path and payload policy checks
pnpm qualify               every supported local non-live gate above
```

CI may shard a command for latency, but a local `pnpm qualify` on the same revision must exercise
the same semantic obligations. Workflow-only hidden test logic is forbidden.

## Pull request workflow

Target `ci.yml` uses frozen dependencies, minimum permissions, immutable reviewed actions, and
concurrency cancellation for superseded PR revisions.

| Required job       | Matrix                                                                    | Owns                                                                                                                                | Retained evidence                                               |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `contracts`        | Node 24 and 26                                                            | format, lint, strict types, layout, dependency direction, export equivalence, upstream inventory, registry schema, release contract | diagnostics and inventories                                     |
| `components`       | Node 24                                                                   | unit/behavior/public API/SSR-hydration suites                                                                                       | test report and coverage by owner, not one global percentage    |
| `accessibility`    | Chromium plus targeted Firefox/WebKit smoke                               | axe catalog census, keyboard/focus automated journeys, semantic snapshots                                                           | HTML/JSON report and failures                                   |
| `package`          | Node 24 and 26                                                            | build, pack, archive allowlist, ESM imports, CSS inspection, side effects, dependency rationale, SBOM                               | exact tarball, file list, integrity, CSS and dependency reports |
| `registry`         | sharded by family                                                         | source validate/build/determinism; view/dry-run/add/diff; every item typecheck/test/build; malicious/rollback cases                 | built registry digest and per-item install report               |
| `consumers`        | pnpm and npm required; yarn/Bun CLI construction plus scheduled full runs | clean public-topology install from packed tarball; Vite/SSR/root/subpath/bundle/generated-app fixtures                              | install graph, bundle reports, logs                             |
| `visual`           | presets x light/dark x selected RTL/reduced-motion x desktop/mobile       | component, pattern, and block state screenshots                                                                                     | Playwright report, diff images, baseline identity               |
| `security`         | Node 24                                                                   | production audit, dependency review, license/notice, secret scan, CodeQL/static checks, registry path/payload policy                | machine reports and SBOM                                        |
| `release-contract` | Node 24                                                                   | Release Please single-version authority, exact-tag dispatch, trusted-publisher workflow, no token/private-registry fallback         | workflow contract test                                          |

All jobs are branch-protection requirements. `visual` may use an explicit reviewed baseline-update
mechanism, but cannot silently accept differences on `main`. Fork PRs run read-only and receive no
repository or registry credential.

## Test topology details

### Components

- Colocate owner behavior tests beneath the smallest semantic owner.
- Test through public behavior and DOM semantics, not Base UI internals.
- Use fake timers only for time-owned behavior and always settle them.
- Test both controlled and uncontrolled modes where both are promised.
- Run high-risk composite widgets with real browser focus in addition to DOM simulation.
- Coverage gates are owner obligations from `ACCEPTANCE.md`; a global line threshold cannot hide an
  untested component.

### Accessibility

- The catalog exports a closed machine-readable state manifest.
- CI fails when a component/item/preset is missing expected catalog states.
- Axe is one layer; keyboard/focus, screen-reader smoke, reflow, contrast, motion, and forced-color
  review remain distinct evidence.
- Accessibility exceptions require an issue, exact affected states, mitigation, owner, and expiry.

### Visual

- Baselines identify package version, browser, viewport, DPR, preset, color mode, direction, motion,
  font, and story state.
- Fonts and animations are deterministic before capture.
- A baseline update is reviewed as a product change and carries the relevant component/item owner.
- Screenshot green does not replace behavior or accessibility evidence.

### Package and consumers

- Build once, pack once, and pass the same tarball to every fixture.
- Use isolated temporary homes, caches, npm configuration, and project directories.
- Public-topology fixtures explicitly set `@astrale-os:registry=https://registry.npmjs.org` or use an
  isolated config with no scope override.
- Fail if a workspace link, source checkout, private registry, absolute path, or undeclared peer
  satisfies the consumer.
- Keep source-pack and public-registry qualification separate in reports.

### Registry

- Build source manifests through the exact shadcn CLI.
- Diff built outputs to prove deterministic generation; never commit hand-edited built items.
- Each item fixture starts from a clean supported `components.json` profile.
- Shard by stable family address and publish a complete closure report proving no item was skipped.
- Rerun failure/timeout-sensitive items serially before classifying a product defect.

## Release Please

After legacy deletion, Release Please owns one package:

```text
packages/ui/package.json version
        = release manifest version
        = changelog version
        = GitHub tag v<version>
        = npm @astrale-os/ui version
```

Release PRs run the same required CI as ordinary PRs. A release cannot be created from a revision
whose required checks are queued, skipped, cancelled, or stale.

`release.yml`:

1. runs on `main` and optional manual recovery;
2. creates/updates the Release Please PR or exact GitHub release;
3. when a release is created, extracts exact tag and target SHA from Release Please output;
4. dispatches `publish.yml` with both values and the tag ref;
5. captures the dispatched run ID and waits for its terminal result; and
6. never treats dispatch acceptance as publication success.

The normal and recovery paths use the same exact tag/SHA admission. Recovery can re-dispatch an
unpublished immutable version; it cannot rebuild a different archive under an existing version.

## Trusted publish workflow

Target `.github/workflows/publish.yml` is the sole automated public npm publisher. Its exact
filename is part of the npm trusted-publisher configuration.

Required properties:

- GitHub-hosted Ubuntu runner;
- `contents: read` and `id-token: write`, with all other permissions absent unless justified;
- manual workflow dispatch inputs for exact `tag` and 40-character `sha` from `release.yml`;
- reviewed immutable action revisions and `persist-credentials: false` after checkout;
- supported Node 24 and npm 11.5.1 or newer;
- public `registry.npmjs.org` configuration and no `.npmrc` Astrale scope redirect;
- no `NPM_TOKEN`, automation write token, GitHub Packages publication, or token fallback;
- frozen install and complete `pnpm qualify` before pack;
- exact check that tag, input SHA, checkout SHA, manifest version, release version, and npm target
  agree;
- one `pnpm pack` output whose file list and integrity are recorded before publish;
- `npm publish <exact-tarball> --access public` with a prerelease dist-tag when appropriate;
- bounded retry only for independently classified transient registry observation after publish, not
  for source/test/authentication failure; and
- post-publish `npm view`, integrity/provenance metadata, and fresh exact-version installs retained
  as evidence.

According to the current
[npm trusted-publishing documentation](https://docs.npmjs.com/trusted-publishers/), publishing from
GitHub requires OIDC `id-token: write`, a GitHub-hosted runner, npm 11.5.1 or newer, and an exact
configured workflow filename. Trusted publishing creates automatic provenance for a public package
from a public repository. These are external admission facts and must be verified again when
implementation begins, not assumed indefinitely from this 2026-08-25 design.

## First public package bootstrap

The package does not yet exist on public npm, so the final bootstrap is deliberately human-gated:

1. Finish every pre-publication source, package, registry, CLI, CI, security, and public-repository
   gate. Public-registry consumer lockfiles remain sequenced after this bootstrap.
2. Produce the exact prerelease tarball once in the accepted workflow environment and hand the user
   SHA, version, file list, integrity, audit, license, and accepted CI evidence.
3. Ask the user to make or explicitly authorize the first public prerelease publish. Do not publish
   earlier and do not use a stable `latest` tag.
4. Independently observe and install that exact public version.
5. Ask the user to configure npm package settings:
   - provider: GitHub Actions;
   - organization: `astrale-os`;
   - repository: `ui`;
   - workflow filename: `publish.yml`;
   - environment: the ratified release environment, if any; and
   - allowed action: `npm publish`.
6. Publish the next prerelease through OIDC and verify automatic provenance.
7. Only then disallow token publishing and revoke the bootstrap credential.

The first manual bootstrap is a one-time exception, not an alternate release workflow.

## Publication evidence levels

Report these independently:

1. source checks passed;
2. package built and packed;
3. registry built and every item installed from source;
4. clean consumers installed the local tarball;
5. accepted required CI completed on the exact tag SHA;
6. public npm accepted the exact tarball;
7. public metadata, integrity, provenance, and dist-tags were observed; and
8. independent clean consumers installed and executed the public version.

No earlier level implies a later one.
