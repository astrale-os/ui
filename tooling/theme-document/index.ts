export const THEME_DOCUMENT_VERSION = 5 as const
export const THEME_DOCUMENT_MAX_BYTES = 131_072
export const THEME_GENERATOR_VERSION = 1 as const
export const THEME_GENERATOR_ENGINE_VERSION = 2 as const
export const THEME_FONT_CATALOG_VERSION = 1 as const

export const themeColorTokens = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'border',
  'input',
  'ring',
  'chart1',
  'chart2',
  'chart3',
  'chart4',
  'chart5',
  'sidebar',
  'sidebarForeground',
  'sidebarPrimary',
  'sidebarPrimaryForeground',
  'sidebarAccent',
  'sidebarAccentForeground',
  'sidebarBorder',
  'sidebarRing',
] as const

export type ThemeColorToken = (typeof themeColorTokens)[number]
export type ThemeMode = Record<ThemeColorToken, string>

export const generatorBranches = ['palette', 'typography', 'geometry'] as const
export type GeneratorBranch = (typeof generatorBranches)[number]
export type PaletteRelation = 'tonal' | 'analogous' | 'complementary' | 'split'

export interface ThemeDNA {
  readonly palette: {
    readonly hue: number
    readonly relation: PaletteRelation
    readonly colorfulness: number
    readonly contrast: number
    readonly tint: number
    readonly warmth: number
  }
  readonly typography: {
    readonly contrast: number
    readonly compactness: number
  }
  readonly geometry: {
    readonly density: number
    readonly roundness: number
    readonly elevation: number
  }
}

export type GeneratorLineage =
  | { readonly kind: 'new-direction' }
  | { readonly kind: 'variation'; readonly parentSeed: string }
  | { readonly kind: 'fallback'; readonly failedAttempts: 12 }

export interface GeneratorMetadata {
  readonly kind: 'astrale.theme-generation'
  readonly version: typeof THEME_GENERATOR_VERSION
  readonly engineVersion: typeof THEME_GENERATOR_ENGINE_VERSION
  readonly fontCatalogVersion: typeof THEME_FONT_CATALOG_VERSION
  readonly seed: string
  readonly derivationSeeds: Readonly<Record<GeneratorBranch, string>>
  readonly dna: ThemeDNA
  readonly locks: readonly GeneratorBranch[]
  readonly editedBranches: readonly GeneratorBranch[]
  readonly lineage: GeneratorLineage
}

export interface ThemeTypographyRole {
  readonly family: string
  readonly tracking: string
  readonly leading: string
  readonly weight: number
}

export interface ThemeDocument {
  readonly $schema: string
  readonly version: typeof THEME_DOCUMENT_VERSION
  readonly name: string
  readonly label: string
  readonly description: string
  readonly appearance: {
    readonly light: ThemeMode
    readonly dark: ThemeMode
  }
  readonly typography: {
    readonly body: ThemeTypographyRole
    readonly heading: ThemeTypographyRole
    readonly mono: string
  }
  readonly geometry: {
    readonly radius: string
    readonly panelRadius: string
  }
  readonly density: {
    readonly control: string
    readonly controlSmall: string
    readonly controlLarge: string
  }
  readonly effects: {
    readonly controlShadow: string
    readonly panelShadow: string
  }
  readonly motion: {
    readonly fast: string
    readonly standard: string
  }
  readonly generation?: GeneratorMetadata
}

export class ThemeDocumentError extends Error {
  readonly code = 'THEME_DOCUMENT_INVALID'

  constructor(message: string) {
    super(message)
    this.name = 'ThemeDocumentError'
  }
}

