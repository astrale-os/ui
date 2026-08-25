# Target architecture

## Product model

```text
@astrale-os/ui                    installed runtime library
        |
        | public component imports + semantic CSS contract
        v
consumer application <---- installed source ---- public Astrale registry
        ^                                             |
        |                                             |
        +----------- astrale ui journey --------------+
```

The package and registry solve different distribution problems:

- the package owns stable, broadly reusable runtime components and theme contracts;
- the registry installs dependency-rich or application-shaped source that consumers are expected
  to customize; and
- the CLI makes both feel like one Astrale UI product.

Package subpaths control application bundles. They do not make npm download only selected files;
the install-size goal is met by keeping high-level libraries and all shadcn tooling out of the
runtime dependency graph.

## Exact target layout

```text
ui/
├── .history/
│   └── public-ui-v1/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── publish.yml
├── schemas/
│   └── ui-lock.schema.json
├── packages/
│   └── ui/
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── class-name.ts
│       │   ├── icon/
│       │   │   ├── controls.tsx
│       │   │   └── index.ts
│       │   ├── theme/
│       │   │   ├── contract.css
│       │   │   ├── theme.css
│       │   │   ├── reset.css
│       │   │   └── presets/
│       │   │       ├── astrale.css
│       │   │       ├── compact.css
│       │   │       └── expressive.css
│       │   ├── action/
│       │   │   ├── button/
│       │   │   ├── button-group/
│       │   │   ├── toggle/
│       │   │   └── toggle-group/
│       │   ├── input/
│       │   │   ├── checkbox/
│       │   │   ├── field/
│       │   │   ├── input/
│       │   │   ├── input-group/
│       │   │   ├── input-otp/
│       │   │   ├── label/
│       │   │   ├── native-select/
│       │   │   ├── radio-group/
│       │   │   ├── select/
│       │   │   ├── slider/
│       │   │   ├── switch/
│       │   │   └── textarea/
│       │   ├── disclosure/
│       │   │   ├── accordion/
│       │   │   └── collapsible/
│       │   ├── menu/
│       │   │   ├── command/
│       │   │   ├── context-menu/
│       │   │   ├── dropdown-menu/
│       │   │   └── menubar/
│       │   ├── overlay/
│       │   │   ├── alert-dialog/
│       │   │   ├── dialog/
│       │   │   ├── drawer/
│       │   │   ├── hover-card/
│       │   │   ├── popover/
│       │   │   ├── sheet/
│       │   │   └── tooltip/
│       │   ├── navigation/
│       │   │   ├── breadcrumb/
│       │   │   ├── navigation-menu/
│       │   │   ├── pagination/
│       │   │   └── tabs/
│       │   ├── feedback/
│       │   │   ├── alert/
│       │   │   ├── progress/
│       │   │   ├── skeleton/
│       │   │   └── spinner/
│       │   ├── content/
│       │   │   ├── aspect-ratio/
│       │   │   ├── avatar/
│       │   │   ├── badge/
│       │   │   ├── card/
│       │   │   ├── empty/
│       │   │   ├── item/
│       │   │   ├── kbd/
│       │   │   ├── separator/
│       │   │   └── table/
│       │   └── layout/
│       │       ├── direction/
│       │       ├── resizable/
│       │       └── scroll-area/
│       └── tsconfig.json
├── registry/
│   ├── registry.json
│   ├── patterns/
│   │   ├── calendar/
│   │   ├── carousel/
│   │   ├── chart/
│   │   ├── combobox/
│   │   ├── command-palette/
│   │   ├── data-table/
│   │   ├── date-picker/
│   │   ├── form/
│   │   ├── message/
│   │   ├── questionnaire/
│   │   ├── sidebar/
│   │   ├── toast/
│   │   └── typography/
│   └── blocks/
│       ├── application-shell/
│       ├── authentication/
│       ├── communication/
│       ├── dashboard/
│       ├── data-management/
│       ├── onboarding/
│       └── settings/
├── catalog/
│   ├── package/
│   ├── patterns/
│   ├── blocks/
│   └── presets/
├── test/
│   ├── package/
│   ├── registry/
│   ├── accessibility/
│   ├── visual/
│   └── consumers/
└── tooling/
    ├── compatibility.json
    ├── package/
    ├── registry/
    └── release/
```

The tree locks semantic owners, not an obligation to split every owner into many files. A simple
owner starts with `index.ts`, one implementation file, and colocated tests. A complex owner earns
additional files only for distinct responsibilities such as state, context, variants, or adapters.
Generic `primitives`, `common`, `shared`, `helpers`, and `utils` buckets are forbidden.

## Dependency direction

```text
class-name + theme contract
          ^
          |
package component owners
          ^
          |
registry patterns
          ^
          |
registry blocks
          ^
          |
catalog and consumer fixtures
```

Rules:

1. A package owner may use `class-name`, the theme contract, and lower-level package owners through
   supported self-imports. It may not deep-import another owner's private file.
