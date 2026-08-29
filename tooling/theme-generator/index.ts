import {
  THEME_DOCUMENT_VERSION,
  THEME_FONT_CATALOG_VERSION,
  THEME_GENERATOR_ENGINE_VERSION,
  THEME_GENERATOR_VERSION,
  generatorBranches,
  parseThemeDocument,
  themeColorTokens,
  type GeneratorBranch,
  type GeneratorLineage,
  type GeneratorMetadata,
  type PaletteRelation,
  type ThemeDNA,
  type ThemeDocument,
  type ThemeMode,
} from '../theme-document/index.js'
import {
  cssContrastRatio,
  formatOklch,
  gamutMap,
  parseCssColor,
  parseCssOklch,
  perceptualDistance,
  perceptualLightness,
  solveForeground,
  solveForegroundForSurfaces,
  solveVisibleColor,
  type OklchColor,
} from './color.js'
import { fontByFamily, fontsForRole, type GeneratorFont } from './font-catalog.js'
import { SeededRandom, assertGeneratorSeed, clamp, deriveSeed, lerp, roundTo } from './random.js'

export type ThemeGenerationRequest =
  | {
      readonly kind: 'new-direction'
      readonly theme: ThemeDocument
      readonly seed: string
      readonly locks: readonly GeneratorBranch[]
    }
  | {
      readonly kind: 'variation'
      readonly theme: ThemeDocument & { readonly generation: GeneratorMetadata }
      readonly seed: string
      readonly locks: readonly GeneratorBranch[]
    }

export type ThemeGenerationResult =
  | { readonly kind: 'generated'; readonly theme: ThemeDocument; readonly attempts: number }
  | { readonly kind: 'fallback'; readonly theme: ThemeDocument; readonly attempts: 12 }
  | {
      readonly kind: 'failure'
      readonly code:
        | 'variation-unavailable'
        | 'all-branches-locked'
        | 'locked-branch-invalid'
        | 'generation-failed'
      readonly message: string
    }

export interface GeneratedThemeAdmission {
  readonly ok: boolean
  readonly reasons: readonly string[]
}

const maximumAttempts = 12
const seedKeys = generatorBranches
const relations: readonly PaletteRelation[] = ['tonal', 'analogous', 'complementary', 'split']

type DerivedBranches = Pick<
  ThemeDocument,
  'appearance' | 'typography' | 'geometry' | 'density' | 'effects' | 'motion'
>

const verifiedProvenance = new WeakMap<ThemeDocument, string>()

function provenanceSnapshot(theme: ThemeDocument): string {
  return JSON.stringify({
    generation: theme.generation,
    appearance: theme.appearance,
    typography: theme.typography,
    geometry: theme.geometry,
    density: theme.density,
    effects: theme.effects,
    motion: theme.motion,
  })
}

function rememberVerifiedProvenance(theme: ThemeDocument): void {
  if (theme.generation) verifiedProvenance.set(theme, provenanceSnapshot(theme))
}

function normalizedBranches(branches: readonly GeneratorBranch[]): readonly GeneratorBranch[] {
  const unique = [...new Set(branches)]
  if (unique.some((branch) => !generatorBranches.includes(branch))) {
    throw new Error('Unknown theme generator branch lock.')
  }
  return unique.sort()
}

function branchSeeds(seed: string, attempt: number): Record<GeneratorBranch, string> {
  return Object.fromEntries(
    seedKeys.map((branch) => [branch, deriveSeed(seed, `${branch}:${attempt}`)]),
  ) as Record<GeneratorBranch, string>
}

export function sampleThemeDNA(seed: string): ThemeDNA {
  const palette = new SeededRandom(deriveSeed(seed, 'dna:palette'))
  const typography = new SeededRandom(deriveSeed(seed, 'dna:typography'))
  const geometry = new SeededRandom(deriveSeed(seed, 'dna:geometry'))
  return {
    palette: {
      hue: roundTo(palette.uniform(0, 360), 6),
      relation: palette.choose(relations),
      colorfulness: roundTo(palette.beta(2, 3), 6),
      contrast: roundTo(palette.beta(3.5, 2), 6),
      tint: roundTo(palette.beta(2, 5), 6),
      warmth: roundTo(palette.uniform(-1, 1), 6),
    },
    typography: {
      contrast: roundTo(typography.beta(2.2, 2.2), 6),
      compactness: roundTo(typography.beta(2.5, 2.5), 6),
    },
    geometry: {
      density: roundTo(geometry.beta(2.5, 2.5), 6),
      roundness: roundTo(geometry.beta(2, 2.5), 6),
      elevation: roundTo(geometry.beta(1.7, 3.5), 6),
    },
  }
}