const schemaUrl = 'https://raw.githubusercontent.com/astrale-os/ui/main/schemas/theme.schema.json'
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u
const labelPattern = /^[^{}<>\\\n\r]+$/u
const descriptionPattern = /^[^{}<>\\\n\r]*$/u
const colorPattern =
  /^(?!.*\/\*)(?!.*\*\/)(?:(?:oklch|rgb|rgba|hsl|hsla)\(\s*[+-]?(?:[0-9]|\.)[0-9+.%degarturn,/\s-]*\)|#[0-9A-Fa-f]{3,8})$/u
const lengthPattern = /^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$/u
const trackingPattern = /^(?:0|-?0\.(?:0(?:[0-3][0-9]*|40*)?)em)$/u
const leadingPattern = /^(?:1(?:\.[0-9]+)?|2(?:\.0+)?)$/u
const durationPattern = /^(?:0|[0-9]+(?:\.[0-9]+)?m?s)$/u
const shadowPattern =
  /^(?!.*\/\*)(?!.*\*\/)(?:none|(?:inset\s+)?-?(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))(?:\s|$)[^{};\\]+)$/u
const fontPattern = /^(?!.*\/\*)(?!.*\*\/)[^{};\\\n\r]{1,240}$/u
const generatorSeedPattern = /^[0-9a-f]{32}$/u

export const themeDocumentPatternSources = {
  name: slugPattern.source,
  label: labelPattern.source,
  description: descriptionPattern.source,
  color: colorPattern.source,
  font: fontPattern.source,
  length: lengthPattern.source,
  tracking: trackingPattern.source,
  leading: leadingPattern.source,
  duration: durationPattern.source,
  cssValue: shadowPattern.source,
  generatorSeed: generatorSeedPattern.source,
} as const

const cssNames: Record<ThemeColorToken, string> = {
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

const fontRegistryByFamily = new Map([
  ['Delius Swash Caps', 'font-delius-swash-caps'],
  ['DM Sans', 'font-dm-sans'],
  ['Gabriela', 'font-gabriela'],
  ['Geist', 'font-geist'],
  ['Geist Mono', 'font-geist-mono'],
  ['Inter', 'font-inter'],
  ['JetBrains Mono', 'font-jetbrains-mono'],
  ['Lato', 'font-lato'],
  ['Merriweather', 'font-merriweather'],
  ['Nunito', 'font-nunito'],
  ['Outfit', 'font-outfit'],
  ['PT Serif', 'font-pt-serif'],
  ['Roboto Mono', 'font-roboto-mono'],
  ['Source Serif 4', 'font-source-serif-4'],
  ['Space Mono', 'font-space-mono'],
])

export function themeFontRegistryDependencies(theme: ThemeDocument): string[] {
  return [
    ...new Set(
      [
        theme.typography.heading.family,
        theme.typography.body.family,
        theme.typography.mono,
      ].flatMap((stack) => {
        const family = /^'([^']+)'/u.exec(stack)?.[1]
        const item = family ? fontRegistryByFamily.get(family) : undefined
        return item ? [`https://shadcnstudio.com/r/fonts/${item}.json`] : []
      }),
    ),
  ]
}

