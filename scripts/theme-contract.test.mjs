import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

import {
  parseThemeDocument,
  parseThemeDocumentText,
  renderThemeCss,
  serializeThemeDocument,
  themeColorTokens,
  themeDocumentPatternSources,
  ThemeDocumentError,
} from '../tooling/theme-document/index.ts'

const directory = 'registry/themes'

async function themes() {
  return Promise.all(
    (await readdir(directory))
      .filter((file) => file.endsWith('.astrale-theme.json'))
      .toSorted()
      .map(async (file) => ({
        file,
        theme: parseThemeDocumentText(await readFile(`${directory}/${file}`, 'utf8')),
      })),
  )
}

test('portable schema and TypeScript admission own the same complete color vocabulary', async () => {
  const schema = JSON.parse(await readFile('schemas/theme.schema.json', 'utf8'))
  const mode = schema.$defs.mode
  assert.deepEqual(mode.required.toSorted(), [...themeColorTokens].toSorted())
  assert.deepEqual(Object.keys(mode.properties).toSorted(), [...themeColorTokens].toSorted())
  assert.equal(schema.properties.version.const, 2)
  assert.deepEqual(schema.properties.typography.required.toSorted(), ['body', 'heading', 'mono'])
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.name.pattern, themeDocumentPatternSources.name)
  assert.equal(schema.properties.label.pattern, themeDocumentPatternSources.label)
  assert.equal(schema.properties.description.pattern, themeDocumentPatternSources.description)
  assert.equal(schema.$defs.color.pattern, themeDocumentPatternSources.color)
  assert.equal(schema.$defs.font.pattern, themeDocumentPatternSources.font)
  assert.equal(schema.$defs.length.pattern, themeDocumentPatternSources.length)
  assert.equal(schema.$defs.duration.pattern, themeDocumentPatternSources.duration)
  assert.equal(schema.$defs.cssValue.pattern, themeDocumentPatternSources.cssValue)
})

test('every starter round-trips and projects to exact consumer-owned light and dark CSS', async () => {
  const documents = await themes()
  assert.deepEqual(
    documents.map(({ theme }) => theme.name),
    [
      'art-deco',
      'atelier',
      'claude',
      'clean-slate',
      'ghibli-studio',
      'marshmallow',
      'marvel',
      'modern-minimal',
      'neo-brutalism',
      'observatory',
      'spotify',
      'terminal',
    ],
  )
  for (const { file, theme } of documents) {
    assert.deepEqual(parseThemeDocumentText(serializeThemeDocument(theme)), theme)
    const css = renderThemeCss(theme)
    assert.equal(css, await readFile(`${directory}/${theme.name}.css`, 'utf8'), file)
    assert.match(css, new RegExp(`\\[data-ui-theme='${theme.name}'\\]`))
    assert.match(css, new RegExp(`\\[data-ui-theme='${theme.name}'\\]\\.dark`))
    for (const token of [
      '--ui-background',
      '--ui-primary',
      '--ui-chart-5',
      '--ui-sidebar-accent',
      '--ui-font-mono',
    ]) {
      assert.equal(css.match(new RegExp(`${token}:`, 'gu'))?.length, 2)
    }
  }
})

test('version 1 saved themes migrate deterministically to the complete version 2 surface', async () => {
  const current = (await themes()).find(({ theme }) => theme.name === 'observatory').theme
  const legacy = structuredClone(current)
  legacy.version = 1
  delete legacy.typography.mono
  for (const mode of ['light', 'dark']) {
    for (const token of [
      'sidebar',
      'sidebarForeground',
      'sidebarPrimary',
      'sidebarPrimaryForeground',
      'sidebarAccent',
      'sidebarAccentForeground',
      'sidebarBorder',
      'sidebarRing',
    ]) {
      delete legacy.appearance[mode][token]
    }
  }
  const migrated = parseThemeDocument(legacy)
  assert.equal(migrated.version, 2)
  assert.equal(migrated.appearance.light.sidebar, current.appearance.light.card)
  assert.equal(migrated.appearance.dark.sidebarAccent, current.appearance.dark.accent)
  assert.match(migrated.typography.mono, /ui-monospace/u)
})

test('admission rejects unknown fields and CSS injection before projection', async () => {
  const documents = await themes()
  assert.equal(documents.length, 12)
  const source = documents[0].theme
  for (const candidate of [
    { ...source, surprise: true },
    { ...source, name: '../escape' },
    {
      ...source,
      appearance: {
        ...source.appearance,
        light: { ...source.appearance.light, primary: 'red; } body { display: none' },
      },
    },
    { ...source, typography: { ...source.typography, heading: 'serif; color: red' } },
    { ...source, label: '<script>' },
    {
      ...source,
      appearance: {
        ...source.appearance,
        light: { ...source.appearance.light, primary: 'rgb(/*)' },
      },
    },
    {
      ...source,
      appearance: {
        ...source.appearance,
        light: { ...source.appearance.light, primary: 'rgb(foo)' },
      },
    },
    {
      ...source,
      appearance: {
        ...source.appearance,
        light: { ...source.appearance.light, primary: 'rgb(1deg 2deg 3deg)' },
      },
    },
    {
      ...source,
      appearance: {
        ...source.appearance,
        light: { ...source.appearance.light, primary: 'oklch(1deg 2deg 3deg)' },
      },
    },
    { ...source, effects: { ...source.effects, panelShadow: 'definitely-not-a-shadow' } },
    { ...source, effects: { ...source.effects, panelShadow: '0 2px -3px #000' } },
  ]) {
    assert.throws(() => parseThemeDocument(candidate), ThemeDocumentError)
  }
  assert.throws(() => parseThemeDocumentText(' '.repeat(131_073)), /exceeds 128 KiB/u)
})
