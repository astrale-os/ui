# Public beta delivery ledger

This ledger supersedes the prepublication status claims in the earlier migration snapshots. It
records the exact public cohort and consumer journey qualified on 2026-08-26. The design ledgers
remain authoritative for product laws; current source, releases, and this delivery evidence are
authoritative for cutover status.

## Released cohort

| Owner | Release | Exact release commit | Publication proof |
| --- | --- | --- | --- |
| UI | `@astrale-os/ui@0.3.0-beta.3` | `cfdad6a0e2ee4c7233679e51b336d19a89cac13c` | [trusted npm publish and GitHub Packages mirror](https://github.com/astrale-os/ui/actions/runs/32930644736), [GitHub release](https://github.com/astrale-os/ui/releases/tag/v0.3.0-beta.3) |
| CLI | `@astrale-os/cli@1.0.0-beta.20` | `ac3401406690217a10b2cafcf7a781b47f88938e` | [trusted npm publish](https://github.com/astrale-os/cli/actions/runs/32930401737), [four-platform binary release](https://github.com/astrale-os/cli/actions/runs/32930401830), [GitHub release](https://github.com/astrale-os/cli/releases/tag/cli/v1.0.0-beta.20) |
| SDK generator | `create-astrale-domain@0.3.0-beta.46` | `8d344ec2bfb16c617213b968196b1a6b9aef5e31` | [trusted publish and mirror run](https://github.com/astrale-os/sdk/actions/runs/32926384072) |
| SDK | `@astrale-os/sdk@0.5.0-beta.50` | `8d344ec2bfb16c617213b968196b1a6b9aef5e31` | [trusted publish and mirror run](https://github.com/astrale-os/sdk/actions/runs/32926384072) |
| Cloudflare adapter | `@astrale-os/adapter-cloudflare@0.5.0-beta.53` | `8d344ec2bfb16c617213b968196b1a6b9aef5e31` | [trusted publish and mirror run](https://github.com/astrale-os/sdk/actions/runs/32926384072) |
| Astrale adapter | `@astrale-os/adapter-astrale@0.5.0-beta.46` | `8d344ec2bfb16c617213b968196b1a6b9aef5e31` | [trusted publish and mirror run](https://github.com/astrale-os/sdk/actions/runs/32926384072) |

The UI npm and GitHub Packages copies have the same integrity:
`sha512-U2pUSHl+lBZfwIF6bgGINBOWnPZYnHY80QpvZl3ktGg/sg1iOQuWIup7wm6tnTP8POdnGEeYfsI/8NlbzJsccA==`.
Public npm exposes an SLSA V1 provenance attestation for the package. The `beta` dist-tag resolves
to `0.3.0-beta.3`.

The npm `latest` tag still resolves to the accidentally tagged `0.3.0-beta.0`. It must be removed,
not advanced to a prerelease; npm requires an interactive account OTP for this dist-tag mutation.

## Delivery changes

| Repository | Pull requests | Closed behavior |
| --- | --- | --- |
| UI | [#7](https://github.com/astrale-os/ui/pull/7), [#10](https://github.com/astrale-os/ui/pull/10), [#11](https://github.com/astrale-os/ui/pull/11), [#12](https://github.com/astrale-os/ui/pull/12), [#13](https://github.com/astrale-os/ui/pull/13), [#14](https://github.com/astrale-os/ui/pull/14), [#15](https://github.com/astrale-os/ui/pull/15), [#16](https://github.com/astrale-os/ui/pull/16), [#18](https://github.com/astrale-os/ui/pull/18) | Public package/registry cutover, npmjs routing, trusted publish and mirror, consumer-safe internal import namespace, visible default chart token with host override, whole-product release ownership, beta.3 release, final evidence ledger, non-product release routing |
| CLI | [#160](https://github.com/astrale-os/cli/pull/160), [#162](https://github.com/astrale-os/cli/pull/162), [#164](https://github.com/astrale-os/cli/pull/164), [#166](https://github.com/astrale-os/cli/pull/166), [#168](https://github.com/astrale-os/cli/pull/168), [#170](https://github.com/astrale-os/cli/pull/170), [#171](https://github.com/astrale-os/cli/pull/171), [#174](https://github.com/astrale-os/cli/pull/174), [#175](https://github.com/astrale-os/cli/pull/175), [#176](https://github.com/astrale-os/cli/pull/176) | Public UI namespace, beta resolution, nested registry provenance, Domain registry workspace ownership, exact UI pin restoration, current Schema client contracts, shipped standalone Viewer cohort, exact external-navigation grants, beta.20 release |
| SDK | [#236](https://github.com/astrale-os/sdk/pull/236), [#242](https://github.com/astrale-os/sdk/pull/242), [#243](https://github.com/astrale-os/sdk/pull/243), [#246](https://github.com/astrale-os/sdk/pull/246), [#247](https://github.com/astrale-os/sdk/pull/247) | Zero-runtime UI integration guidance, generator package-manager/workspace correctness, stable local Cloudflare origin, published beta cohort |
| GUI | [#28](https://github.com/astrale-os/gui/pull/28) | Public npm UI resolution and exact beta consumption |
| Admin | [#75](https://github.com/astrale-os/admin/pull/75) | Public UI consumer migration |
| Domains | [#81](https://github.com/astrale-os/domains/pull/81) | Public UI consumer migration |

Release Please release pull requests and their releases were also merged for every changed
publishable package. No UI-related pull request remains open in UI, CLI, SDK, GUI, Admin, or
Domains; the remaining open pull requests in those repositories have unrelated owners.

## Defects found by the external consumer

1. The repository-local `.npmrc` routed the first publish attempt to GitHub Packages. UI now owns
   anonymous public npm routing and mirrors only after the npm publication qualifies.
2. CLI default release discovery used npm `latest`, which had the accidental beta.0 tag. It now
   admits only the `beta` channel by default and fails closed on a non-beta result.
3. Nested registry item files were qualified relative to the root registry instead of their
   declaring family registry. Paths are now resolved against the exact declaring manifest and
   malformed, encoded, already-qualified, or escaping paths reject before fetch or mutation.
4. The SDK generator accepted `--pm npm` but emitted pnpm commands and topology. All four supported
   managers now author their own commands, lock protocol, workspace topology, and documentation.
5. Generated registry source lived outside the Domain linter's package inventory, and shadcn
   rewrote the exact UI dependency to a compatible range. CLI now creates a private `components`
   workspace, rejects workspace shadowing or symlink escape, restores the exact locked release,
   installs the resulting lock, and transactionally rolls back on failure.
6. The published UI package used internal `#ui/*` imports. A generated Domain's Vite alias owned
   the same namespace and rewrote package internals into consumer paths. UI now uses private
   `#astrale-ui/*` imports and qualifies its packed tarball in a consumer that deliberately owns
   `/^#ui\//` for both browser and SSR builds.
7. `ui add --help` retained advice for the removed `ui diff` command. The final CLI beta points to
   the registered `astrale ui doctor` recovery path, with rendered-help regression coverage.
8. Ordinary Cloudflare development changed issuer between the readiness probe and internal
   requests (`localhost` versus `127.0.0.1`), producing a terminal HTTP 421. The adapter now pins
   one explicit local `WORKER_URL` through Wrangler and physically proves the two-host invariant.
9. Direct Domain install still called removed Schema client shapes. CLI now uses the public SDK
   `session.schema.install` contract, current Publication input, and typed changed/idempotent
   results; bare, bundle, Method, and Function introspection paths are qualified.
10. Standalone CLI archives contained the executable but not the Viewer runtime, and compiled
    re-invocation leaked Bun's virtual entry path. The release now ships an exact binary plus
    two-file Viewer cohort, installs and updates it transactionally with metadata, and physically
    opens a compiled View.
11. The installed line chart depended only on shadcn's consumer token and could render invisibly.
    It now falls back to `--ui-chart-1` while preserving a host `--color-chart-1` override; real
    desktop and mobile browsers prove both resolved colors.
12. The open CLI View-navigation pull request bypassed its actual Shell security pipeline in tests
    and initially used browser `noopener` return semantics incorrectly. The merged implementation
    drives the pinned Shell router and capability middleware, authenticates the physical child,
    admits exact HTTPS origins only, establishes opener isolation before external navigation, and
    proves the platform behavior in Chromium.
13. Release Please scoped UI to `packages/ui`, so registry-only pattern and block fixes could not
    create a release. The whole repository now owns one UI release, with root, public package, and
    release-manifest versions locked together; an actual Release Please dry run and beta.3 release
    proved the registry-only chart fix was included.
14. The first attempt to exclude delivery ledgers from releases used glob and exact-file forms that
    Release Please does not recognize, so it generated a stale beta.4 proposal. The release
    contract now lives under the excluded `.release` owner, history lives under `.history`, both
    use supported directory-prefix exclusions, and repository maintenance uses the hidden `chore`
    type. Release Please 17.3 was run against the exact pushed PR #18 revision and reported zero
    release pull requests; PR #17 was then explicitly closed without publishing beta.4.

Each production test change received an adversarial critic and gap-finder pass. Material gaps found
by those reviews were corrected before merge.

## Repository and CI proof

- UI PR qualification passed package and registry consumers, Node 24/26 contracts, catalog
  desktop/mobile Playwright journeys, security, dependency review, and CodeQL. The exact beta.3
  release candidate passed the dispatched full CI run
  [32930509534](https://github.com/astrale-os/ui/actions/runs/32930509534); trusted npm publish plus
  identical GitHub Packages mirror passed in
  [32930644736](https://github.com/astrale-os/ui/actions/runs/32930644736). The final non-product
  routing revision passed the full main CI run
  [32932088960](https://github.com/astrale-os/ui/actions/runs/32932088960), while its Release run
  [32932088954](https://github.com/astrale-os/ui/actions/runs/32932088954) completed without creating
  or publishing another release.
- CLI UI and View changes passed Node 22/24/26, Studio Chromium smoke, CodeQL, and the full local
  package gate: 868 tests passed, one intentional skill-mirror skip, zero failures, followed by
  standalone build, public exports, and dependency-boundary verification. The exact beta.20 main
  CI, trusted npm publish, and binary release are respectively
  [32930401734](https://github.com/astrale-os/cli/actions/runs/32930401734),
  [32930401737](https://github.com/astrale-os/cli/actions/runs/32930401737), and
  [32930401830](https://github.com/astrale-os/cli/actions/runs/32930401830).
- SDK generator and Cloudflare changes passed Node 22/24/26, 195 adapter tests, packed Windows
  qualification, and a physical public npm project generation/install/dev journey. The released
  publish and GitHub Packages mirror both passed in
  [32926384072](https://github.com/astrale-os/sdk/actions/runs/32926384072).
- UI package qualification produced byte-identical repeated packs and exercised clean npm and pnpm
  installs, every public JavaScript export, declaration imports, browser Vite, and SSR Vite.

## Published-artifact Domain and View journey

The final journey used an external npm-authored project in
`/private/tmp/astrale-ui-e2e.8yDIIu/ui-domain-published`. It had no workspace or source links and
consumed only public exact releases: UI beta.3, SDK beta.50, Cloudflare adapter beta.53, and the
downloaded macOS arm64 CLI beta.20 archive. That archive's SHA-256 matched the release checksum and
contained exactly `astrale`, `viewer/dist/index.html`, and `viewer/dist/main.js`.

The public generator authored the Domain and its View; final UI initialization and
`astrale ui add pattern/chart/line-basic --overwrite --yes` locked registry commit
`cfdad6a0e2ee4c7233679e51b336d19a89cac13c`. `astrale ui doctor` was healthy. TypeScript, six
Vitest tests, the 28-file Domain lint, Domain build, and frontend Vite build all passed. The final
Domain build digest was
`sha256:62d081495944de05affa02590ff25ef5de5147e729c85f704f624038c614d614`.

The original public install through CLI beta.18 committed operation
`165eee99-7b3c-4462-bf09-814b286e267b`, revision
`sha256:a02fa163369364abe77821eb991c3d3ea6fd3d3b624e8ebadbf118afa197ae97`, and generation
`sha256:7e035b34de55184e256484581d11cd76cd46ba9f6ca7a9d3c089c45fe3511ead`;
its exact repeat returned already current. UI beta.3 changed only consumer runtime and installed
source, so that Schema revision and the installed View binding remained exact. A later redundant
install against the long-running disposable parity Kernel was rejected by its Schema backend with
no effect; introspection proved the prior generation remained ready. This infrastructure failure is
kept separate from the successful product journey.

The released beta.20 binary then closed the earlier candidate session and opened a fresh standalone
View session `v-7ff921` from its shipped Viewer assets. The CLI reported `plain`, and its iframe
accessibility tree contained the complete Domain application. A second direct browser observation
proved zero page errors, 33 stable `data-slot` surfaces, visible package beta.3 and CLI beta.20
labels, working release-proof navigation, and a chart source stroke of
`var(--color-chart-1, var(--ui-chart-1))` resolving through the host override to
`oklch(0.36 0.14 251)`. Desktop 1440x900 and mobile 390x844 screenshots were retained under the
journey directory.

## Remaining external action

Remove only the erroneous npm `latest` tag after obtaining a current npm account OTP:

```sh
npm dist-tag rm @astrale-os/ui latest --registry=https://registry.npmjs.org --otp=<code>
```

Do not point `latest` at a beta. Stable promotion remains a separate release decision.