function migrateThemeDocument(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input
  let candidate = input as Record<string, unknown>
  if (candidate.version === 1) {
    const appearance = candidate.appearance as
      | { light?: Record<string, unknown>; dark?: Record<string, unknown> }
      | undefined
    const typography = candidate.typography as Record<string, unknown> | undefined
    if (!appearance?.light || !appearance.dark || !typography) return input
    const migrateMode = (mode: Record<string, unknown>) => ({
      ...mode,
      sidebar: mode.card,
      sidebarForeground: mode.foreground,
      sidebarPrimary: mode.primary,
      sidebarPrimaryForeground: mode.primaryForeground,
      sidebarAccent: mode.accent,
      sidebarAccentForeground: mode.accentForeground,
      sidebarBorder: mode.border,
      sidebarRing: mode.ring,
    })
    candidate = {
      ...candidate,
      version: 2,
      appearance: {
        light: migrateMode(appearance.light),
        dark: migrateMode(appearance.dark),
      },
      typography: {
        ...typography,
        mono: "'SFMono-Regular', 'Cascadia Code', ui-monospace, monospace",
      },
    }
  }
  if (candidate.version === 2) {
    const typography = candidate.typography as Record<string, unknown> | undefined
    if (
      !typography ||
      typeof typography.body !== 'string' ||
      typeof typography.heading !== 'string'
    ) {
      return input
    }
    candidate = {
      ...candidate,
      version: 3,
      typography: {
        body: { family: typography.body, tracking: '0', leading: '1.5' },
        heading: { family: typography.heading, tracking: '-0.01em', leading: '1.2', weight: 600 },
        mono: typography.mono,
      },
    }
  }
  if (candidate.version === 3) {
    const typography = candidate.typography as Record<string, unknown> | undefined
    const body = typography?.body as Record<string, unknown> | undefined
    if (!typography || !body) return input
    candidate = {
      ...candidate,
      version: 4,
      typography: {
        ...typography,
        body: { ...body, weight: 400 },
      },
    }
  }
  if (candidate.version === 4) {
    candidate = { ...candidate, version: THEME_DOCUMENT_VERSION }
    delete candidate.generation
  }
  return candidate
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ThemeDocumentError(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string) {
  const actual = Object.keys(value).sort()
  const desired = [...expected].sort()
  if (actual.length !== desired.length || actual.some((key, index) => key !== desired[index])) {
    throw new ThemeDocumentError(`${label} contains an unknown or missing field.`)
  }
}

function boundedNumber(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ThemeDocumentError(`${label} is invalid.`)
  }
  return value
}

function exactInteger(value: unknown, expected: number, label: string): number {
  if (value !== expected) throw new ThemeDocumentError(`${label} is unsupported.`)
  return expected
}

function branchList(value: unknown, label: string): readonly GeneratorBranch[] {
  if (!Array.isArray(value) || value.length > generatorBranches.length) {
    throw new ThemeDocumentError(`${label} is invalid.`)
  }
  const branches = value.map((branch) => {
    if (typeof branch !== 'string' || !generatorBranches.includes(branch as GeneratorBranch)) {
      throw new ThemeDocumentError(`${label} is invalid.`)
    }
    return branch as GeneratorBranch
  })
  if (new Set(branches).size !== branches.length) {
    throw new ThemeDocumentError(`${label} contains a duplicate branch.`)
  }
  return [...branches].sort()
}

function themeDna(value: unknown, label: string): ThemeDNA {
  const candidate = record(value, label)
  exactKeys(candidate, ['palette', 'typography', 'geometry'], label)
  const palette = record(candidate.palette, `${label}.palette`)
  exactKeys(
    palette,
    ['hue', 'relation', 'colorfulness', 'contrast', 'tint', 'warmth'],
    `${label}.palette`,
  )
  const relation = palette.relation
  if (
    relation !== 'tonal' &&
    relation !== 'analogous' &&
    relation !== 'complementary' &&
    relation !== 'split'
  ) {
    throw new ThemeDocumentError(`${label}.palette.relation is invalid.`)
  }
  const typography = record(candidate.typography, `${label}.typography`)
  exactKeys(typography, ['contrast', 'compactness'], `${label}.typography`)
  const geometry = record(candidate.geometry, `${label}.geometry`)
  exactKeys(geometry, ['density', 'roundness', 'elevation'], `${label}.geometry`)
  return {
    palette: {
      hue: boundedNumber(palette.hue, `${label}.palette.hue`, 0, 359.999_999_999),
      relation,
      colorfulness: boundedNumber(palette.colorfulness, `${label}.palette.colorfulness`, 0, 1),
      contrast: boundedNumber(palette.contrast, `${label}.palette.contrast`, 0, 1),
      tint: boundedNumber(palette.tint, `${label}.palette.tint`, 0, 1),
      warmth: boundedNumber(palette.warmth, `${label}.palette.warmth`, -1, 1),
    },
    typography: {
      contrast: boundedNumber(typography.contrast, `${label}.typography.contrast`, 0, 1),
      compactness: boundedNumber(typography.compactness, `${label}.typography.compactness`, 0, 1),
    },
    geometry: {
      density: boundedNumber(geometry.density, `${label}.geometry.density`, 0, 1),
      roundness: boundedNumber(geometry.roundness, `${label}.geometry.roundness`, 0, 1),
      elevation: boundedNumber(geometry.elevation, `${label}.geometry.elevation`, 0, 1),
    },
  }
}

