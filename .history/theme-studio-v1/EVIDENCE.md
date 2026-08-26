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

Remote CI, exact merge revisions, and release publication remain delivery evidence rather than
source-qualification evidence and are recorded only after the PRs land.
