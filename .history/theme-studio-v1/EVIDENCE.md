# Qualification evidence

Interactive catalog repair on 2026-08-26, from UI `origin/main`
`121a5b1cee581df3ef9ab4a19d1fe80849cbd2c1`:

- Catalog inputs, Select, Slider, OTP, Calendar, Carousel, and Pagination now own live specimen
  state. Pagination prevents its demonstration link from navigating and proves that both the URL
  and scroll position remain unchanged while the active page changes.
- Component cards no longer repeat their package or registry address below the component name. The
  nested Card specimen uses the complete upstream anatomy and fills its available specimen width.
  The opt-in reset now includes the exact compiled equivalent of shadcn's required global
  `border-border outline-ring/50` rule, so structural borders resolve through theme tokens instead
  of inheriting text color.
- The Select specimen uses the official Base item-aligned composition. Dropdown Menu and Menubar
  now exercise the official example anatomy across groups, labels, separators, shortcuts,
  checkbox/radio state, destructive items, and keyboard-opened submenus without changing their
  exact owned component sources.
- The theme customizer remains an exact public Astrale Drawer composition. Playground-only CSS
  disables its backdrop blur while retaining the upstream Drawer source byte-for-byte modulo the
  already admitted import and formatting adaptations.
- The browser suite proves the repaired behavior on desktop and mobile, including exact input
  values, active selection/value state, Select item alignment, continuous Spinner motion when the
  host requests no motion reduction, preserved reduced-motion behavior, menu state/submenus,
  carousel movement, pagination isolation, card sizing/tokenized borders, subtitle absence, and
  computed `backdrop-filter: none`. Test-review passes also reproduced and removed timing races
  from the settled-state accessibility and menu journeys.
- Final `pnpm qualify` passed 32 contract tests, 11 runtime tests, 5 registry behavior tests, the
  security policy over 399 tracked files, deterministic package and 64-item registry consumers,
  the production playground build, and all 14 desktop/mobile browser journeys. The deterministic
  package is 59,351 bytes with SHA-256
  `8d2c857bb355a290e2f3b12bc0039aa4b516d1d7eb5b7dd5242ad489973ec4a4`.

Theme customizer drawer qualification on 2026-08-26:

- The playground catalog now owns the full viewport while the theme customizer opens through the
  public Astrale `Drawer` and `Button` entrypoints. The catalog remains visible behind the modal
  surface, and no playground-only drawer implementation or runtime component styling was added.
- Browser qualification proves the drawer starts closed, opens and closes through visible controls
  and Escape, traps forward and reverse keyboard focus, restores focus to its trigger, and preserves
  unsaved theme state across close and reopen.
- Desktop and 390-pixel mobile journeys prove the complete catalog remains available, the drawer
  stays within the viewport, theme editing remains live, and all starter/mode combinations have no
  critical or serious automated accessibility violations.
- Final `pnpm qualify` passed static contracts, runtime and registry tests, security and license
  gates, deterministic package and registry consumers, the production playground build, and all 12
  desktop/mobile browser journeys.

Expanded upstream intake qualification on 2026-08-26:

- The provider-neutral census contains 543 unique shadcn addresses across the global and Base/Nova
  scopes. All 63 profile UI addresses close exactly as 50 runtime owners, 12 consumer-owned
  `component/*` registry items, and the fileless `@shadcn/form` profile alias.
- Exact source/digest qualification rejects any component API, class, icon, DOM, variant, or default
  drift. Only import routing, formatting, unused-import removal, and file ownership are admitted.
- The expanded registry contains 64 independently addressable items and 65 files. Its isolated
  consumer installs the qualified UI tarball plus every item-local dependency through the real
  shadcn CLI, compares installed source modulo the CLI-managed `use client` directive, and
  typechecks the complete result.
- The playground renders all 62 emitted components from runtime or registry source, retains direct
  source HMR, and includes all 64 registry items in its generated inventory. Desktop and mobile
  browser qualification covers theme authoring, error containment, keyboard behavior, responsive
  layout, and every starter in light and dark mode.
- Final `pnpm qualify` passed 31 static contracts, 11 runtime tests, 5 registry behavior tests, the
  security/license gate, deterministic package and registry consumers, the production playground,
  and all 12 desktop/mobile browser journeys. The deterministic package is 59,329 bytes with
  SHA-256 `a7fbf380b3df1ea613d8beb63163237839a3581633e517c252f9a9cd7797b41c`;
  the isolated registry consumer installs and typechecks all 64 items and 65 files.

Fresh source and consumer iteration on 2026-08-26, from UI `origin/main`
`910640c8227af4893eb10bae9b00e88ba319a7ce`:

- Removed the global header, hero copy, catalog rail, navigation note, and Theme Studio marketing
  header. The playground now opens directly on the runtime catalog with the theme controls as its
  only persistent side surface.
- `pnpm playground:dev` starts from a checkout without `packages/ui/dist`, prepares package output
  once for TypeScript/package consumers, and resolves every public runtime entrypoint plus theme and
  preset CSS to its source owner. Physical component and CSS edits both hot-updated in Chromium
  without a page reload; the edited theme state remained intact.
- `pnpm qualify`: green, including 28 contract tests, 11 runtime tests, 5 registry behavior tests,
  the security policy, deterministic package and registry qualification, the production playground
  build, and all 12 Playwright journeys across desktop and mobile.
- The browser journeys exact-match all 50 runtime owners and all 52 registry items; exercise color,
  mode, typography, geometry, randomization, undo/redo, local save/reload, JSON import/export, CSS
  export, clipboard success/failure, malformed storage/write failure containment, responsive layout,
  representative overlays/disclosures, and all starter/mode accessibility combinations. Reduced
  motion has exact computed zero-duration accordion behavior and a clean console.
- The qualified tarball is deterministic at 58,647 bytes with SHA-256
  `4201a0aae954847afd75b5abe9e4ed3d09b664f234d4d6a127a7bb73f669e4d8`; all 52 registry items
  install deterministically.
- Independent critic and gap-finder passes exposed and closed a flaky temporary-download import,
  partial registry/import/reduced-motion assertions, absent CSS-source HMR, and uncontained clipboard
  and storage failures. The final critic pass found no remaining material test-quality issue.
- In a fresh external Vite React/Tailwind project, published `@astrale-os/cli@1.0.0-beta.22`
  initialized published `@astrale-os/ui@0.3.0-beta.5`, installed the actual playground export through
  `astrale ui add ../atelier.css`, returned every `ui doctor` check healthy, and built successfully.
  A separate browser observed the exported primary color, radius, and body font exactly with no
  console or page errors.

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
- The companion CLI source suite passed 876 tests with one intentional mirror skip. A built CLI
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
- Release PR `#21` published the initial `@astrale-os/ui@0.3.0-beta.4` through trusted npm
  publishing. UI PR `#24` then closed an asynchronous import-input page error as
  `1fe5563a508421428927e82b55da2f3f3cd00ec8`; release PR `#25` published the final UI beta.5.
  Both UI releases were mirrored to GitHub Packages. Release PR `#181` published
  `@astrale-os/cli@1.0.0-beta.22` and completed the Linux/macOS x64/arm64 standalone matrix.
- In a fresh external React project, the published CLI beta.22 initialized the published UI
  beta.4, discovered all three released themes, installed `theme/atelier`, activated its relative
  host CSS import, recorded exact source/file digests, and returned every `ui doctor` check healthy.