function generatorLineage(value: unknown, label: string): GeneratorLineage {
  const candidate = record(value, label)
  if (candidate.kind === 'new-direction') {
    exactKeys(candidate, ['kind'], label)
    return { kind: 'new-direction' }
  }
  if (candidate.kind === 'variation') {
    exactKeys(candidate, ['kind', 'parentSeed'], label)
    return {
      kind: 'variation',
      parentSeed: text(candidate.parentSeed, `${label}.parentSeed`, generatorSeedPattern, 32, 32),
    }
  }
  if (candidate.kind === 'fallback') {
    exactKeys(candidate, ['kind', 'failedAttempts'], label)
    if (candidate.failedAttempts !== 12) {
      throw new ThemeDocumentError(`${label}.failedAttempts is invalid.`)
    }
    return { kind: 'fallback', failedAttempts: 12 }
  }
  throw new ThemeDocumentError(`${label}.kind is invalid.`)
}

function generatorMetadata(value: unknown, label: string): GeneratorMetadata {
  const candidate = record(value, label)
  exactKeys(
    candidate,
    [
      'kind',
      'version',
      'engineVersion',
      'fontCatalogVersion',
      'seed',
      'derivationSeeds',
      'dna',
      'locks',
      'editedBranches',
      'lineage',
    ],
    label,
  )
  if (candidate.kind !== 'astrale.theme-generation') {
    throw new ThemeDocumentError(`${label}.kind is invalid.`)
  }
  return {
    kind: 'astrale.theme-generation',
    version: exactInteger(candidate.version, THEME_GENERATOR_VERSION, `${label}.version`) as 1,
    engineVersion: exactInteger(
      candidate.engineVersion,
      THEME_GENERATOR_ENGINE_VERSION,
      `${label}.engineVersion`,
    ) as 2,
    fontCatalogVersion: exactInteger(
      candidate.fontCatalogVersion,
      THEME_FONT_CATALOG_VERSION,
      `${label}.fontCatalogVersion`,
    ) as 1,
    seed: text(candidate.seed, `${label}.seed`, generatorSeedPattern, 32, 32),
    derivationSeeds: (() => {
      const seeds = record(candidate.derivationSeeds, `${label}.derivationSeeds`)
      exactKeys(seeds, generatorBranches, `${label}.derivationSeeds`)
      return Object.fromEntries(
        generatorBranches.map((branch) => [
          branch,
          text(seeds[branch], `${label}.derivationSeeds.${branch}`, generatorSeedPattern, 32, 32),
        ]),
      ) as Record<GeneratorBranch, string>
    })(),
    dna: themeDna(candidate.dna, `${label}.dna`),
    locks: branchList(candidate.locks, `${label}.locks`),
    editedBranches: branchList(candidate.editedBranches, `${label}.editedBranches`),
    lineage: generatorLineage(candidate.lineage, `${label}.lineage`),
  }
}

function text(value: unknown, label: string, pattern: RegExp, minimum = 1, maximum = 240): string {
  if (
    typeof value !== 'string' ||
    value.length < minimum ||
    value.length > maximum ||
    !pattern.test(value)
  ) {
    throw new ThemeDocumentError(`${label} is invalid.`)
  }
  return value
}

function fontWeight(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 100 ||
    value > 900 ||
    value % 100 !== 0
  ) {
    throw new ThemeDocumentError(`${label} is invalid.`)
  }
  return value
}

