import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'

const root = new URL('../packages/ui/', import.meta.url)
const dist = new URL('dist/', root)

await mkdir(new URL('presets/', dist), { recursive: true })
await cp(new URL('src/theme/preflight.css', root), new URL('preflight.css', dist))
await cp(new URL('src/theme/reset.css', root), new URL('reset.css', dist))
await cp(new URL('src/theme/tailwind.css', root), new URL('tailwind.css', dist))
await cp(new URL('src/theme/tokens.css', root), new URL('tokens.css', dist))
await cp(new URL('src/theme/shadcn-tailwind.css', root), new URL('shadcn-tailwind.css', dist))
for (const preset of ['astrale', 'compact', 'expressive']) {
  await cp(new URL(`src/theme/presets/${preset}.css`, root), new URL(`presets/${preset}.css`, dist))
}

// `source.css` is published with what it imports next to it: the animation vocabulary the
// precompiled theme was built with (its package exports the stylesheet under the `style` condition
// only, which Node cannot resolve), and the package's sources relative to itself: the TypeScript
// under `src/` here, the compiled modules once published.
await cp(
  new URL('node_modules/tw-animate-css/dist/tw-animate.css', root),
  new URL('tw-animate.css', dist),
)
const published = [
  ["@import 'tw-animate-css';", "@import './tw-animate.css';"],
  ["@source '../**/*.{ts,tsx}';", "@source './**/*.js';"],
]
let source = await readFile(new URL('src/theme/source.css', root), 'utf8')
for (const [local, shipped] of published) {
  if (!source.includes(local)) throw new Error(`source.css must declare ${local}`)
  source = source.replace(local, shipped)
}
await writeFile(new URL('source.css', dist), source)
