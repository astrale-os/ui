# @astrale-os/ui

Astrale Design System - Shared UI styles, utilities, and constants for Astrale applications.

## Packages

| Package                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| `@astrale-os/ui-styles`    | CSS variables, glass effects, and base styles |
| `@astrale-os/ui-preset`    | Tailwind CSS preset with theme configuration  |
| `@astrale-os/ui-utils`     | Utility functions (`cn` for class merging)    |
| `@astrale-os/ui-constants` | Layout values and design tokens               |

## Installation

```bash
pnpm add @astrale-os/ui-styles @astrale-os/ui-preset @astrale-os/ui-utils @astrale-os/ui-constants
```

## Usage

### Styles

Import the base styles in your main CSS file:

```css
@import 'tailwindcss';
@import '@astrale-os/ui-styles';
```

Or import individual style modules:

```css
@import '@astrale-os/ui-styles/base';
@import '@astrale-os/ui-styles/glass';
@import '@astrale-os/ui-styles/macos-buttons';
```

### Tailwind Preset

Use the preset in your `tailwind.config.ts`:

```typescript
import { astralePreset } from '@astrale-os/ui-preset'
import type { Config } from 'tailwindcss'

export default {
  presets: [astralePreset],
  content: ['./src/**/*.{ts,tsx}'],
} satisfies Config
```

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

## License

MIT