const cssNumber = String.raw`[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)`
const percentage = String.raw`${cssNumber}%`
const numberOrPercentage = String.raw`(?:${cssNumber}|${percentage})`
const hue = String.raw`${cssNumber}(?:deg|grad|rad|turn)?`
const alpha = numberOrPercentage
const oklchBody = new RegExp(
  String.raw`^${numberOrPercentage}\s+${numberOrPercentage}\s+${hue}(?:\s*\/\s*${alpha})?$`,
  'u',
)
const rgbModernBody = new RegExp(
  String.raw`^${numberOrPercentage}\s+${numberOrPercentage}\s+${numberOrPercentage}(?:\s*\/\s*${alpha})?$`,
  'u',
)
const rgbLegacyBody = new RegExp(
  String.raw`^${numberOrPercentage}\s*,\s*${numberOrPercentage}\s*,\s*${numberOrPercentage}(?:\s*,\s*${alpha})?$`,
  'u',
)
const hslModernBody = new RegExp(
  String.raw`^${hue}\s+${percentage}\s+${percentage}(?:\s*\/\s*${alpha})?$`,
  'u',
)
const hslLegacyBody = new RegExp(
  String.raw`^${hue}\s*,\s*${percentage}\s*,\s*${percentage}(?:\s*,\s*${alpha})?$`,
  'u',
)
const shadowLength = /^-?(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$/u

function semanticColor(value: string): boolean {
  if (value.startsWith('#')) return [4, 5, 7, 9].includes(value.length)
  const match = /^(oklch|rgb|rgba|hsl|hsla)\((.*)\)$/u.exec(value)
  if (!match) return false
  const body = match[2]!.trim()
  if (match[1] === 'oklch') return oklchBody.test(body)
  if (match[1] === 'rgb' || match[1] === 'rgba') {
    return rgbModernBody.test(body) || rgbLegacyBody.test(body)
  }
  return hslModernBody.test(body) || hslLegacyBody.test(body)
}

function splitOutsideParentheses(value: string, separator: ',' | ' '): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (character === '(') depth += 1
    if (character === ')') depth -= 1
    const separates = separator === ',' ? character === ',' : /\s/u.test(character ?? '')
    if (depth === 0 && separates) {
      const part = value.slice(start, index).trim()
      if (part) parts.push(part)
      start = index + 1
    }
  }
  const final = value.slice(start).trim()
  if (final) parts.push(final)
  return parts
}

function semanticShadow(value: string): boolean {
  if (value === 'none') return true
  return splitOutsideParentheses(value, ',').every((layer) => {
    const tokens = splitOutsideParentheses(layer, ' ')
    if (tokens[0] === 'inset') tokens.shift()
    if (tokens.length > 0 && semanticColor(tokens.at(-1)!)) tokens.pop()
    if (
      tokens.length < 2 ||
      tokens.length > 4 ||
      !tokens.every((token) => shadowLength.test(token))
    ) {
      return false
    }
    return tokens.length < 3 || !tokens[2]!.startsWith('-')
  })
}

function mode(value: unknown, label: string): ThemeMode {
  const candidate = record(value, label)
  exactKeys(candidate, themeColorTokens, label)
  return Object.fromEntries(
    themeColorTokens.map((token) => {
      const value = text(candidate[token], `${label}.${token}`, colorPattern, 4, 120)
      if (!semanticColor(value)) throw new ThemeDocumentError(`${label}.${token} is invalid.`)
      return [token, value]
    }),
  ) as ThemeMode
}

