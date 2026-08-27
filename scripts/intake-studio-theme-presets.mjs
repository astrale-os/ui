import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { serializeThemeDocument } from '../tooling/theme-document/index.ts'

const names = [
  'art-deco',
  'claude',
  'clean-slate',
  'ghibli-studio',
  'marshmallow',
  'marvel',
  'modern-minimal',
  'neo-brutalism',
  'spotify',
]
const providerRoot = 'tooling/upstream/providers/shadcn-studio/themes/2026-08-27'
const schema = 'https://raw.githubusercontent.com/astrale-os/ui/main/schemas/theme.schema.json'

const colorNames = {
  background: 'background',
  foreground: 'foreground',
  card: 'card',
  cardForeground: 'card-foreground',
  popover: 'popover',
  popoverForeground: 'popover-foreground',
  primary: 'primary',
  primaryForeground: 'primary-foreground',
  secondary: 'secondary',
  secondaryForeground: 'secondary-foreground',
  muted: 'muted',
  mutedForeground: 'muted-foreground',
  accent: 'accent',
  accentForeground: 'accent-foreground',
  destructive: 'destructive',
  destructiveForeground: 'destructive-foreground',
  border: 'border',
  input: 'input',
  ring: 'ring',
  chart1: 'chart-1',
  chart2: 'chart-2',
  chart3: 'chart-3',
  chart4: 'chart-4',
  chart5: 'chart-5',
  sidebar: 'sidebar',
  sidebarForeground: 'sidebar-foreground',
  sidebarPrimary: 'sidebar-primary',
  sidebarPrimaryForeground: 'sidebar-primary-foreground',
  sidebarAccent: 'sidebar-accent',
  sidebarAccentForeground: 'sidebar-accent-foreground',
  sidebarBorder: 'sidebar-border',
  sidebarRing: 'sidebar-ring',
}

const fontNames = new Map([
  ['delius-swash-caps', 'Delius Swash Caps'],
  ['dm-sans', 'DM Sans'],
  ['gabriela', 'Gabriela'],
  ['geist', 'Geist'],
  ['geist-mono', 'Geist Mono'],
  ['inter', 'Inter'],
  ['jetbrains-mono', 'JetBrains Mono'],
  ['lato', 'Lato'],
  ['merriweather', 'Merriweather'],
  ['nunito', 'Nunito'],
  ['outfit', 'Outfit'],
  ['pt-serif', 'PT Serif'],
  ['roboto-mono', 'Roboto Mono'],
  ['source-serif-4', 'Source Serif 4'],
  ['space-mono', 'Space Mono'],
])

function digest(source) {
  return createHash('sha256').update(source).digest('hex')
}

function label(name) {
  return name.replaceAll('-', ' ').replaceAll(/\b\w/gu, (character) => character.toUpperCase())
}

function fontSlug(value) {
  return /var\(--font-([a-z0-9-]+)\)/u.exec(value ?? '')?.[1]
}

function fontStack(slug, fallback) {
  const family = fontNames.get(slug)
  assert.ok(family, `unknown Studio font ${slug}`)
  return `'${family}', ${fallback}`
}

function colorMode(light, selected) {
  const inherited = { ...light, ...selected }
  if (!inherited['destructive-foreground']) {
    inherited['destructive-foreground'] = inherited['primary-foreground']
  }
  return Object.fromEntries(
    Object.entries(colorNames).map(([token, upstream]) => {
      assert.equal(typeof inherited[upstream], 'string', `missing ${upstream}`)
      return [token, inherited[upstream]]
    }),
  )
}

function project(source) {
  const light = source.cssVars.light
  const dark = source.cssVars.dark
  const root = source.css?.['@layer base']?.[':root'] ?? {}
  const fontDependencies = source.registryDependencies
    .filter((dependency) => dependency.includes('/fonts/font-'))
    .map((dependency) => /font-([a-z0-9-]+)\.json$/u.exec(dependency)?.[1])
    .filter(Boolean)
  const heading = fontSlug(root['--font-heading']) ?? fontDependencies[0]
  const body = fontSlug(root['--font-body']) ?? fontDependencies[1] ?? heading
  const mono = fontSlug(root['--font-mono']) ?? fontDependencies.at(-1)
  assert.ok(heading && body && mono, `${source.name} font projection`)
  const radius = light.radius ?? '0.625rem'

  return {
    $schema: schema,
    version: 2,
    name: source.name,
    label: label(source.name),
    description: `Shadcn Studio ${label(source.name)} preset, mechanically projected to Astrale theme tokens.`,
    appearance: {
      light: colorMode(light, light),
      dark: colorMode(light, dark),
    },
    typography: {
      body: fontStack(body, 'ui-serif, serif'),
      heading: fontStack(heading, 'ui-sans-serif, sans-serif'),
      mono: fontStack(mono, 'ui-monospace, monospace'),
    },
    geometry: { radius, panelRadius: radius },
    density: { control: '2.25rem', controlSmall: '2rem', controlLarge: '2.5rem' },
    effects: {
      controlShadow: light['shadow-xs'] ?? light.shadow ?? 'none',
      panelShadow: light['shadow-lg'] ?? light.shadow ?? 'none',
    },
    motion: { fast: '120ms', standard: '180ms' },
  }
}

await mkdir(path.join(providerRoot, 'raw'), { recursive: true })
const provenance = []
for (const name of names) {
  const url = `https://shadcnstudio.com/r/themes/${name}.json`
  const response = await fetch(url)
  assert.equal(response.ok, true, `${url}: ${response.status}`)
  const body = await response.text()
  const source = JSON.parse(body)
  assert.equal(source.name, name)
  await writeFile(path.join(providerRoot, 'raw', `${name}.json`), `${body.trim()}\n`)
  await writeFile(
    path.join('registry/themes', `${name}.astrale-theme.json`),
    serializeThemeDocument(project(source)),
  )
  provenance.push({
    name,
    upstreamAddress: `@ss-themes/${name}`,
    sourceUrl: url,
    sourceDigest: `sha256:${digest(body.trim())}`,
  })
}
await writeFile(
  path.join(providerRoot, 'provenance.json'),
  `${JSON.stringify({ provider: '@ss-themes', resolvedAt: '2026-08-27', presets: provenance }, null, 2)}\n`,
)

console.log(`PASS Shadcn Studio theme presets (${names.length} exact sources)`)
