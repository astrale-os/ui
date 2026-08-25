# Pre-publication handoff

Date: 2026-08-25. This is the stopping point before any public-state mutation.

## Exact qualified cohort

| Owner | Baseline `origin/main` | Qualified local commit |
| --- | --- | --- |
| UI | `d460f711c05e4f14f1467c7992e3193e0ceb913a` | `9d6c2156a1a09864cef6812df0ca780bc07dc6c9` |
| CLI | `d8aa9d902c99513e34389d65a9a1aaa496083086` | `47ae87600f902a1d33f618bdd048928711b311ec` |
| SDK | `ebe288517215fc61e9086266e70ed347f00b32cf` | `79a09d7f38d62a44f4a2882565446b50f70f0fc6` |
| GUI | `ba1b2c9afd1fa9ed97de525c176a8ee9580a93de` | `2ef24d60421d29f408f4bdd1baccea7a26bf55a2` |
| Admin | `e63e2d4248493779f4469153af86efd21ac63565` | `6dfb012047f931cb4707fd72a741f91e5ceceac4` |
| Domains | `cd667d111da05b76c599ce60ba7d741994a40abb` | `a5c51e982c93b6fbc9c9d412eec40f808bc51da8` |

Primary checkouts were not edited. Nothing was pushed or published and repository visibility was
not changed.

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

- UI `pnpm qualify`: formatting, lint, strict types, 15 repository/release contracts, 5 registry
  contracts, 9 runtime tests, ESM/declarations, npm/pnpm pack parity, Node all-subpath imports,
  strict TypeScript, Vite, SSR, Button/Dialog bundle exclusion, and no source maps.
- Registry: exact `shadcn@4.18.0`, Base/Nova, 26 patterns, 23 blocks, 51 deterministic built JSON
  files, and physical installation/typecheck of all 49 items in a fresh project with spaces in its
  path. The current npm production audit reports no known vulnerability.
- Catalog: four desktop/mobile Chromium journeys across Astrale/compact/expressive, light/dark,
  reduced motion and keyboard behavior with no critical/serious axe finding.
- CLI: format/lint/types/build/dependency boundary, 17 UI service tests and 14 program/help tests
  pass; one workspace mirror test is intentionally skipped.
- SDK/generator: 13 scaffold tests, typecheck, and 15 release/boundary tests prove the SDK,
  scaffolder, React output, and custom/headless variants do not acquire Astrale UI dependencies.
- GUI: root build, 38 tests, format/lint; Electron typecheck/build/lint and 113 tests. Remaining root
  type/purity failures are existing Kernel cohort and application-capability issues, not UI errors.
- Admin and Domains: current main had no live legacy UI consumer; stale `allowBuilds` routing entries
  are removed by the commits above.

The local all-item registry fixture preinstalls the exact qualified tarball and suppresses only each
served item's npm dependency operation because `@astrale-os/ui` does not yet exist on public npm.
The committed item dependency is `@astrale-os/ui@^0.3.0-beta.0`; public dependency installation is
explicitly a post-bootstrap proof.

The full generated-project SDK pressure script reached and passed the new UI-boundary assertion,
then hit an existing harness defect: it installs with `--ignore-scripts`, so generated `pnpm lint`
cannot run the Bun binary whose postinstall was skipped. The focused generator boundary remains
green. Likewise, the broader CLI suite's known Bun port-0 `EADDRINUSE` cases remain separate from
the green UI tests.

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
6. Publish the next prerelease through OIDC and verify automatic provenance before removing the
   bootstrap credential.
7. Rebase and qualify each consumer commit, replace local-tarball evidence with public npm evidence,
   and rerun the closed census.
8. Only then enable `create-astrale-domain --ui astrale|none`; the Astrale variant must pass public
   install, `astrale ui doctor`, typecheck, test, build, and pack.

No local source, tarball, registry, or browser result is presented as public npm, provenance, remote
CI, branch-protection, or stable assistive-technology evidence.