export function parseThemeDocument(input: unknown): ThemeDocument {
  const candidate = record(migrateThemeDocument(input), 'theme')
  const rootKeys = [
    '$schema',
    'version',
    'name',
    'label',
    'description',
    'appearance',
    'typography',
    'geometry',
    'density',
    'effects',
    'motion',
    ...(candidate.generation === undefined ? [] : ['generation']),
  ]
  exactKeys(candidate, rootKeys, 'theme')
  if (candidate.$schema !== schemaUrl) {
    throw new ThemeDocumentError('theme.$schema is not the Astrale theme schema.')
  }
  if (candidate.version !== THEME_DOCUMENT_VERSION) {
    throw new ThemeDocumentError('theme.version is unsupported.')
  }
  const appearance = record(candidate.appearance, 'theme.appearance')
  exactKeys(appearance, ['light', 'dark'], 'theme.appearance')
  const typography = record(candidate.typography, 'theme.typography')
  exactKeys(typography, ['body', 'heading', 'mono'], 'theme.typography')
  const bodyTypography = record(typography.body, 'theme.typography.body')
  exactKeys(bodyTypography, ['family', 'tracking', 'leading', 'weight'], 'theme.typography.body')
  const headingTypography = record(typography.heading, 'theme.typography.heading')
  exactKeys(
    headingTypography,
    ['family', 'tracking', 'leading', 'weight'],
    'theme.typography.heading',
  )
  const geometry = record(candidate.geometry, 'theme.geometry')
  exactKeys(geometry, ['radius', 'panelRadius'], 'theme.geometry')
  const density = record(candidate.density, 'theme.density')
  exactKeys(density, ['control', 'controlSmall', 'controlLarge'], 'theme.density')
  const effects = record(candidate.effects, 'theme.effects')
  exactKeys(effects, ['controlShadow', 'panelShadow'], 'theme.effects')
  const motion = record(candidate.motion, 'theme.motion')
  exactKeys(motion, ['fast', 'standard'], 'theme.motion')

  return {
    $schema: schemaUrl,
    version: THEME_DOCUMENT_VERSION,
    name: text(candidate.name, 'theme.name', slugPattern, 1, 64),
    label: text(candidate.label, 'theme.label', labelPattern, 1, 80),
    description: text(candidate.description, 'theme.description', descriptionPattern, 0, 240),
    appearance: {
      light: mode(appearance.light, 'theme.appearance.light'),
      dark: mode(appearance.dark, 'theme.appearance.dark'),
    },
    typography: {
      body: {
        family: text(bodyTypography.family, 'theme.typography.body.family', fontPattern),
        tracking: text(
          bodyTypography.tracking,
          'theme.typography.body.tracking',
          trackingPattern,
          1,
          24,
        ),
        leading: text(
          bodyTypography.leading,
          'theme.typography.body.leading',
          leadingPattern,
          1,
          24,
        ),
        weight: fontWeight(bodyTypography.weight, 'theme.typography.body.weight'),
      },
      heading: {
        family: text(headingTypography.family, 'theme.typography.heading.family', fontPattern),
        tracking: text(
          headingTypography.tracking,
          'theme.typography.heading.tracking',
          trackingPattern,
          1,
          24,
        ),
        leading: text(
          headingTypography.leading,
          'theme.typography.heading.leading',
          leadingPattern,
          1,
          24,
        ),
        weight: fontWeight(headingTypography.weight, 'theme.typography.heading.weight'),
      },
      mono: text(typography.mono, 'theme.typography.mono', fontPattern),
    },
    geometry: {
      radius: text(geometry.radius, 'theme.geometry.radius', lengthPattern, 1, 24),
      panelRadius: text(geometry.panelRadius, 'theme.geometry.panelRadius', lengthPattern, 1, 24),
    },
    density: {
      control: text(density.control, 'theme.density.control', lengthPattern, 1, 24),
      controlSmall: text(density.controlSmall, 'theme.density.controlSmall', lengthPattern, 1, 24),
      controlLarge: text(density.controlLarge, 'theme.density.controlLarge', lengthPattern, 1, 24),
    },
    effects: (() => {
      const controlShadow = text(
        effects.controlShadow,
        'theme.effects.controlShadow',
        shadowPattern,
        1,
        240,
      )
      const panelShadow = text(
        effects.panelShadow,
        'theme.effects.panelShadow',
        shadowPattern,
        1,
        240,
      )
      if (!semanticShadow(controlShadow) || !semanticShadow(panelShadow)) {
        throw new ThemeDocumentError('theme.effects contains an invalid shadow.')
      }
      return { controlShadow, panelShadow }
    })(),
    motion: {
      fast: text(motion.fast, 'theme.motion.fast', durationPattern, 1, 24),
      standard: text(motion.standard, 'theme.motion.standard', durationPattern, 1, 24),
    },
    ...(candidate.generation === undefined
      ? {}
      : { generation: generatorMetadata(candidate.generation, 'theme.generation') }),
  }
}

