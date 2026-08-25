# `@astrale-os/ui`

Owned React components and semantic themes for Astrale applications.

```bash
pnpm add @astrale-os/ui
```

```css
@import '@astrale-os/ui/theme.css';
@import '@astrale-os/ui/presets/astrale.css';
```

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

Use flat subpaths such as `@astrale-os/ui/button` for the narrowest import. Higher-level patterns
and blocks are installed as application-owned source with `astrale ui add`.

`reset.css` is optional. `theme.css` never installs a global reset or Tailwind preflight.

