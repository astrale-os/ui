# Acceptance

## Portable theme contract

- [x] The Draft 2020-12 schema and TypeScript admission expose exactly one versioned document shape.
- [x] Theme slug, document size, exact keys, color values, lengths, durations, fonts, and shadows
      reject malformed or CSS-injecting input.
- [x] Every admitted theme round-trips through JSON and deterministically projects complete light
      and dark semantic CSS.
- [x] Registry CSS and manifests are generated from admitted documents and stale output fails CI.

## Playground

- [x] The repository uses `playground/` as the single private living-catalog owner; no parallel
      `catalog/` application remains.
- [x] All public runtime component subpaths have one visible, addressable specimen.
- [x] Every registry item is discoverable and representative patterns/blocks render live.
- [x] The application uses `@astrale-os/ui` for controls and compositions; no second UI or icon
      library is introduced.
- [x] Light/dark, starter selection, every semantic color, typography, geometry, density, effects,
      and motion update the complete page live.
- [x] Undo, redo, coherent randomization, strict JSON import, browser-local save, JSON export, CSS
      export, and install-command copy work without a backend.
- [x] Desktop and mobile Chromium pass the catalog, theme journey, keyboard journey, and automated
      WCAG A/AA critical/serious scan.
- [x] Vite hot reload remains the development entrypoint and production build emits no source maps.

## Registry and CLI

- [x] Registry index/build/qualification admit themes without weakening pattern/block constraints.
- [x] `astrale ui list --type theme` discovers release-qualified themes.
- [x] `astrale ui add theme/<slug>` installs exact release CSS, activates one theme import, records
      file/source digests, refuses local edits, and rolls back on failure.
- [x] `astrale ui add ./<slug>.css` validates a bounded local path/CSS source, copies it into the
      project, activates its import, and records ownership without network or shadcn.
- [x] Existing pattern/block add, init, preset, doctor, package-manager, Domain-workspace, and
      immutable-snapshot journeys remain green.

## Delivery evidence

- [x] UI and CLI focused tests pass, followed by supported full qualification.
- [x] Two-agent test review finds no remaining gamed tests or high-risk uncovered behavior.
- [x] Browser screenshots are retained for desktop and mobile.
- [x] UI and CLI PRs pass remote CI, merge at exact revisions, and leave no task-owned local work.
