# Astrale UI

Astrale UI is one public React package plus an owned shadcn-compatible source registry.

- `@astrale-os/ui` provides accessible runtime components and semantic theme contracts.
- `component/*` registry items provide exact dependency-heavy or app-owned component source.
- `pattern/*` registry items provide reusable controlled interaction and presentation source.
- `block/*` registry items provide complete, off-the-shelf feature-region source.
- `theme/*` registry items provide portable light/dark character source that projects to CSS.
- `astrale ui` initializes projects and installs source from one immutable release snapshot.

Base UI is the internal behavioral engine and Nova is the pinned shadcn style profile. Neither is
part of Astrale's public API. Runtime components preserve stable `data-slot` anatomy and expose
their relevant parts; installed patterns, blocks, and themes belong to the host application.
Compositions expose root `className`, `style`, controlled state, and injected actions; themes expose
the complete semantic token vocabulary in editable CSS.

## Install

After the Public UI V1 beta release:

```bash
pnpm add @astrale-os/ui
astrale ui init --preset astrale
```

Import the semantic theme and one character preset:

```css
@import '@astrale-os/ui/theme.css';
@import '@astrale-os/ui/presets/astrale.css';
```

The exact pinned Tailwind Preflight is deliberately opt-in through the reset:

```css
@import '@astrale-os/ui/reset.css';
```

Use the curated root or a flat component subpath:

```tsx
import { Button } from '@astrale-os/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@astrale-os/ui/card'
```

Install consumer-owned compositions without adding them to the runtime package:

```bash
astrale ui list chart
astrale ui list line-basic --json
astrale ui add component/chart component/sidebar
astrale ui add pattern/chart/line-basic block/dashboard/overview
astrale ui add theme/observatory
astrale ui add @ss-components/input-02
astrale ui doctor
```

The playground can also export a custom theme as JSON plus CSS. Install the exported CSS from the
project root with one command:

```bash
astrale ui add ./my-theme.css
```

Ordinary add never overwrites local edits. The project lock records the exact npm version, Git tag,
commit SHA, shadcn/Base UI versions, preset, and installed file hashes.

## Repository ownership

```text
packages/ui/                 one public runtime package
  src/action/                actions and toggles
  src/content/               content presentation
  src/disclosure/            reveal/collapse behavior
  src/feedback/              alerts, progress, toast, loading
  src/input/                 form controls
  src/layout/                layout behavior
  src/menu/                  menus and command surfaces
  src/navigation/            navigation structures
  src/overlay/               dialogs, sheets, popovers
  src/theme/                 reset, semantic theme, character presets
registry/
  components/                 exact installable component source
  patterns/<family>/         multiple controlled variants per family
  blocks/<family>/           complete application-region compositions
  themes/                    portable documents and generated consumer-owned CSS
playground/                  complete living catalog and theme-authoring workbench
tooling/theme-document/      portable admission and deterministic CSS projection
.history/public-ui-v1/       migration goal, decisions, defects, and acceptance ledgers
```

Application product policy such as docks, taskbars, windows, routing, data fetching, permissions,
storage, analytics, and SDK calls does not belong in this repository.

## Development

```bash
pnpm install --frozen-lockfile
pnpm playground:dev
pnpm check
pnpm qualify
```

`pnpm playground:dev` resolves runtime components, theme CSS, and presets directly to their source
owners, so library edits update through Vite HMR without a package rebuild.

The current provider census and exact source proofs live under `tooling/upstream/providers/`.
Shadcn is an intake provider rather than a permanent public API; provider addresses such as
`@ss-components/input-02` fit the same crosswalk and provenance contract.

`pnpm qualify` covers contracts, component behavior, portable themes, the source registry, a clean
packed-package consumer and tree-shaking budget, the playground build, and Chromium
accessibility/interaction tests.

Releases are managed as one Release Please package and one `v<version>` tag. The publish workflow
admits the exact tag and package version, reruns qualification, then publishes publicly to npm using
trusted publishing and provenance. It contains no token fallback.

## License

MIT