export function parseThemeDocumentText(source: string): ThemeDocument {
  if (new TextEncoder().encode(source).byteLength > THEME_DOCUMENT_MAX_BYTES) {
    throw new ThemeDocumentError('Theme document exceeds 128 KiB.')
  }
  try {
    return parseThemeDocument(JSON.parse(source))
  } catch (error) {
    if (error instanceof ThemeDocumentError) throw error
    throw new ThemeDocumentError('Theme document is not valid JSON.')
  }
}

export function serializeThemeDocument(theme: ThemeDocument): string {
  return JSON.stringify(parseThemeDocument(theme), null, 2) + '\n'
}

function admittedThemeStyleProperties(
  theme: ThemeDocument,
  selectedMode: 'light' | 'dark',
): Readonly<Record<string, string>> {
  const colors = theme.appearance[selectedMode]
  return {
    ...Object.fromEntries(
      themeColorTokens.map((token) => [`--ui-${cssNames[token]}`, colors[token]]),
    ),
    '--ui-radius': theme.geometry.radius,
    '--ui-radius-panel': theme.geometry.panelRadius,
    '--ui-control-height': theme.density.control,
    '--ui-control-height-sm': theme.density.controlSmall,
    '--ui-control-height-lg': theme.density.controlLarge,
    '--ui-font-body': theme.typography.body.family,
    '--ui-font-heading': theme.typography.heading.family,
    '--ui-font-mono': theme.typography.mono,
    '--ui-tracking-body': theme.typography.body.tracking,
    '--ui-tracking-heading': theme.typography.heading.tracking,
    '--ui-leading-body': theme.typography.body.leading,
    '--ui-leading-heading': theme.typography.heading.leading,
    '--ui-weight-body': String(theme.typography.body.weight),
    '--ui-weight-heading': String(theme.typography.heading.weight),
    '--ui-shadow-control': theme.effects.controlShadow,
    '--ui-shadow-panel': theme.effects.panelShadow,
    '--ui-motion-fast': theme.motion.fast,
    '--ui-motion-standard': theme.motion.standard,
  }
}

export function themeStyleProperties(
  input: ThemeDocument,
  selectedMode: 'light' | 'dark',
): Readonly<Record<string, string>> {
  return admittedThemeStyleProperties(parseThemeDocument(input), selectedMode)
}

function variables(theme: ThemeDocument, selectedMode: 'light' | 'dark'): string[] {
  return Object.entries(admittedThemeStyleProperties(theme, selectedMode)).map(([name, value]) =>
    name === '--ui-shadow-panel' && value.includes(',')
      ? `  ${name}:\n    ${value};`
      : `  ${name}: ${value};`,
  )
}

export function renderThemeCss(input: ThemeDocument): string {
  const theme = parseThemeDocument(input)
  const lightSelectors = [
    ':root',
    `[data-ui-preset='${theme.name}']`,
    `[data-ui-theme='${theme.name}']`,
  ]
  const darkSelectors = [
    ':root.dark',
    `[data-ui-preset='${theme.name}'].dark`,
    `[data-ui-theme='${theme.name}'].dark`,
  ]
  return [
    `/* Generated from ${theme.name}.astrale-theme.json. Consumer-owned after installation. */`,
    lightSelectors.join(',\n') + ' {',
    '  color-scheme: light;',
    ...variables(theme, 'light'),
    '}',
    '',
    darkSelectors.join(',\n') + ' {',
    '  color-scheme: dark;',
    ...variables(theme, 'dark'),
    '}',
    '',
  ].join('\n')
}

export function themeCssTarget(theme: Pick<ThemeDocument, 'name'>): string {
  return `components/astrale/theme/${theme.name}.css`
}

export function themeCanonicalAddress(theme: Pick<ThemeDocument, 'name'>): string {
  return `theme/${theme.name}`
}
