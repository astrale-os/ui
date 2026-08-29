import Ajv2020 from 'ajv/dist/2020.js'
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
  themeStyleProperties,
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
  assert.equal(schema.properties.version.const, 5)
  assert.deepEqual(schema.properties.typography.required.toSorted(), ['body', 'heading', 'mono'])
  assert.deepEqual(schema.$defs.typographyRole.required.toSorted(), [
    'family',
    'leading',
    'tracking',
    'weight',
  ])
  assert.equal(schema.properties.typography.properties.body.$ref, '#/$defs/typographyRole')
  assert.equal(schema.properties.typography.properties.heading.$ref, '#/$defs/typographyRole')
  assert.equal(schema.properties.typography.properties.mono.$ref, '#/$defs/font')
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.name.pattern, themeDocumentPatternSources.name)
  assert.equal(schema.properties.label.pattern, themeDocumentPatternSources.label)
  assert.equal(schema.properties.description.pattern, themeDocumentPatternSources.description)
  assert.equal(schema.$defs.color.pattern, themeDocumentPatternSources.color)
  assert.equal(schema.$defs.font.pattern, themeDocumentPatternSources.font)
  assert.equal(schema.$defs.length.pattern, themeDocumentPatternSources.length)
  assert.equal(schema.$defs.tracking.pattern, themeDocumentPatternSources.tracking)
  assert.equal(schema.$defs.leading.pattern, themeDocumentPatternSources.leading)
  assert.equal(schema.$defs.duration.pattern, themeDocumentPatternSources.duration)
  assert.equal(schema.$defs.cssValue.pattern, themeDocumentPatternSources.cssValue)
  assert.equal(schema.$defs.generatorSeed.pattern, themeDocumentPatternSources.generatorSeed)
  assert.deepEqual(schema.$defs.generatorMetadata.required.toSorted(), [
    'derivationSeeds',
    'dna',
    'editedBranches',
    'engineVersion',
    'fontCatalogVersion',
    'kind',
    'lineage',
    'locks',
    'seed',
    'version',
  ])
  assert.deepEqual(schema.$defs.generatorMetadata.properties.derivationSeeds.required.toSorted(), [
    'geometry',
    'palette',
    'typography',
  ])
})

test('every starter round-trips and projects to exact consumer-owned light and dark CSS', async () => {
  const documents = await themes()
  assert.deepEqual(
    documents.map(({ theme }) => theme.name),
    ['observatory'],
  )
  for (const { file, theme } of documents) {
    assert.deepEqual(parseThemeDocumentText(serializeThemeDocument(theme)), theme)
    const css = renderThemeCss(theme)
    assert.equal(css, await readFile(`${directory}/${theme.name}.css`, 'utf8'), file)
    assert.match(css, new RegExp(`\\[data-ui-theme='${theme.name}'\\]`))
    assert.match(css, new RegExp(`\\[data-ui-theme='${theme.name}'\\]\\.dark`))
    for (const mode of ['light', 'dark']) {
      const properties = themeStyleProperties(theme, mode)
      assert.equal(properties['--ui-primary'], theme.appearance[mode].primary)
      assert.equal(properties['--ui-font-heading'], theme.typography.heading.family)
      assert.equal(properties['--ui-tracking-body'], theme.typography.body.tracking)
      assert.equal(properties['--ui-leading-heading'], theme.typography.heading.leading)
      assert.equal(properties['--ui-weight-body'], String(theme.typography.body.weight))
      assert.equal(properties['--ui-weight-heading'], String(theme.typography.heading.weight))
      assert.equal(properties['--ui-radius'], theme.geometry.radius)
      for (const [name, value] of Object.entries(properties)) {
        assert.ok(
          css.includes(`${name}: ${value};`) || css.includes(`${name}:\n    ${value};`),
          `${file} projects ${name}`,
        )
      }
    }
    for (const token of [
      '--ui-background',
      '--ui-primary',
      '--ui-chart-5',
      '--ui-sidebar-accent',
      '--ui-font-mono',
      '--ui-tracking-heading',
      '--ui-leading-body',
      '--ui-weight-body',
      '--ui-weight-heading',
    ]) {
      assert.equal(css.match(new RegExp(`${token}:`, 'gu'))?.length, 2)
    }
  }
})

