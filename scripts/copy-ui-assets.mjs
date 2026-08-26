import { cp, mkdir } from 'node:fs/promises'

const root = new URL('../packages/ui/', import.meta.url)
const dist = new URL('dist/', root)

await mkdir(new URL('presets/', dist), { recursive: true })
await cp(new URL('src/theme/preflight.css', root), new URL('preflight.css', dist))
await cp(new URL('src/theme/reset.css', root), new URL('reset.css', dist))
for (const preset of ['astrale', 'compact', 'expressive']) {
  await cp(new URL(`src/theme/presets/${preset}.css`, root), new URL(`presets/${preset}.css`, dist))
}
