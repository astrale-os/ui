# Astrale UI

Astrale UI is one public React package plus an owned shadcn-compatible source registry.

- `@astrale-os/ui` provides accessible runtime components and semantic theme contracts.
- `pattern/*` registry items provide reusable controlled interaction and presentation source.
- `block/*` registry items provide complete, off-the-shelf feature-region source.
- `astrale ui` initializes projects and installs source from one immutable release snapshot.

Base UI is the internal behavioral engine and Nova is the pinned shadcn style profile. Neither is
part of Astrale's public API. Runtime components preserve stable `data-slot` anatomy and expose
their relevant parts; installed patterns and blocks belong to the host application and expose root
`className`, `style`, controlled state, and injected actions.

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

The reset is deliberately opt-in:

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
astrale ui view pattern/chart/line-basic
astrale ui add pattern/chart/line-basic block/dashboard/overview
astrale ui diff
astrale ui doctor
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
  patterns/<family>/         multiple controlled variants per family
  blocks/<family>/           complete application-region compositions
catalog/                     private visual, keyboard, and accessibility proof
.history/public-ui-v1/       migration goal, decisions, defects, and acceptance ledgers
```

Application product policy such as docks, taskbars, windows, routing, data fetching, permissions,
storage, analytics, and SDK calls does not belong in this repository.

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm qualify
```

`pnpm qualify` covers contracts, component behavior, the source registry, a clean packed-package
consumer and tree-shaking budget, the catalog build, and Chromium accessibility/interaction tests.

Releases are managed as one Release Please package and one `v<version>` tag. The publish workflow
admits the exact tag and package version, reruns qualification, then publishes publicly to npm using
trusted publishing and provenance. It contains no token fallback.

## License

MIT