test('version 1 through 4 saved themes migrate deterministically without fabricated provenance', async () => {
  const current = (await themes()).find(({ theme }) => theme.name === 'observatory').theme
  const legacy = structuredClone(current)
  legacy.version = 1
  legacy.typography = {
    body: current.typography.body.family,
    heading: current.typography.heading.family,
  }
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
  assert.equal(migrated.version, 5)
  assert.equal(migrated.appearance.light.sidebar, current.appearance.light.card)
  assert.equal(migrated.appearance.dark.sidebarAccent, current.appearance.dark.accent)
  assert.deepEqual(migrated.typography, {
    body: { family: current.typography.body.family, tracking: '0', leading: '1.5', weight: 400 },
    heading: {
      family: current.typography.heading.family,
      tracking: '-0.01em',
      leading: '1.2',
      weight: 600,
    },
    mono: "'SFMono-Regular', 'Cascadia Code', ui-monospace, monospace",
  })

  const version2 = {
    ...current,
    version: 2,
    typography: {
      body: current.typography.body.family,
      heading: current.typography.heading.family,
      mono: current.typography.mono,
    },
  }
  assert.deepEqual(parseThemeDocument(version2).typography, {
    body: { family: current.typography.body.family, tracking: '0', leading: '1.5', weight: 400 },
    heading: {
      family: current.typography.heading.family,
      tracking: '-0.01em',
      leading: '1.2',
      weight: 600,
    },
    mono: current.typography.mono,
  })

  const version3 = structuredClone(current)
  version3.version = 3
  delete version3.typography.body.weight
  assert.deepEqual(parseThemeDocument(version3).typography, current.typography)

  const version4 = structuredClone(current)
  version4.version = 4
  const migratedVersion4 = parseThemeDocument(version4)
  assert.equal(migratedVersion4.version, 5)
  assert.equal(migratedVersion4.generation, undefined)
})

test('JSON Schema and TypeScript agree on generator metadata admission boundaries', async () => {
  const schema = JSON.parse(await readFile('schemas/theme.schema.json', 'utf8'))
  const validate = new Ajv2020({ strict: false }).compile(schema)
  const source = (await themes())[0].theme
  const generated = {
    ...source,
    generation: {
      kind: 'astrale.theme-generation',
      version: 1,
      engineVersion: 2,
      fontCatalogVersion: 1,
      seed: '0123456789abcdef0123456789abcdef',
      derivationSeeds: {
        palette: '11111111111111111111111111111111',
        typography: '22222222222222222222222222222222',
        geometry: '33333333333333333333333333333333',
      },
      dna: {
        palette: {
          hue: 251,
          relation: 'analogous',
          colorfulness: 0.5,
          contrast: 0.7,
          tint: 0.2,
          warmth: 0.1,
        },
        typography: { contrast: 0.6, compactness: 0.5 },
        geometry: { density: 0.5, roundness: 0.5, elevation: 0.3 },
      },
      locks: ['typography'],
      editedBranches: ['palette', 'typography', 'geometry'],
      lineage: { kind: 'new-direction' },
    },
  }
  const candidates = [
    { candidate: generated, expected: true },
    {
      candidate: { ...generated, generation: { ...generated.generation, engineVersion: 1 } },
      expected: false,
    },
    {
      candidate: { ...generated, generation: { ...generated.generation, seed: 'ABCDEF' } },
      expected: false,
    },
    {
      candidate: {
        ...generated,
        generation: { ...generated.generation, locks: ['palette', 'palette'] },
      },
      expected: false,
    },
    {
      candidate: {
        ...generated,
        generation: {
          ...generated.generation,
          dna: {
            ...generated.generation.dna,
            palette: { ...generated.generation.dna.palette, hue: 360 },
          },
        },
      },
      expected: false,
    },
    {
      candidate: {
        ...generated,
        generation: {
          ...generated.generation,
          lineage: { kind: 'fallback', failedAttempts: 11 },
        },
      },
      expected: false,
    },
    {
      candidate: {
        ...generated,
        generation: {
          ...generated.generation,
          derivationSeeds: { ...generated.generation.derivationSeeds, surprise: '0'.repeat(32) },
        },
      },
      expected: false,
    },
  ]
  for (const { candidate, expected } of candidates) {
    const schemaAccepted = validate(candidate)
    let runtimeAccepted = true
    try {
      parseThemeDocument(candidate)
    } catch {
      runtimeAccepted = false
    }
    assert.equal(schemaAccepted, expected, JSON.stringify(validate.errors))
    assert.equal(runtimeAccepted, expected)
  }
})

test('admission rejects unknown fields and CSS injection before projection', async () => {
  const documents = await themes()
  assert.equal(documents.length, 1)
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
    {
      ...source,
      typography: {
        ...source.typography,
        heading: { ...source.typography.heading, family: 'serif; color: red' },
      },
    },
    {
      ...source,
      typography: {
        ...source.typography,
        body: { ...source.typography.body, weight: 650 },
      },
    },
    {
      ...source,
      typography: {
        ...source.typography,
        heading: { ...source.typography.heading, weight: 650 },
      },
    },
    {
      ...source,
      typography: {
        ...source.typography,
        body: { ...source.typography.body, tracking: '1px' },
      },
    },
    {
      ...source,
      typography: {
        ...source.typography,
        heading: { ...source.typography.heading, tracking: '0.05em' },
      },
    },
    {
      ...source,
      typography: {
        ...source.typography,
        body: { ...source.typography.body, leading: '3' },
      },
    },
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