function perturb(value: number, rng: SeededRandom, minimum = 0, maximum = 1): number {
  return roundTo(clamp(value + rng.normal(0, 0.08), minimum, maximum), 6)
}

function perturbDNA(previous: ThemeDNA, seed: string): ThemeDNA {
  const palette = new SeededRandom(deriveSeed(seed, 'variation:palette'))
  const typography = new SeededRandom(deriveSeed(seed, 'variation:typography'))
  const geometry = new SeededRandom(deriveSeed(seed, 'variation:geometry'))
  return {
    palette: {
      hue: roundTo((previous.palette.hue + palette.normal(0, 18) + 360) % 360, 6),
      relation:
        palette.next() < 0.85
          ? previous.palette.relation
          : palette.choose(relations.filter((relation) => relation !== previous.palette.relation)),
      colorfulness: perturb(previous.palette.colorfulness, palette),
      contrast: perturb(previous.palette.contrast, palette),
      tint: perturb(previous.palette.tint, palette),
      warmth: perturb(previous.palette.warmth, palette, -1, 1),
    },
    typography: {
      contrast: perturb(previous.typography.contrast, typography),
      compactness: perturb(previous.typography.compactness, typography),
    },
    geometry: {
      density: perturb(previous.geometry.density, geometry),
      roundness: perturb(previous.geometry.roundness, geometry),
      elevation: perturb(previous.geometry.elevation, geometry),
    },
  }
}

function rotateHue(hue: number, amount: number): number {
  return (hue + amount + 360) % 360
}

function paletteHues(dna: ThemeDNA['palette'], rng: SeededRandom) {
  const anchor = dna.hue
  const accent = (() => {
    if (dna.relation === 'tonal') return rotateHue(anchor, rng.normal(0, 10))
    if (dna.relation === 'analogous') {
      return rotateHue(anchor, (rng.next() < 0.5 ? -1 : 1) * rng.uniform(25, 55))
    }
    if (dna.relation === 'complementary') return rotateHue(anchor, rng.normal(180, 12))
    return rotateHue(anchor, (rng.next() < 0.5 ? -150 : 150) + rng.normal(0, 10))
  })()
  return { anchor, accent }
}

function color(color: OklchColor): string {
  return formatOklch(gamutMap(color))
}

