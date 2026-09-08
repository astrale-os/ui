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

`reset.css` is optional and contains the pinned Tailwind Preflight required by upstream defaults.
`theme.css` never installs that global reset implicitly.
