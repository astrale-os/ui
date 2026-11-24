import Ajv2020 from 'ajv/dist/2020.js'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

import {
  parseThemeDocument,
  parseThemeDocumentText,
  renderThemeCss,
  effectDefaults,
  serializeThemeDocument,
  statusColorDefaults,
  themeColorTokens,
  themeStatusColorTokens,
  themeDocumentPatternSources,
  themeStyleProperties,
  spacingDefaults,
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
  assert.equal(schema.properties.version.const, 8)
  assert.deepEqual(schema.properties.typography.required.toSorted(), [
    'body',
    'heading',
    'label',
    'mono',
  ])
  assert.deepEqual(schema.properties.typography.properties.label.required, ['weight'])
  assert.equal(
    schema.properties.typography.properties.label.properties.weight.$ref,
    '#/$defs/fontWeight',
  )
  assert.deepEqual(schema.properties.density.required.toSorted(), [
    'control',
    'controlLarge',
    'controlPadding',
    'controlSmall',
    'panelSpacing',
  ])
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
    [
      'console',
      'desktop',
      'observatory',
      'spatial-calm',
      'spatial-compact',
      'spatial-crisp',
      'spatial-round',
      'spatial',
    ],
  )
  const schema = JSON.parse(await readFile('schemas/theme.schema.json', 'utf8'))
  const validate = new Ajv2020({ strict: false }).compile(schema)
  for (const { file, theme } of documents) {
    assert.ok(validate(theme), `${file}: ${JSON.stringify(validate.errors)}`)
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
      assert.equal(properties['--ui-weight-label'], String(theme.typography.label.weight))
      assert.equal(properties['--ui-radius'], theme.geometry.radius)
      assert.equal(properties['--ui-control-padding'], theme.density.controlPadding)
      assert.equal(properties['--ui-panel-spacing'], theme.density.panelSpacing)
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
      '--ui-success',
      '--ui-warning-foreground',
      '--ui-sidebar-accent',
      '--ui-font-mono',
      '--ui-tracking-heading',
      '--ui-leading-body',
      '--ui-weight-body',
      '--ui-weight-heading',
      '--ui-weight-label',
      '--ui-control-padding',
      '--ui-panel-spacing',
    ]) {
      assert.equal(css.match(new RegExp(`${token}:`, 'gu'))?.length, 2)
    }
  }
})

/** The theme as version 7 saved it: no label weight, control padding, or panel spacing. */
function asVersion7(theme) {
  const legacy = structuredClone(theme)
  legacy.version = 7
  delete legacy.typography.label
  delete legacy.density.controlPadding
  delete legacy.density.panelSpacing
  return legacy
}

/** The theme as version 6 saved it: one set of effects for both modes, no action radius. */
function asVersion6(theme) {
  const legacy = asVersion7(theme)
  legacy.version = 6
  delete legacy.geometry.actionRadius
  const { controlShadow, panelShadow } = theme.effects.light
  legacy.effects = { controlShadow, panelShadow }
  return legacy
}

test('version 1 through 7 saved themes migrate deterministically without fabricated provenance', async () => {
  const current = (await themes()).find(({ theme }) => theme.name === 'observatory').theme
  const legacy = asVersion6(current)
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
  assert.equal(migrated.version, 8)
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
    label: { weight: spacingDefaults.labelWeight },
    mono: "'SFMono-Regular', 'Cascadia Code', ui-monospace, monospace",
  })

  const version2 = {
    ...asVersion6(current),
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
    label: { weight: spacingDefaults.labelWeight },
    mono: current.typography.mono,
  })

  const version3 = asVersion6(current)
  version3.version = 3
  delete version3.typography.body.weight
  assert.deepEqual(parseThemeDocument(version3).typography, {
    ...current.typography,
    label: { weight: spacingDefaults.labelWeight },
  })

  const version4 = asVersion6(current)
  version4.version = 4
  const migratedVersion4 = parseThemeDocument(version4)
  assert.equal(migratedVersion4.version, 8)
  assert.equal(migratedVersion4.generation, undefined)

  const version5 = asVersion6(current)
  version5.version = 5
  version5.generation = { kind: 'astrale.theme-generation', engineVersion: 2 }
  for (const mode of ['light', 'dark']) {
    for (const token of themeStatusColorTokens) delete version5.appearance[mode][token]
  }
  const migratedVersion5 = parseThemeDocument(version5)
  assert.equal(migratedVersion5.version, 8)
  assert.equal(migratedVersion5.generation, undefined)
  for (const mode of ['light', 'dark']) {
    for (const token of themeStatusColorTokens) {
      assert.equal(migratedVersion5.appearance[mode][token], statusColorDefaults[mode][token])
    }
  }

  const version6 = asVersion6(current)
  version6.generation = { kind: 'astrale.theme-generation', engineVersion: 3 }
  const migratedVersion6 = parseThemeDocument(version6)
  assert.equal(migratedVersion6.version, 8)
  assert.equal(migratedVersion6.generation, undefined)
  assert.equal(migratedVersion6.geometry.actionRadius, null)
  for (const mode of ['light', 'dark']) {
    assert.deepEqual(migratedVersion6.effects[mode], {
      controlShadow: version6.effects.controlShadow,
      panelShadow: version6.effects.panelShadow,
      ...effectDefaults,
    })
  }

  const spatial = (await themes()).find(({ theme }) => theme.name === 'spatial').theme
  const version7 = asVersion7(spatial)
  version7.generation = { kind: 'astrale.theme-generation', engineVersion: 4 }
  const migratedVersion7 = parseThemeDocument(version7)
  assert.equal(migratedVersion7.version, 8)
  assert.equal(migratedVersion7.generation, undefined)
  assert.deepEqual(migratedVersion7.typography, {
    ...spatial.typography,
    label: { weight: spacingDefaults.labelWeight },
  })
  assert.deepEqual(migratedVersion7.density, {
    ...spatial.density,
    controlPadding: spacingDefaults.controlPadding,
    panelSpacing: spacingDefaults.panelSpacing,
  })
})