2. Registry source imports only `@astrale-os/ui` public subpaths and its own item-local files.
3. Patterns never import blocks.
4. Blocks may compose package components and files included in the same block item. V1 does not use
   unpinned same-repository `registryDependencies`.
5. Catalog and tests may consume public package and registry surfaces; production code never imports
   catalog or test helpers.
6. No package component depends on a pattern, block, application router, network client, form
   library, chart library, date library, toast library, or desktop-shell policy.

## Public package surface

The root export is a curated supported vocabulary. Every component also has a flat public subpath:

```ts
import { Button, Dialog } from '@astrale-os/ui'
import { Button } from '@astrale-os/ui/button'
import { Dialog, DialogContent } from '@astrale-os/ui/dialog'
import { cn } from '@astrale-os/ui/class-name'
```

```css
@import '@astrale-os/ui/theme.css';
@import '@astrale-os/ui/presets/astrale.css';
/* Optional and never pulled by theme.css: */
@import '@astrale-os/ui/reset.css';
```

Package laws:

- source and published `exports` describe the same public paths;
- every target is inside the packed package and resolves to emitted JavaScript, declarations, or
  CSS;
- ESM output uses resolvable specifiers and imports in plain Node where the module is server-safe;
- package root and subpaths contain no source-only workspace references;
- `sideEffects` is false except for explicit CSS files;
- importing one subpath does not evaluate unrelated component modules;
- high-level optional libraries never appear in the runtime dependency closure; and
- the tarball contains the public build, CSS, README, license, and notices only.

The package does not install a general-purpose icon library. It owns only the few semantic control
glyphs required for component behavior, styled through current color and theme metrics. Components
with product-visible icons expose explicit icon/indicator slots accepting component objects. They do
not accept string keys, consult a global icon registry, or make an icon provider mandatory.

The root barrel is supported convenience, not the only performance path. Bundle tests must prove a
button-only application excludes overlay, chart, calendar, carousel, form, and block code.

## Theme and preset contract

The theme system has four independent layers:

1. `contract.css` registers namespaced semantic variables and Tailwind v4 mappings.
2. `theme.css` supplies stable component recipes and safe neutral fallbacks, but no branded
   character.
3. `presets/*.css` override the full character vocabulary: color, typography, density, geometry,
   radius, border, shadow, motion, focus, and component-specific semantic variables.
4. `reset.css` is a separately imported reset. No package stylesheet silently installs Tailwind
   preflight or changes arbitrary host elements.

Every component exposes stable `data-slot` anatomy and state attributes. Presets may style those
slots, but component behavior and accessibility remain invariant. Light/dark uses an explicit
class-based selector and every generated stylesheet is tested in both modes. RTL is structural,
not a separate fork.

Presets are CSS, not JavaScript Tailwind presets and not React providers. Applications may add a
provider for preference persistence, but Astrale UI does not own storage or system-theme policy.

## Upstream ownership

Shadcn is an intake source, not a runtime dependency and not a permanent source authority.

For each official item:

1. retrieve it only through the exact shadcn CLI and recorded project profile;
2. record source item, CLI version, base, style, retrieval date, and content digest;
3. classify it into package, pattern, documentation recipe, or absorbed family source;
4. normalize imports, tokens, anatomy, ownership, and tests;
5. complete accessibility, visual, public API, and package/registry evidence; then
6. mark the Astrale source owned.

Future upstream changes arrive as explicit review PRs. An upstream refresh never overwrites owned
Astrale source automatically and never bypasses the public API or evidence gates.

## Registry contract

The public repository root contains a shadcn source `registry.json` with explicit `include` entries
for every family registry. Item names are slashful stable addresses:

```text
pattern/chart/line/basic
pattern/chart/line/interactive
pattern/carousel/vertical/controlled
block/authentication/sign-in/card
```

The V1 default transport is the
[public GitHub source registry](https://ui.shadcn.com/docs/registry/github) at an immutable release
tag. The CLI
resolves that tag to one commit SHA before reading the root, includes, or files. Generated
`public/r` JSON is built and validated as release evidence but is not a second source authority.

Each item is copy-pasteable, imports public package paths only, declares item-specific npm
dependencies, and has no hidden I/O. Installed files become consumer-owned. A recorded upstream
base digest supports later diffs; local edits are never silently overwritten.

## Ownership exclusions

- Dock, Taskbar, Window, macOS traffic-light policy, Shell navigation, and desktop persistence belong
  to GUI or Shell owners, not public UI.
- Application authentication, routing, fetching, caching, mutation, analytics, and persistence are
  injected by consumers.
- Product icon selection belongs to the application or installed item; the package owns only
  behavioral control glyphs and replaceable slots.
- The SDK owns Domain authoring and runtime contracts, not React or UI selection.
- The CLI owns command UX and process orchestration, not registry content or UI semantics.
- The UI repository owns no product-specific graph or Kernel behavior.