function deriveMode(
  mode: 'light' | 'dark',
  dna: ThemeDNA['palette'],
  seed: string,
  hues: { readonly anchor: number; readonly accent: number },
): ThemeMode {
  const rng = new SeededRandom(deriveSeed(seed, mode))
  const surfaceHue = rotateHue(hues.anchor, dna.warmth * -28)
  const light = mode === 'light'
  const background: OklchColor = light
    ? {
        l: lerp(0.965, 0.992, rng.beta(3.2, 1.8)),
        c: dna.tint * rng.uniform(0.002, 0.024),
        h: surfaceHue,
      }
    : {
        l: lerp(0.105, 0.18, rng.beta(2.2, 2.4)),
        c: dna.tint * rng.uniform(0.004, 0.032),
        h: surfaceHue,
      }
  const card = { ...background, l: clamp(background.l + (light ? 0.009 : 0.038)) }
  const popover = { ...background, l: clamp(background.l + (light ? 0.015 : 0.052)) }
  const secondary = { ...background, l: clamp(background.l + (light ? -0.045 : 0.085)) }
  const muted = { ...background, l: clamp(background.l + (light ? -0.032 : 0.066)) }
  const accent = {
    l: clamp(
      background.l +
        (light ? -lerp(0.06, 0.13, dna.colorfulness) : lerp(0.12, 0.23, dna.colorfulness)),
    ),
    c: lerp(0.018, 0.095, dna.colorfulness),
    h: hues.accent,
  }
  const desiredTextContrast = lerp(5.1, 8.5, dna.contrast)
  const primary = solveVisibleColor(
    background,
    hues.anchor,
    lerp(0.075, 0.225, dna.colorfulness),
    3,
    light ? lerp(0.58, 0.38, dna.contrast) : lerp(0.64, 0.79, dna.contrast),
  )
  const destructive = solveVisibleColor(background, 28, 0.19, 3, light ? 0.48 : 0.68)
  const border = solveVisibleColor(
    background,
    surfaceHue,
    Math.min(0.035, background.c + 0.008),
    1.35,
    light ? 0.84 : 0.32,
  )
  const input = solveVisibleColor(
    background,
    surfaceHue,
    Math.min(0.04, background.c + 0.01),
    3,
    light ? 0.7 : 0.47,
  )
  const ring = solveVisibleColor(
    background,
    hues.anchor,
    lerp(0.06, 0.16, dna.colorfulness),
    3,
    light ? 0.58 : 0.7,
  )
  const chartHues = [
    hues.anchor,
    hues.accent,
    rotateHue(hues.anchor, 72),
    rotateHue(hues.accent, 104),
    rotateHue(hues.anchor, 218),
  ]
  const charts = chartHues.map((hue, index) =>
    solveVisibleColor(
      background,
      hue,
      lerp(0.1, 0.21, dna.colorfulness),
      3,
      (light ? 0.52 : 0.7) + (index % 2 === 0 ? -0.015 : 0.025),
    ),
  )
  const sidebar = { ...card, l: clamp(card.l + (light ? -0.003 : 0.006)) }
  const neutralSurfaces = [background, card, popover, secondary, muted, accent, sidebar]
  const foreground = solveForegroundForSurfaces(neutralSurfaces, desiredTextContrast)
  const mutedForeground = solveForegroundForSurfaces(neutralSurfaces, 4.8)
  const sidebarForeground = solveForeground(sidebar, desiredTextContrast)
  const sidebarBorder = solveVisibleColor(
    sidebar,
    surfaceHue,
    Math.min(0.035, background.c + 0.008),
    1.35,
    light ? 0.84 : 0.34,
  )
  const sidebarRing = solveVisibleColor(
    sidebar,
    hues.anchor,
    lerp(0.06, 0.16, dna.colorfulness),
    3,
    light ? 0.58 : 0.7,
  )
  return {
    background: color(background),
    foreground: color(foreground),
    card: color(card),
    cardForeground: color(solveForeground(card, desiredTextContrast)),
    popover: color(popover),
    popoverForeground: color(solveForeground(popover, desiredTextContrast)),
    primary: color(primary),
    primaryForeground: color(solveForeground(primary, 4.5)),
    secondary: color(secondary),
    secondaryForeground: color(solveForeground(secondary, 4.5)),
    muted: color(muted),
    mutedForeground: color(mutedForeground),
    accent: color(accent),
    accentForeground: color(solveForeground(accent, 4.5)),
    destructive: color(destructive),
    destructiveForeground: color(solveForeground(destructive, 4.5)),
    border: color(border),
    input: color(input),
    ring: color(ring),
    chart1: color(charts[0] as OklchColor),
    chart2: color(charts[1] as OklchColor),
    chart3: color(charts[2] as OklchColor),
    chart4: color(charts[3] as OklchColor),
    chart5: color(charts[4] as OklchColor),
    sidebar: color(sidebar),
    sidebarForeground: color(sidebarForeground),
    sidebarPrimary: color(primary),
    sidebarPrimaryForeground: color(solveForeground(primary, 4.5)),
    sidebarAccent: color(accent),
    sidebarAccentForeground: color(solveForeground(accent, 4.5)),
    sidebarBorder: color(sidebarBorder),
    sidebarRing: color(sidebarRing),
  }
}

function nearestWeight(font: GeneratorFont, requested: number): number {
  return font.weights.reduce((best, weight) =>
    Math.abs(weight - requested) < Math.abs(best - requested) ? weight : best,
  )
}

