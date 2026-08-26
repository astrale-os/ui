export const THEME_DOCUMENT_VERSION = 1 as const
export const THEME_DOCUMENT_MAX_BYTES = 131_072

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
] as const

export type ThemeColorToken = (typeof themeColorTokens)[number]
export type ThemeMode = Record<ThemeColorToken, string>

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
    readonly body: string
    readonly heading: string
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
const durationPattern = /^(?:0|[0-9]+(?:\.[0-9]+)?m?s)$/u
const shadowPattern =
  /^(?!.*\/\*)(?!.*\*\/)(?:none|(?:inset\s+)?-?(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))(?:\s|$)[^{};\\]+)$/u
const fontPattern = /^(?!.*\/\*)(?!.*\*\/)[^{};\\\n\r]{1,240}$/u

export const themeDocumentPatternSources = {
  name: slugPattern.source,
  label: labelPattern.source,
  description: descriptionPattern.source,
  color: colorPattern.source,
  font: fontPattern.source,
  length: lengthPattern.source,
  duration: durationPattern.source,
  cssValue: shadowPattern.source,
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
  const candidate = record(input, 'theme')
  exactKeys(
    candidate,
    [
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
    ],
    'theme',
  )
  if (candidate.$schema !== schemaUrl) {
    throw new ThemeDocumentError('theme.$schema is not the Astrale theme schema.')
  }
  if (candidate.version !== THEME_DOCUMENT_VERSION) {
    throw new ThemeDocumentError('theme.version is unsupported.')
  }
  const appearance = record(candidate.appearance, 'theme.appearance')
  exactKeys(appearance, ['light', 'dark'], 'theme.appearance')
  const typography = record(candidate.typography, 'theme.typography')
  exactKeys(typography, ['body', 'heading'], 'theme.typography')
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
      body: text(typography.body, 'theme.typography.body', fontPattern),
      heading: text(typography.heading, 'theme.typography.heading', fontPattern),
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

function variables(theme: ThemeDocument, selectedMode: 'light' | 'dark'): string[] {
  const colors = theme.appearance[selectedMode]
  return [
    ...themeColorTokens.map((token) => `  --ui-${cssNames[token]}: ${colors[token]};`),
    `  --ui-radius: ${theme.geometry.radius};`,
    `  --ui-radius-panel: ${theme.geometry.panelRadius};`,
    `  --ui-control-height: ${theme.density.control};`,
    `  --ui-control-height-sm: ${theme.density.controlSmall};`,
    `  --ui-control-height-lg: ${theme.density.controlLarge};`,
    `  --ui-font-body: ${theme.typography.body};`,
    `  --ui-font-heading: ${theme.typography.heading};`,
    `  --ui-shadow-control: ${theme.effects.controlShadow};`,
    `  --ui-shadow-panel: ${theme.effects.panelShadow};`,
    `  --ui-motion-fast: ${theme.motion.fast};`,
    `  --ui-motion-standard: ${theme.motion.standard};`,
  ]
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
