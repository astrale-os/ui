# Pre-publication handoff

Date: 2026-08-26. This is the stopping point before any package publication or visibility change.

## Exact qualified cohort

| Owner | Baseline `origin/main` | Qualified local commit |
| --- | --- | --- |
| UI | `d460f711c05e4f14f1467c7992e3193e0ceb913a` | `b5cb9b6fe7710e7a8bc1978776bb49270e8eac62` |
| CLI | `634843cdcaeb34fa4a9a338a58be2a5d4578a31a` | `2da8ff20f3af72bb1d72af6bde295a77ea33b807` |
| SDK | `5bc5e528a5368f80942b406bfd772a36a286c289` | `c20ee0adecddac1cc36dba006b66a8daf1380d52` |
| GUI | `ba1b2c9afd1fa9ed97de525c176a8ee9580a93de` | `2ef24d60421d29f408f4bdd1baccea7a26bf55a2` |
| Admin | `f0a4cb4e95488132d41d1ce88bd632d61ef8940e` | `cc0818a7c75abfc27d2f178eb6c788d31bfadf3a` |
| Domains | `ec0a16a46a08a3a2118ca1490a4f7e71239d62eb` | `f846a1ce6bafeb286f78278238772d7648260f5f` |

Primary checkouts were not edited. The qualified branches and linked pull requests were pushed;
nothing was published and repository visibility was not changed.

## Current package identity

```text
@astrale-os/ui@0.3.0-beta.0
artifacts/package/astrale-os-ui-0.3.0-beta.0.tgz
sha256 e0f79d1039860fe1ef1914fe4625a1b75a6aa5585c2c6e073a1ba8ce6e47f2e8
sha512-MUPJEk9UMztUZu1hHUugG5HbxEonZjUf5SZLqYoEXarkyM4ZRA7e3njhcAnepcgFXix3S1Ocni7fp+gNT6trZQ==
```

| Measurement | Value |
| --- | ---: |
| tarball | `58,355` bytes |
| unpacked | `353,005` bytes |
| packed files | `115` |
| theme / opt-in reset | `123,671` / `317` bytes |
| Button bundle | `46,906` / `15,783` gzip bytes |
| Dialog bundle | `101,012` / `32,814` gzip bytes |
| pnpm / npm dependency paths | `88` / `18` |

## Passed evidence

- UI `pnpm qualify`: formatting, lint, strict types, 22 repository/release contracts, 5 registry
  contracts, 9 runtime tests, 4 registry behavior/customization tests, ESM/declarations, npm/pnpm
  pack parity, Node all-subpath imports, strict TypeScript, Vite, SSR, Button/Dialog bundle
  exclusion, and no source maps.
- Registry: exact `shadcn@4.18.0`, Base/Nova, 26 patterns, 23 blocks, 51 deterministic built JSON
  files, and physical installation/typecheck of all 49 items in a fresh project with spaces in its
  path. The source registry digest is
  `b435b82d5bc3cea9f1b9ff8e1ddd8d43b13fb9900a7ef2ee810a63d76169c7c4`; the built collection
  digest is
  `d09c75d0a417e527f8dd3fcef91f46b051934d8d9c0e91de9c412e0b714988b8`. The current npm
  production audit reports no known vulnerability.
- Catalog: four desktop/mobile Chromium journeys across Astrale/compact/expressive, light/dark,
  reduced motion and keyboard behavior with no critical/serious axe finding.
- CLI: complete `pnpm package:check` passed with 814 tests and one intentional workspace mirror
  skip. The focused UI/program layer passed 37 tests and the same skip, including strict built-item
  admission, semantic read-only diff, stable JSON/errors, dry-run targets, and non-interactive
  behavior.
- SDK/generator: complete `pnpm qualify` passed. That includes 543 SDK tests, 1 Node-server test,
  34 package/release script tests, 193 Cloudflare-adapter tests, 47 Astrale-adapter tests, 13
  scaffold tests, all package-surface/pack checks, and physical generated-project qualification for
  React, custom/headless, and none. The SDK and every generated variant remain free of Astrale UI,
  Base UI, Radix, and shadcn dependencies; custom/headless and none also remain React-free.
- GUI: root build, 38 tests, format/lint; Electron typecheck/build/lint and 113 tests. Remaining root
  type/purity failures are existing Kernel cohort and application-capability issues, not UI errors.
- Admin and Domains: current main had no live legacy UI consumer; stale `allowBuilds` routing entries
  are removed by the commits above. Both were rebased onto current main. Admin passes format, lint,
  full workspace types, 391 package tests, and its three release-boundary tests; Domains passes
  format, lint, full workspace types, and all 130 package tests.

The local all-item registry fixture preinstalls the exact qualified tarball and suppresses only each
served item's npm dependency operation because `@astrale-os/ui` does not yet exist on public npm.
The committed item dependency is `@astrale-os/ui@^0.3.0-beta.0`; public dependency installation is
explicitly a post-bootstrap proof.

The generated-project SDK qualifier exercises the scaffold's explicit `allowBuilds` and
`trustedDependencies` policy rather than disabling lifecycle scripts, so its exact project-local
Bun binary is materialized and linted under the same admission boundary consumers receive.

## Maintainer actions

1. Ratify MIT plus `THIRD-PARTY-NOTICES.md`, complete governance/history review, and make
   `astrale-os/ui` public.
2. Reproduce/merge the exact UI implementation revision and require the CI jobs in `ci.yml`.
3. Publish `0.3.0-beta.0` once from the exact tarball above under the `beta` dist-tag. This is the
   one bootstrap exception because npm trusted publishing cannot be configured before the package
   exists.
4. Verify public metadata, integrity, repository, license, README, tag, and independent npm/pnpm
   installs.
5. Configure npm trusted publishing for organization `astrale-os`, repository `ui`, workflow
   `publish.yml`, environment `npm`, action `npm publish`.
6. Merge the next Release Please beta PR. `release.yml` dispatches the `publish.yml` definition from
   the immutable release tag and waits for its exact version/SHA workflow. It reruns full
   qualification, derives the npm `beta` tag, verifies immutable metadata/integrity and SLSA
   provenance, and qualifies anonymous npm/pnpm locks and imports before the bootstrap credential
   is removed. A dependent job then mirrors that qualified npm package to GitHub Packages.
7. Rebase and qualify each consumer commit, replace local-tarball evidence with public npm evidence,
   and rerun the closed census.
8. Only then enable `create-astrale-domain --ui astrale|none`; the Astrale variant must pass public
   install, `astrale ui doctor`, typecheck, test, build, and pack.

No local source, tarball, registry, or browser result is presented as public npm, provenance, remote
CI, branch-protection, or stable assistive-technology evidence.