function deriveTypography(dna: ThemeDNA['typography'], seed: string): ThemeDocument['typography'] {
  const rng = new SeededRandom(seed)
  const body = rng.choose(fontsForRole('body'))
  const headings = fontsForRole('heading')
  const heading = rng.weighted(
    headings.map((font) => {
      const kindContrast = font.kind === body.kind ? 1 - dna.contrast * 0.65 : 0.45 + dna.contrast
      const personalityContrast = font.personality === body.personality ? 0.7 : 1
      const displayBoost = font.display ? 0.8 + dna.contrast * 0.7 : 1
      return {
        value: font,
        weight: Math.max(0.08, kindContrast * personalityContrast * displayBoost),
      }
    }),
  )
  const terminal = rng.choose(fontsForRole('terminal'))
  const bodyLeading = clamp(
    lerp(1.68, 1.42, dna.compactness) + (body.kind === 'serif' ? 0.04 : 0),
    1,
    2,
  )
  const headingLeading = clamp(lerp(1.3, 1.08, dna.compactness), 1, 2)
  const bodyTracking = clamp(lerp(0.01, -0.005, dna.compactness), -0.04, 0.03)
  const headingTracking = clamp(
    lerp(0.005, -0.018, dna.compactness) - (heading.display ? 0.01 : 0),
    -0.04,
    0.03,
  )
  const formatTracking = (value: number) =>
    Math.abs(value) < 0.0005 ? '0' : `${roundTo(value, 3)}em`
  return {
    body: {
      family: body.family,
      tracking: formatTracking(bodyTracking),
      leading: `${roundTo(bodyLeading, 2)}`,
      weight: nearestWeight(body, dna.compactness > 0.78 ? 500 : 400),
    },
    heading: {
      family: heading.family,
      tracking: formatTracking(headingTracking),
      leading: `${roundTo(headingLeading, 2)}`,
      weight: nearestWeight(heading, lerp(600, 700, dna.contrast)),
    },
    mono: terminal.family,
  }
}

function rem(value: number): string {
  return `${roundTo(value, 2)}rem`
}

function deriveGeometry(
  dna: ThemeDNA['geometry'],
  seed: string,
): Omit<DerivedBranches, 'appearance' | 'typography'> {
  const rng = new SeededRandom(seed)
  const control = lerp(2.75, 2, dna.density)
  const radius = lerp(0.12, 1.1, dna.roundness)
  const panelRadius = radius * lerp(1.08, 1.42, dna.roundness)
  const shadowAlpha = lerp(0, 0.16, dna.elevation)
  const lift = lerp(1, 4, dna.elevation)
  const blur = lerp(2, 18, dna.elevation)
  const panelLift = lerp(8, 24, dna.elevation)
  const panelBlur = lerp(24, 64, dna.elevation)
  const shadowHue = roundTo(rng.uniform(230, 280), 1)
  return {
    geometry: { radius: rem(radius), panelRadius: rem(panelRadius) },
    density: {
      control: rem(control),
      controlSmall: rem(Math.max(1.75, control - 0.25)),
      controlLarge: rem(Math.min(3, control + 0.25)),
    },
    effects: {
      controlShadow:
        dna.elevation < 0.08
          ? 'none'
          : `0 ${roundTo(lift, 1)}px ${roundTo(blur, 1)}px oklch(0.19 0.016 ${shadowHue} / ${roundTo(shadowAlpha, 3)})`,
      panelShadow:
        dna.elevation < 0.05
          ? 'none'
          : `0 ${roundTo(panelLift, 1)}px ${roundTo(panelBlur, 1)}px oklch(0.19 0.016 ${shadowHue} / ${roundTo(shadowAlpha * 0.85, 3)})`,
    },
    motion: {
      fast: `${Math.round(lerp(105, 145, 1 - dna.density))}ms`,
      standard: `${Math.round(lerp(165, 225, 1 - dna.density))}ms`,
    },
  }
}

function deriveBranches(dna: ThemeDNA, seeds: Record<GeneratorBranch, string>): DerivedBranches {
  const hues = paletteHues(
    dna.palette,
    new SeededRandom(deriveSeed(seeds.palette, 'semantic-hues')),
  )
  return {
    appearance: {
      light: deriveMode('light', dna.palette, seeds.palette, hues),
      dark: deriveMode('dark', dna.palette, seeds.palette, hues),
    },
    typography: deriveTypography(dna.typography, seeds.typography),
    ...deriveGeometry(dna.geometry, seeds.geometry),
  }
}

function variationSeeds(
  request: Extract<ThemeGenerationRequest, { readonly kind: 'variation' }>,
  dna: ThemeDNA,
  locks: readonly GeneratorBranch[],
): Record<GeneratorBranch, string> {
  const seeds = branchSeeds(request.seed, 1)
  if (locks.includes('typography')) return seeds
  const continuity = new SeededRandom(deriveSeed(request.seed, 'variation:font-continuity'))
  if (continuity.next() >= 0.85) return seeds
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidateSeed = deriveSeed(request.seed, `typography:variation:${attempt}`)
    const candidate = deriveTypography(dna.typography, candidateSeed)
    if (
      candidate.body.family === request.theme.typography.body.family &&
      candidate.heading.family === request.theme.typography.heading.family &&
      candidate.mono === request.theme.typography.mono
    ) {
      return { ...seeds, typography: candidateSeed }
    }
  }
  return seeds
}

