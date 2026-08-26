# Qualification evidence

Local source qualification on 2026-08-26:

- `pnpm qualify`: green, including 27 contract tests, 11 runtime tests, 5 registry behavior tests,
  the security policy, deterministic package and registry qualification, production playground
  build, and all 8 Playwright journeys.
- Desktop and mobile Playwright projects each cover the exact 50 runtime owners, 52 registry items,
  live theme authoring/export, keyboard search/overlays, and all three starter themes in light and
  dark mode with no critical or serious WCAG A/AA Axe violations.
- The theme-authoring journey attaches one viewport screenshot per browser project. CI uploads them
  with `artifacts/playground/**` as `playground-browser-evidence`.
- Package qualification retained a deterministic 58,631-byte tarball with SHA-256
  `eef2357d5cbac699f962b0c7b24a1c70251b25b9d2b2564628a2b419909eb41b` and qualified all 52
  independently installable registry items.
- Independent critic and gap-finder reviews closed with no remaining high- or medium-value test
  defect after adversarial CSS admission and late local-theme rollback proofs were added.
- The companion CLI source suite passed 875 tests with one intentional mirror skip. A built CLI
  then installed the real `atelier.css` playground export into an isolated React fixture, activated
  `@import '../components/astrale/theme/atelier.css';`, and reported every `astrale ui doctor
  --project <fixture>` check healthy.

Remote delivery on 2026-08-26:

- UI PR `#22` passed contracts on Node 24/26, package/registry, playground, security, dependency
  review, commitlint, and CodeQL before merging as `5b1d0606924e9cc9d6683db150ab45ccf34fc771`.
- CLI PR `#179` passed Node 22/24/26, Studio browser smoke, and CodeQL before merging as
  `d8c7f6d0f63b08cf4363690709b6e2f2f5211c31`.
- A fresh published-consumer run exposed shadcn alias remapping of released theme targets. CLI PR
  `#180` made released themes install their admitted embedded CSS directly, passed the same remote
  matrix, and merged as `3d987c1825d46f0bd33dcc7b6858c2f1823cfda0`.
- Release PR `#21` published `@astrale-os/ui@0.3.0-beta.4` through trusted npm publishing and
  mirrored it to GitHub Packages. Release PR `#181` published `@astrale-os/cli@1.0.0-beta.22` and
  completed the Linux/macOS x64/arm64 standalone release matrix.
- In a fresh external React project, the published CLI beta.22 initialized the published UI
  beta.4, discovered all three released themes, installed `theme/atelier`, activated its relative
  host CSS import, recorded exact source/file digests, and returned every `ui doctor` check healthy.