test('effects project per mode and an unset action radius resets to the component radius', async () => {
  const documents = await themes()
  const spatial = documents.find(({ theme }) => theme.name === 'spatial').theme
  const observatory = documents.find(({ theme }) => theme.name === 'observatory').theme
  for (const mode of ['light', 'dark']) {
    const properties = themeStyleProperties(spatial, mode)
    assert.equal(properties['--ui-radius-action'], '9999px')
    assert.equal(properties['--ui-shadow-control'], spatial.effects[mode].controlShadow)
    assert.equal(properties['--ui-shadow-panel'], spatial.effects[mode].panelShadow)
    assert.equal(properties['--ui-shadow-overlay'], spatial.effects[mode].overlayShadow)
    assert.equal(properties['--ui-backdrop'], spatial.effects[mode].backdrop)
    // `initial` is guaranteed-invalid, so `var(--ui-radius-action, <fallback>)` takes the
    // fallback and a theme switch never inherits the previous theme's action radius.
    assert.equal(themeStyleProperties(observatory, mode)['--ui-radius-action'], 'initial')
  }
  assert.notEqual(spatial.effects.light.backdrop, spatial.effects.dark.backdrop)
})

test('shadow tokens stay composable with ring shadows in every preset and projected theme', async () => {
  const observatory = (await themes()).find(({ theme }) => theme.name === 'observatory').theme
  const shadowless = { controlShadow: 'none', panelShadow: 'none', overlayShadow: 'none' }
  const theme = {
    ...observatory,
    effects: {
      light: { ...observatory.effects.light, ...shadowless },
      dark: { ...observatory.effects.dark, ...shadowless },
    },
  }
  for (const mode of ['light', 'dark']) {
    const properties = themeStyleProperties(theme, mode)
    for (const token of ['--ui-shadow-control', '--ui-shadow-panel', '--ui-shadow-overlay']) {
      assert.equal(properties[token], '0 0 #0000', `${mode} ${token}`)
    }
  }
  assert.doesNotMatch(renderThemeCss(theme), /--ui-shadow-[a-z]+:\s*none/u)
  const presets = 'packages/ui/src/theme/presets'
  for (const file of [
    'packages/ui/src/theme/tokens.css',
    ...(await readdir(presets)).map((name) => `${presets}/${name}`),
  ]) {
    assert.doesNotMatch(await readFile(file, 'utf8'), /--ui-shadow-[a-z]+:\s*none/u, file)
  }
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
      engineVersion: 5,
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
    ...[1, 4].map((engineVersion) => ({
      candidate: { ...generated, generation: { ...generated.generation, engineVersion } },
      expected: false,
    })),
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
  const source = (await themes()).find(({ theme }) => theme.name === 'observatory').theme
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
        body: { ...source.typography.body, weight: 950 },
      },
    },
    {
      ...source,
      typography: {
        ...source.typography,
        heading: { ...source.typography.heading, weight: 612.5 },
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
    ...[{ weight: 50 }, { weight: 550.5 }, { weight: '600' }, { weight: 500, family: 'serif' }].map(
      (label) => ({ ...source, typography: { ...source.typography, label } }),
    ),
    ...[
      { controlPadding: '1rem; color: red' },
      { controlPadding: 'wide' },
      { panelSpacing: '-1rem' },
      { panelSpacing: undefined },
    ].map((patch) => ({ ...source, density: { ...source.density, ...patch } })),
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
    ...['light', 'dark'].flatMap((mode) =>
      [
        { panelShadow: 'definitely-not-a-shadow' },
        { panelShadow: '0 2px -3px #000' },
        { overlayShadow: 'red; } body { display: none' },
        { backdrop: 'not-a-color' },
        { surprise: '0 1px 2px #000' },
      ].map((patch) => ({
        ...source,
        effects: { ...source.effects, [mode]: { ...source.effects[mode], ...patch } },
      })),
    ),
    { ...source, effects: source.effects.light },
    { ...source, geometry: { ...source.geometry, actionRadius: 'pill' } },
    { ...source, geometry: { ...source.geometry, actionRadius: undefined } },
  ]) {
    assert.throws(() => parseThemeDocument(candidate), ThemeDocumentError)
  }
  assert.throws(() => parseThemeDocumentText(' '.repeat(131_073)), /exceeds 128 KiB/u)
})