function preserveLockedBranches(
  generated: DerivedBranches,
  current: ThemeDocument,
  locks: readonly GeneratorBranch[],
): DerivedBranches {
  return {
    appearance: locks.includes('palette') ? current.appearance : generated.appearance,
    typography: locks.includes('typography') ? current.typography : generated.typography,
    geometry: locks.includes('geometry') ? current.geometry : generated.geometry,
    density: locks.includes('geometry') ? current.density : generated.density,
    effects: locks.includes('geometry') ? current.effects : generated.effects,
    motion: locks.includes('geometry') ? current.motion : generated.motion,
  }
}

function branchOutput(theme: ThemeDocument | DerivedBranches, branch: GeneratorBranch): unknown {
  if (branch === 'palette') return theme.appearance
  if (branch === 'typography') return theme.typography
  return {
    geometry: theme.geometry,
    density: theme.density,
    effects: theme.effects,
    motion: theme.motion,
  }
}

export function validateGeneratorProvenance(theme: ThemeDocument): GeneratedThemeAdmission {
  if (!theme.generation) return { ok: true, reasons: [] }
  const snapshot = provenanceSnapshot(theme)
  if (verifiedProvenance.get(theme) === snapshot) return { ok: true, reasons: [] }
  const replayed = deriveBranches(theme.generation.dna, { ...theme.generation.derivationSeeds })
  const reasons = generatorBranches.flatMap((branch) => {
    if (theme.generation?.editedBranches.includes(branch)) return []
    return JSON.stringify(branchOutput(theme, branch)) ===
      JSON.stringify(branchOutput(replayed, branch))
      ? []
      : [`${branch} tokens do not match their pristine generator provenance.`]
  })
  if (reasons.length === 0) verifiedProvenance.set(theme, snapshot)
  return { ok: reasons.length === 0, reasons }
}

function metadataFor(
  request: ThemeGenerationRequest,
  dna: ThemeDNA,
  seeds: Record<GeneratorBranch, string>,
  locks: readonly GeneratorBranch[],
  lineage: GeneratorLineage,
): GeneratorMetadata {
  const prior = request.theme.generation
  const derivationSeeds = Object.fromEntries(
    generatorBranches.map((branch) => [
      branch,
      locks.includes(branch) && prior ? prior.derivationSeeds[branch] : seeds[branch],
    ]),
  ) as Record<GeneratorBranch, string>
  const finalDna: ThemeDNA = prior
    ? {
        palette: locks.includes('palette') ? prior.dna.palette : dna.palette,
        typography: locks.includes('typography') ? prior.dna.typography : dna.typography,
        geometry: locks.includes('geometry') ? prior.dna.geometry : dna.geometry,
      }
    : dna
  const priorEdited = prior?.editedBranches ?? []
  const editedBranches = generatorBranches.filter(
    (branch) => locks.includes(branch) && (!prior || priorEdited.includes(branch)),
  )
  return {
    kind: 'astrale.theme-generation',
    version: THEME_GENERATOR_VERSION,
    engineVersion: THEME_GENERATOR_ENGINE_VERSION,
    fontCatalogVersion: THEME_FONT_CATALOG_VERSION,
    seed: request.seed,
    derivationSeeds,
    dna: finalDna,
    locks,
    editedBranches,
    lineage,
  }
}

function assembleTheme(
  request: ThemeGenerationRequest,
  dna: ThemeDNA,
  seeds: Record<GeneratorBranch, string>,
  locks: readonly GeneratorBranch[],
  lineage: GeneratorLineage,
): ThemeDocument {
  const generated = preserveLockedBranches(deriveBranches(dna, seeds), request.theme, locks)
  return parseThemeDocument({
    ...request.theme,
    version: THEME_DOCUMENT_VERSION,
    ...generated,
    generation: metadataFor(request, dna, seeds, locks, lineage),
  })
}

const textPairs = [
  ['background', 'foreground'],
  ['card', 'cardForeground'],
  ['popover', 'popoverForeground'],
  ['primary', 'primaryForeground'],
  ['secondary', 'secondaryForeground'],
  ['muted', 'mutedForeground'],
  ['accent', 'accentForeground'],
  ['destructive', 'destructiveForeground'],
  ['sidebar', 'sidebarForeground'],
  ['sidebarPrimary', 'sidebarPrimaryForeground'],
  ['sidebarAccent', 'sidebarAccentForeground'],
] as const satisfies readonly (readonly [keyof ThemeMode, keyof ThemeMode])[]

