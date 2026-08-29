import { THEME_FONT_CATALOG_VERSION } from '../theme-document/index.js'

export type FontKind = 'sans' | 'serif' | 'mono'
export type FontPersonality = 'humanist' | 'neutral' | 'editorial' | 'book' | 'technical'

export interface GeneratorFont {
  readonly id: string
  readonly label: string
  readonly family: string
  readonly kind: FontKind
  readonly personality: FontPersonality
  readonly display: boolean
  readonly roles: readonly ('body' | 'heading' | 'terminal')[]
  readonly weights: readonly number[]
}

export const generatorFontCatalogVersion = THEME_FONT_CATALOG_VERSION

export const generatorFontCatalog = [
  {
    id: 'avenir-next',
    label: 'Avenir Next',
    family: "'Avenir Next', 'Segoe UI Variable', ui-sans-serif, sans-serif",
    kind: 'sans',
    personality: 'humanist',
    display: false,
    roles: ['body', 'heading'],
    weights: [400, 500, 600, 700],
  },
  {
    id: 'system-ui',
    label: 'System UI',
    family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    kind: 'sans',
    personality: 'neutral',
    display: false,
    roles: ['body', 'heading'],
    weights: [400, 500, 600, 700],
  },
  {
    id: 'iowan-old-style',
    label: 'Iowan Old Style',
    family: "'Iowan Old Style', 'Palatino Linotype', ui-serif, serif",
    kind: 'serif',
    personality: 'editorial',
    display: true,
    roles: ['body', 'heading'],
    weights: [400, 600, 700],
  },
  {
    id: 'charter',
    label: 'Charter',
    family: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
    kind: 'serif',
    personality: 'book',
    display: false,
    roles: ['body', 'heading'],
    weights: [400, 600, 700],
  },
  {
    id: 'sfmono',
    label: 'SFMono Regular',
    family: "'SFMono-Regular', 'Cascadia Code', ui-monospace, monospace",
    kind: 'mono',
    personality: 'technical',
    display: false,
    roles: ['terminal'],
    weights: [400, 500, 600],
  },
] as const satisfies readonly GeneratorFont[]

const fontsByRole: Readonly<Record<'body' | 'heading' | 'terminal', readonly GeneratorFont[]>> = {
  body: generatorFontCatalog.filter((font) => font.roles.some((role) => role === 'body')),
  heading: generatorFontCatalog.filter((font) => font.roles.some((role) => role === 'heading')),
  terminal: generatorFontCatalog.filter((font) => font.roles.some((role) => role === 'terminal')),
}

export function fontByFamily(family: string): GeneratorFont | undefined {
  return generatorFontCatalog.find((font) => font.family === family)
}

export function fontsForRole(role: 'body' | 'heading' | 'terminal'): readonly GeneratorFont[] {
  return fontsByRole[role]
}
