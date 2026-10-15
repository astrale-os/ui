# `@astrale-os/ui`

Owned React components and semantic themes for Astrale applications.

```bash
pnpm add @astrale-os/ui
```

```css
@import '@astrale-os/ui/theme.css';
@import '@astrale-os/ui/presets/astrale.css';
@import '@astrale-os/ui/tailwind.css';
```

`tailwind.css` is the Tailwind CSS v4 contract for your own markup: it maps `bg-background`,
`border-border`, `font-serif`, `rounded-lg`… and the class-based `dark:` variant onto the `--ui-*`
tokens of the active preset, and defines `font-heading` for titles. Status colors (`bg-success`,
`text-info`, `text-warning-foreground`…) keep fixed semantic hues in every preset; `Badge` exposes them
as the `success`, `info`, and `warning` variants. `theme.css` ships precompiled, with
component rules in `@layer components` so that your utilities always win. Dark mode is class-based:
put `dark` on `<html>` or on any subtree, presets follow.

Applications that build their own stylesheet with Tailwind CSS v4 import the source entry instead.
Their Tailwind then compiles the components' classes in the same build as their own, so a component's
state variant (`hover:`, `data-open:`, `data-selected:`...) always comes after its base utility,
even when the application uses that utility too:

```css
@import 'tailwindcss';
@import '@astrale-os/ui/source.css';
@import '@astrale-os/ui/presets/astrale.css';
```

`source.css` brings the package's variants and animations, the `tailwind.css` contract, the tokens
and component-owned rules, and the path of the components for Tailwind to scan. It replaces
`theme.css` and `tailwind.css`: do not import them next to it. `tokens.css` alone holds the `--ui-*`
tokens and component defaults, for plain CSS that reads the tokens without the components.

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@astrale-os/ui'

export function Welcome() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ready</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Continue</Button>
      </CardContent>
    </Card>
  )
}
```

Use flat subpaths such as `@astrale-os/ui/button` for the narrowest import. Dependency-heavy
components, higher-level patterns, and blocks are installed as application-owned source with
`astrale ui add`.

`reset.css` is optional and contains the pinned Tailwind Preflight required by upstream defaults,
layered under `base` so component defaults, utilities, and your own unlayered CSS win over it.
`theme.css` never installs that global reset implicitly.

`@astrale-os/ui/brand` draws the Astrale logo in `currentColor`, so it takes the text color of its
surface in every preset and in dark mode: `AstraleMark` (the symbol), `AstraleWordmark` (the name),
and `AstraleLogo` (both, `layout="horizontal"` by default or `"stacked"`). Each is an image named
"Astrale"; pass `aria-hidden` when visible text or the surrounding control already names it, such
as a Home link with its own `aria-label`, so screen readers do not announce the name twice. Size
them with `className` (`size-8`, `h-10 w-auto`). The logo and the Astrale name are trademarks of
Astrale and, unlike the rest of this package, are not licensed under the MIT License. Logo files for
print, slides and social profiles are on [brand.astrale.ai](https://brand.astrale.ai).

```tsx
import { AstraleLogo, AstraleMark } from '@astrale-os/ui/brand'

export function Header() {
  return <AstraleLogo className="h-7 w-auto text-foreground" />
}

export function HomeLink() {
  return (
    <a href="/" aria-label="Astrale Home">
      <AstraleMark aria-hidden className="size-6" />
    </a>
  )
}
```

Generated files use fixed brand colors instead, exported as `brandColors` (`blue` `#003B82`, the
preset's light primary; `black`; `white`). The package ships the icons an application serves
itself under `@astrale-os/ui/brand/icons/`, so a new release updates them everywhere. Copy them at
build time and serve them from the application's own origin: browsers look for `/favicon.ico` there,
and MCP clients only trust icons from the server's origin.

| Folder        | Icon                                       | For                         |
| ------------- | ------------------------------------------ | --------------------------- |
| `tile-blue/`  | The white symbol on the brand blue         | Astrale applications        |
| `tile-black/` | The white symbol on black                  | The back-office             |

Each folder holds `favicon.svg`, `favicon.ico` (16, 32, 48), `favicon-{16,32,48,96,192,512}.png`
and `apple-touch-icon.png` (180, full bleed); `tile-blue/` adds the macOS app icon, `icon.icns`
and its 1024px `icon.png`.

```ts
import favicon from '@astrale-os/ui/brand/icons/tile-blue/favicon-32.png'
```