export function admitGeneratedTheme(
  theme: ThemeDocument,
  options: { readonly validateProvenance?: boolean } = {},
): GeneratedThemeAdmission {
  const reasons: string[] = []
  let admitted: ThemeDocument
  try {
    admitted = parseThemeDocument(theme)
  } catch (error) {
    return { ok: false, reasons: [error instanceof Error ? error.message : String(error)] }
  }
  for (const modeName of ['light', 'dark'] as const) {
    const mode = admitted.appearance[modeName]
    for (const token of themeColorTokens) {
      const parsed = parseCssColor(mode[token])
      if (
        !parsed ||
        [parsed.r, parsed.g, parsed.b].some((channel) => channel < -0.000_01 || channel > 1.000_01)
      ) {
        reasons.push(`${modeName}.${token} is outside sRGB.`)
      }
      if (parsed && (parsed.alpha ?? 1) < 0.999_999) {
        reasons.push(`${modeName}.${token} must be opaque for generated-theme admission.`)
      }
    }
    for (const [surface, foreground] of textPairs) {
      const ratio = cssContrastRatio(mode[surface], mode[foreground])
      if (ratio === undefined || ratio < 4.5) {
        reasons.push(`${modeName}.${foreground} must contrast with ${surface} by 4.5:1.`)
      }
    }
    for (const [token, surface] of [
      ['input', 'background'],
      ['ring', 'background'],
      ['sidebarRing', 'sidebar'],
    ] as const) {
      const ratio = cssContrastRatio(mode[token], mode[surface])
      if (ratio === undefined || ratio < 3) {
        reasons.push(`${modeName}.${token} must contrast with ${surface} by 3:1.`)
      }
    }
    const charts = [mode.chart1, mode.chart2, mode.chart3, mode.chart4, mode.chart5]
    for (const [index, chart] of charts.entries()) {
      const ratio = cssContrastRatio(chart, mode.background)
      if (ratio === undefined || ratio < 3)
        reasons.push(`${modeName}.chart${index + 1} must contrast by 3:1.`)
      for (let sibling = 0; sibling < index; sibling += 1) {
        const distance = perceptualDistance(chart, charts[sibling] ?? '')
        if (distance === undefined || distance < 0.035) {
          reasons.push(`${modeName}.chart${index + 1} is not distinct from chart${sibling + 1}.`)
        }
      }
    }
    const surfaceLightness = Object.fromEntries(
      ['background', 'card', 'popover', 'secondary', 'muted', 'sidebar'].map((token) => [
        token,
        perceptualLightness(mode[token as keyof ThemeMode]),
      ]),
    ) as Record<'background' | 'card' | 'popover' | 'secondary' | 'muted' | 'sidebar', number>
    const surfaceOrderingValid =
      Object.values(surfaceLightness).every((value) => value !== undefined) &&
      (modeName === 'light'
        ? surfaceLightness.card >= surfaceLightness.background &&
          surfaceLightness.popover >= surfaceLightness.card &&
          surfaceLightness.secondary < surfaceLightness.background &&
          surfaceLightness.muted < surfaceLightness.background &&
          surfaceLightness.sidebar >= surfaceLightness.background
        : surfaceLightness.card > surfaceLightness.background &&
          surfaceLightness.popover > surfaceLightness.background &&
          surfaceLightness.secondary > surfaceLightness.background &&
          surfaceLightness.muted > surfaceLightness.background &&
          surfaceLightness.sidebar > surfaceLightness.background)
    if (!surfaceOrderingValid) reasons.push(`${modeName} surface ordering is invalid.`)
  }
  for (const [roleName, role] of [
    ['body', admitted.typography.body],
    ['heading', admitted.typography.heading],
  ] as const) {
    const font = fontByFamily(role.family)
    if (!font) reasons.push(`Typography family ${role.family} is not in font catalog v1.`)
    else if (!font.roles.some((role) => role === roleName))
      reasons.push(`${font.label} is not eligible for the ${roleName} role.`)
    else if (!font.weights.includes(role.weight))
      reasons.push(`${font.label} does not provide weight ${role.weight}.`)
  }
  const terminalFont = fontByFamily(admitted.typography.mono)
  if (!terminalFont) reasons.push('Terminal family is not in font catalog v1.')
  else if (!terminalFont.roles.some((role) => role === 'terminal'))
    reasons.push(`${terminalFont.label} is not eligible for the terminal role.`)

  const hueDistance = (left: number, right: number) => {
    const distance = Math.abs(left - right) % 360
    return Math.min(distance, 360 - distance)
  }
  for (const token of ['primary', 'accent', 'destructive'] as const) {
    const light = parseCssOklch(admitted.appearance.light[token])
    const dark = parseCssOklch(admitted.appearance.dark[token])
    if (!light || !dark || hueDistance(light.h, dark.h) > 2) {
      reasons.push(`${token} must preserve its semantic hue across light and dark modes.`)
    }
    if (
      !light ||
      !dark ||
      light.c < (token === 'accent' ? 0.01 : 0.03) ||
      dark.c < (token === 'accent' ? 0.01 : 0.03) ||
      light.c > 0.3 ||
      dark.c > 0.3
    ) {
      reasons.push(`${token} chroma is outside its generated semantic range.`)
    }
  }
  const radius = Number.parseFloat(admitted.geometry.radius)
  const panelRadius = Number.parseFloat(admitted.geometry.panelRadius)
  const control = Number.parseFloat(admitted.density.control)
  const controlSmall = Number.parseFloat(admitted.density.controlSmall)
  const controlLarge = Number.parseFloat(admitted.density.controlLarge)
  const fastMotion = Number.parseFloat(admitted.motion.fast)
  const standardMotion = Number.parseFloat(admitted.motion.standard)
  const validShadow = (value: string, maximumLift: number, maximumBlur: number) => {
    if (value === 'none') return true
    const match = /^0 (?<lift>[0-9]+(?:\.[0-9]+)?)px (?<blur>[0-9]+(?:\.[0-9]+)?)px oklch\(/u.exec(
      value,
    )
    return (
      Boolean(match?.groups) &&
      Number(match?.groups?.lift) <= maximumLift &&
      Number(match?.groups?.blur) <= maximumBlur
    )
  }
  if (
    radius < 0 ||
    radius > 1.5 ||
    panelRadius < radius ||
    panelRadius > 2 ||
    controlSmall < 1.5 ||
    controlSmall > control ||
    control < 1.75 ||
    control > 3 ||
    controlLarge < control ||
    controlLarge > 3.5 ||
    fastMotion < 0 ||
    fastMotion > 300 ||
    standardMotion < fastMotion ||
    standardMotion > 500 ||
    !validShadow(admitted.effects.controlShadow, 8, 32) ||
    !validShadow(admitted.effects.panelShadow, 40, 80)
  ) {
    reasons.push('Generated geometry is outside its admitted range.')
  }
  if (options.validateProvenance !== false) {
    reasons.push(...validateGeneratorProvenance(admitted).reasons)
  }
  return { ok: reasons.length === 0, reasons }
}

function lockedBranchAdmission(theme: ThemeDocument, locks: readonly GeneratorBranch[]): string[] {
  if (locks.length === 0) return []
  const admission = admitGeneratedTheme(theme)
  return admission.reasons.filter((reason) =>
    locks.some((branch) => {
      if (branch === 'palette')
        return (
          !reason.startsWith('Typography') &&
          !reason.includes('geometry') &&
          !reason.includes('family') &&
          !reason.includes('weight')
        )
      if (branch === 'typography')
        return (
          reason.startsWith('Typography') || reason.includes('family') || reason.includes('weight')
        )
      return reason.includes('geometry')
    }),
  )
}

function branchForAdmissionReason(reason: string): GeneratorBranch {
  if (
    reason.startsWith('Typography') ||
    reason.startsWith('Terminal') ||
    reason.includes('family') ||
    reason.includes('weight') ||
    reason.includes('role')
  ) {
    return 'typography'
  }
  if (
    reason.includes('geometry') ||
    reason.includes('density') ||
    reason.includes('shadow') ||
    reason.includes('motion')
  ) {
    return 'geometry'
  }
  return 'palette'
}

function safeFallbackDNA(): ThemeDNA {
  return {
    palette: {
      hue: 251,
      relation: 'analogous',
      colorfulness: 0.48,
      contrast: 0.72,
      tint: 0.26,
      warmth: 0.12,
    },
    typography: { contrast: 0.68, compactness: 0.52 },
    geometry: { density: 0.5, roundness: 0.58, elevation: 0.32 },
  }
}

/** @internal Qualification seam for deterministic retry and fallback proofs. */
export function generateThemeWithAdmission(
  request: ThemeGenerationRequest,
  admissionPolicy: (theme: ThemeDocument) => GeneratedThemeAdmission,
): ThemeGenerationResult {
  try {
    assertGeneratorSeed(request.seed)
    const locks = normalizedBranches(request.locks)
    if (locks.length === generatorBranches.length) {
      return {
        kind: 'failure',
        code: 'all-branches-locked',
        message: 'Unlock at least one branch to generate a theme.',
      }
    }
    if (request.kind === 'variation' && !request.theme.generation) {
      return {
        kind: 'failure',
        code: 'variation-unavailable',
        message: 'Variation requires generator provenance.',
      }
    }
    if (request.kind === 'variation' && request.theme.generation.lineage.kind === 'fallback') {
      return {
        kind: 'failure',
        code: 'variation-unavailable',
        message: 'A safe fallback cannot be used as a Variation parent.',
      }
    }
    const provenance = validateGeneratorProvenance(request.theme)
    if (!provenance.ok) {
      return {
        kind: 'failure',
        code: 'generation-failed',
        message: provenance.reasons[0] ?? 'Theme generator provenance is inconsistent.',
      }
    }
    const invalidLocked = lockedBranchAdmission(request.theme, locks)
    if (invalidLocked.length > 0) {
      return {
        kind: 'failure',
        code: 'locked-branch-invalid',
        message: invalidLocked[0] ?? 'A locked branch is invalid.',
      }
    }
    const intentSeed = deriveSeed(request.seed, 'intent')
    const dna =
      request.kind === 'variation'
        ? perturbDNA(request.theme.generation.dna, intentSeed)
        : sampleThemeDNA(intentSeed)
    let lastReasons: readonly string[] = []
    let seeds =
      request.kind === 'variation'
        ? variationSeeds(request, dna, locks)
        : branchSeeds(request.seed, 1)
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      const lineage: GeneratorLineage =
        request.kind === 'variation'
          ? { kind: 'variation', parentSeed: request.theme.generation.seed }
          : { kind: 'new-direction' }
      const candidate = assembleTheme(request, dna, seeds, locks, lineage)
      const admission = admissionPolicy(candidate)
      if (admission.ok) {
        rememberVerifiedProvenance(candidate)
        return { kind: 'generated', theme: candidate, attempts: attempt }
      }
      lastReasons = admission.reasons
      const failedBranches = new Set(admission.reasons.map(branchForAdmissionReason))
      seeds = Object.fromEntries(
        generatorBranches.map((branch) => [
          branch,
          !locks.includes(branch) && failedBranches.has(branch)
            ? deriveSeed(request.seed, `${branch}:${attempt + 1}`)
            : seeds[branch],
        ]),
      ) as Record<GeneratorBranch, string>
    }
    const fallback = assembleTheme(
      request,
      safeFallbackDNA(),
      branchSeeds('0b5e7aa1e6d24f8db247857e8d4bb79f', 1),
      locks,
      { kind: 'fallback', failedAttempts: 12 },
    )
    const fallbackAdmission = admissionPolicy(fallback)
    if (fallbackAdmission.ok) {
      rememberVerifiedProvenance(fallback)
      return { kind: 'fallback', theme: fallback, attempts: 12 }
    }
    const reason = fallbackAdmission.reasons[0] ?? lastReasons[0]
    return {
      kind: 'failure',
      code: 'generation-failed',
      message: reason
        ? `Theme generation could not produce an admitted result: ${reason}`
        : 'Theme generation could not produce an admitted result.',
    }
  } catch (error) {
    return {
      kind: 'failure',
      code: 'generation-failed',
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

export function generateTheme(request: ThemeGenerationRequest): ThemeGenerationResult {
  return generateThemeWithAdmission(request, (theme) =>
    admitGeneratedTheme(theme, { validateProvenance: false }),
  )
}

export function replayPristineTheme(
  theme: ThemeDocument & { readonly generation: GeneratorMetadata },
): ThemeDocument {
  if (theme.generation.editedBranches.length > 0)
    throw new Error('Edited generator branches cannot be replayed as pristine.')
  const generated = deriveBranches(theme.generation.dna, { ...theme.generation.derivationSeeds })
  return parseThemeDocument({ ...theme, ...generated })
}

export { deriveSeed, seedFromBytes } from './random.js'
export { generatorFontCatalog, generatorFontCatalogVersion } from './font-catalog.js'
