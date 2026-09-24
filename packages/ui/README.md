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
tokens of the active preset, and defines `font-heading` for titles. `theme.css` ships precompiled, with
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
