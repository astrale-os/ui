# @astrale-os/ui

Astrale Design System - Shared UI styles, components, utilities, and constants for Astrale applications.

## Packages

| Package                      | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `@astrale-os/ui`             | All-in-one package (recommended)                   |
| `@astrale-os/ui-components`  | React components (Button, Card, Input, etc.)       |
| `@astrale-os/ui-styles`      | CSS variables, glass effects, and base styles      |
| `@astrale-os/ui-preset`      | Tailwind CSS preset with theme configuration       |
| `@astrale-os/ui-utils`       | Utility functions (`cn` for class merging)         |
| `@astrale-os/ui-constants`   | Layout values and design tokens                    |

## Installation

For most projects, use the all-in-one package:

```bash
pnpm add @astrale-os/ui
```

Or install individual packages:

```bash
pnpm add @astrale-os/ui-styles @astrale-os/ui-components @astrale-os/ui-utils
```

## Usage

### Styles (Recommended)

Import `@astrale-os/ui/styles` in your main CSS file. This includes:
- Tailwind CSS base styles and variables
- Pre-compiled CSS for all ui-components (no `@source` needed)

```css
@import 'tailwindcss';
@import '@astrale-os/ui/styles';

@config './tailwind.config.ts';

@custom-variant dark (&:is(.dark *));
```

The `@config` directive tells Tailwind v4 where to find your config file. The `@custom-variant` is required for dark mode to work with `next-themes`.

### Styles (Individual packages)

If you need more control, import individual style modules:

```css
@import 'tailwindcss';
@import '@astrale-os/ui-styles';
@import '@astrale-os/ui-components/styles';

@config './tailwind.config.ts';

@custom-variant dark (&:is(.dark *));
```

Or just the base styles without components:

```css
@import '@astrale-os/ui-styles/base';
@import '@astrale-os/ui-styles/glass';
@import '@astrale-os/ui-styles/macos-buttons';
```

### Components

Available components (54 total):

**Layout:** Card, Separator, AspectRatio, Resizable, ScrollArea

**Forms:** Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Label, Form, Field, InputGroup, InputOTP

**Feedback:** Alert, AlertDialog, Dialog, Drawer, Sheet, Popover, Tooltip, HoverCard, Progress, Skeleton, Spinner, Sonner (toast)

**Navigation:** Tabs, Accordion, Breadcrumb, DropdownMenu, ContextMenu, Menubar, NavigationMenu, Pagination, Command, Sidebar

**Data Display:** Table, Avatar, Badge, Calendar, Carousel, Chart, Empty, Kbd

**Other:** Toggle, ToggleGroup, Collapsible, ButtonGroup, Item

**Hooks:** `useMobile()`

```typescript
import { Button, Card, CardHeader, CardTitle, CardContent } from '@astrale-os/ui-components'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Tailwind Preset

Use the preset in your `tailwind.config.ts`:

```typescript
import { preset } from '@astrale-os/ui'

export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

Or import directly from the preset package:

```typescript
import { astralePreset } from '@astrale-os/ui-preset'

export default {
  presets: [astralePreset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

### Workspace Component Libraries

If you're creating a component library within the monorepo that uses Tailwind classes:

**1. Add dev dependencies** in your library's `package.json`:

```json
{
  "devDependencies": {
    "@astrale-os/ui": "workspace:*",
    "tailwindcss": "^4.0.6"
  }
}
```

**2. Create a `tailwind.config.ts`** for IDE autocompletion:

```typescript
import { preset } from '@astrale-os/ui'

export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

**3. Update the consuming app's Tailwind config** to scan your library's source files:

```typescript
import { preset } from '@astrale-os/ui'

export default {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    '../my-library/src/**/*.{ts,tsx}',  // Add your library path
  ],
}
```

This ensures that Tailwind classes used in your library components are included in the final CSS build.

### Utilities

```typescript
import { cn } from '@astrale-os/ui-utils'

function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg bg-primary text-primary-foreground',
        className
      )}
      {...props}
    />
  )
}
```

### Constants

```typescript
import { WINDOW_BORDER_RADIUS, TASKBAR_HEIGHT } from '@astrale-os/ui-constants'
import { MACOS_COLORS, GLASS_COLORS } from '@astrale-os/ui-constants/colors'
```

## Dark Mode

The styles include both light and dark mode CSS variables. Use `next-themes` (already included) to enable dark mode:

```tsx
// In your app entry (main.tsx or layout.tsx)
import { ThemeProvider } from 'next-themes'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {/* your app */}
    </ThemeProvider>
  )
}
```

```tsx
// Toggle theme
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

## Glass Classes

The styles package provides ready-to-use glassmorphism classes:

| Class             | Use Case                           |
| ----------------- | ---------------------------------- |
| `.glass-window`   | Window backgrounds with heavy blur |
| `.glass-header`   | Title bar with gradient            |
| `.glass-panel`    | Side panels and dropdowns          |
| `.glass-taskbar`  | Bottom taskbar                     |
| `.glass-dock`     | Dock container                     |
| `.glass-card`     | Cards with subtle blur             |
| `.glass-dropdown` | Dropdown menus                     |

## macOS Window Buttons

```html
<button class="w-3 h-3 rounded-full macos-btn-close"></button>
<button class="w-3 h-3 rounded-full macos-btn-minimize"></button>
<button class="w-3 h-3 rounded-full macos-btn-maximize"></button>
```

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
```

### Building Components CSS

The `ui-components` package includes a pre-compiled CSS file with all Tailwind utilities used by the components. This is automatically built during `pnpm build`, but you can also build it manually:

```bash
pnpm -C components build:css
```

This generates `components/dist/styles.css` which is exported as `@astrale-os/ui-components/styles`.

## Architecture

```
ui/
├── components/     # React components with pre-compiled Tailwind CSS
├── styles/         # Base CSS variables, glass effects, macOS buttons
├── preset/         # Tailwind CSS v4 preset with theme configuration
├── utils/          # cn() and other utilities
├── constants/      # Layout and design tokens
└── ui/             # All-in-one re-export package
```

## License

MIT
