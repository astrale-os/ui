import { clamp, roundTo } from './random.js'

export interface OklchColor {
  readonly l: number
  readonly c: number
  readonly h: number
}

interface OklabColor {
  readonly l: number
  readonly a: number
  readonly b: number
}

export interface SrgbColor {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly alpha?: number
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function oklchToLab(color: OklchColor): OklabColor {
  const angle = (normalizeHue(color.h) * Math.PI) / 180
  return { l: color.l, a: color.c * Math.cos(angle), b: color.c * Math.sin(angle) }
}

function labToLinearSrgb(color: OklabColor): SrgbColor {
  const lRoot = color.l + 0.396_337_777_4 * color.a + 0.215_803_757_3 * color.b
  const mRoot = color.l - 0.105_561_345_8 * color.a - 0.063_854_172_8 * color.b
  const sRoot = color.l - 0.089_484_177_5 * color.a - 1.291_485_548 * color.b
  const l = lRoot ** 3
  const m = mRoot ** 3
  const s = sRoot ** 3
  return {
    r: 4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s,
    g: -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s,
    b: -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s,
  }
}

function linearToSrgb(value: number): number {
  return value <= 0.003_130_8 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

function srgbToLinear(value: number): number {
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function oklchToSrgb(color: OklchColor): SrgbColor {
  const linear = labToLinearSrgb(oklchToLab(color))
  return {
    r: linearToSrgb(linear.r),
    g: linearToSrgb(linear.g),
    b: linearToSrgb(linear.b),
  }
}

export function inSrgbGamut(color: OklchColor): boolean {
  const linear = labToLinearSrgb(oklchToLab(color))
  const epsilon = 0.000_001
  return Object.values(linear).every((channel) => channel >= -epsilon && channel <= 1 + epsilon)
}

export function gamutMap(color: OklchColor): OklchColor {
  const normalized = { l: clamp(color.l), c: Math.max(0, color.c), h: normalizeHue(color.h) }
  if (inSrgbGamut(normalized)) return normalized
  let low = 0
  let high = normalized.c
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const chroma = (low + high) / 2
    if (inSrgbGamut({ ...normalized, c: chroma })) low = chroma
    else high = chroma
  }
  return { ...normalized, c: low }
}

function compact(value: number, precision: number): string {
  return roundTo(value, precision)
    .toFixed(precision)
    .replace(/(?:\.0+|(?<=[0-9])0+)$/u, '')
    .replace(/\.$/u, '')
}

export function formatOklch(color: OklchColor): string {
  const mapped = gamutMap(color)
  const stable = gamutMap({
    l: roundTo(mapped.l, 4),
    c: Math.max(0, mapped.c - 0.001),
    h: roundTo(mapped.h, 2),
  })
  return `oklch(${compact(stable.l, 4)} ${compact(stable.c, 4)} ${compact(stable.h, 2)})`
}

function parsePercentageOrNumber(source: string, scale = 1): number | undefined {
  const trimmed = source.trim()
  const value = Number.parseFloat(trimmed)
  if (!Number.isFinite(value)) return undefined
  return trimmed.endsWith('%') ? (value / 100) * scale : value
}

function parseHue(source: string): number | undefined {
  const value = Number.parseFloat(source)
  if (!Number.isFinite(value)) return undefined
  if (source.endsWith('turn')) return value * 360
  if (source.endsWith('rad')) return (value * 180) / Math.PI
  if (source.endsWith('grad')) return value * 0.9
  return value
}

function hslToSrgb(hue: number, saturation: number, lightness: number): SrgbColor {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const segment = normalizeHue(hue) / 60
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1))
  const [red, green, blue] =
    segment < 1
      ? [chroma, secondary, 0]
      : segment < 2
        ? [secondary, chroma, 0]
        : segment < 3
          ? [0, chroma, secondary]
          : segment < 4
            ? [0, secondary, chroma]
            : segment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary]
  const match = lightness - chroma / 2
  return { r: red + match, g: green + match, b: blue + match }
}

export function parseCssColor(source: string): SrgbColor | undefined {
  const color = source.trim().toLowerCase()
  if (color.startsWith('#')) {
    const raw = color.slice(1)
    if (![3, 4, 6, 8].includes(raw.length)) return undefined
    const expanded = raw.length <= 4 ? [...raw].map((part) => `${part}${part}`).join('') : raw
    if (!/^[0-9a-f]+$/u.test(expanded)) return undefined
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16) / 255,
      g: Number.parseInt(expanded.slice(2, 4), 16) / 255,
      b: Number.parseInt(expanded.slice(4, 6), 16) / 255,
      alpha: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    }
  }
  const functionMatch = /^(?<name>oklch|rgb|rgba|hsl|hsla)\((?<body>.*)\)$/u.exec(color)
  if (!functionMatch?.groups) return undefined
  const [channelSource = '', alphaSource] = functionMatch.groups.body?.split('/') ?? []
  const body = channelSource.trim()
  const parts = body.split(/[\s,]+/u).filter(Boolean)
  const alpha = parsePercentageOrNumber(alphaSource?.trim() ?? parts[3] ?? '1')
  if (functionMatch.groups.name === 'oklch') {
    if (parts.length < 3) return undefined
    const l = parsePercentageOrNumber(parts[0] ?? '')
    const c = parsePercentageOrNumber(parts[1] ?? '', 0.4)
    const h = parseHue(parts[2] ?? '')
    if (l === undefined || c === undefined || h === undefined) return undefined
    return { ...oklchToSrgb({ l, c, h }), alpha }
  }
  if (functionMatch.groups.name === 'rgb' || functionMatch.groups.name === 'rgba') {
    if (parts.length < 3) return undefined
    const channels = parts.slice(0, 3).map((part) => parsePercentageOrNumber(part, 255))
    if (channels.some((value) => value === undefined)) return undefined
    return {
      r: (channels[0] ?? 0) / 255,
      g: (channels[1] ?? 0) / 255,
      b: (channels[2] ?? 0) / 255,
      alpha,
    }
  }
  if (parts.length < 3) return undefined
  const hue = parseHue(parts[0] ?? '')
  const saturation = parsePercentageOrNumber(parts[1] ?? '')
  const lightness = parsePercentageOrNumber(parts[2] ?? '')
  if (hue === undefined || saturation === undefined || lightness === undefined) return undefined
  return { ...hslToSrgb(hue, saturation, lightness), alpha }
}

export function parseCssOklch(source: string): OklchColor | undefined {
  const match = /^oklch\((?<body>.*)\)$/u.exec(source.trim().toLowerCase())
  const parts = match?.groups?.body
    ?.split('/')[0]
    ?.trim()
    .split(/[\s,]+/u)
    .filter(Boolean)
  if (!parts || parts.length < 3) return undefined
  const l = parsePercentageOrNumber(parts[0] ?? '')
  const c = parsePercentageOrNumber(parts[1] ?? '', 0.4)
  const h = parseHue(parts[2] ?? '')
  return l === undefined || c === undefined || h === undefined ? undefined : { l, c, h }
}

export function relativeLuminance(color: SrgbColor): number {
  return (
    0.2126 * srgbToLinear(color.r) + 0.7152 * srgbToLinear(color.g) + 0.0722 * srgbToLinear(color.b)
  )
}

export function contrastRatio(left: SrgbColor, right: SrgbColor): number {
  const lighter = Math.max(relativeLuminance(left), relativeLuminance(right))
  const darker = Math.min(relativeLuminance(left), relativeLuminance(right))
  return (lighter + 0.05) / (darker + 0.05)
}

export function cssContrastRatio(left: string, right: string): number | undefined {
  const leftColor = parseCssColor(left)
  const rightColor = parseCssColor(right)
  return leftColor && rightColor ? contrastRatio(leftColor, rightColor) : undefined
}

export function solveForeground(background: OklchColor, desiredContrast: number): OklchColor {
  const mappedBackground = gamutMap(background)
  const backgroundRgb = oklchToSrgb(mappedBackground)
  const hue = mappedBackground.h
  const chroma = Math.min(0.018, mappedBackground.c * 0.35)
  const targetContrast = desiredContrast + 0.08
  const candidateAt = (l: number) => {
    const color = gamutMap({ l, c: chroma, h: hue })
    return { color, contrast: contrastRatio(oklchToSrgb(color), backgroundRgb) }
  }
  const candidates: { color: OklchColor; contrast: number }[] = []
  for (const direction of ['dark', 'light'] as const) {
    let passing = direction === 'dark' ? 0 : 1
    let failing = mappedBackground.l
    const endpoint = candidateAt(passing)
    if (endpoint.contrast < targetContrast) continue
    for (let attempt = 0; attempt < 18; attempt += 1) {
      const middle = (passing + failing) / 2
      const candidate = candidateAt(middle)
      if (candidate.contrast >= targetContrast) passing = middle
      else failing = middle
    }
    candidates.push(candidateAt(passing))
  }
  if (candidates.length === 0) {
    const black = { l: 0, c: 0, h: hue }
    const white = { l: 1, c: 0, h: hue }
    return contrastRatio(oklchToSrgb(black), backgroundRgb) >=
      contrastRatio(oklchToSrgb(white), backgroundRgb)
      ? black
      : white
  }
  return candidates.reduce((best, candidate) =>
    Math.abs(candidate.color.l - mappedBackground.l) < Math.abs(best.color.l - mappedBackground.l)
      ? candidate
      : best,
  ).color
}

export function solveForegroundForSurfaces(
  backgrounds: readonly OklchColor[],
  desiredContrast: number,
): OklchColor {
  if (backgrounds.length === 0) throw new Error('Foreground solving requires a surface.')
  const mapped = backgrounds.map(gamutMap)
  const backgroundRgb = mapped.map(oklchToSrgb)
  const hue = mapped[0]?.h ?? 0
  const target = desiredContrast + 0.08
  const candidateAt = (l: number) => {
    const color = { l, c: 0, h: hue }
    return {
      color,
      minimumContrast: Math.min(
        ...backgroundRgb.map((background) => contrastRatio(oklchToSrgb(color), background)),
      ),
    }
  }
  const candidates: { color: OklchColor; minimumContrast: number }[] = []
  for (const direction of ['dark', 'light'] as const) {
    let passing = direction === 'dark' ? 0 : 1
    let failing =
      direction === 'dark'
        ? Math.min(...mapped.map((color) => color.l))
        : Math.max(...mapped.map((color) => color.l))
    if (candidateAt(passing).minimumContrast < target) continue
    for (let attempt = 0; attempt < 18; attempt += 1) {
      const middle = (passing + failing) / 2
      if (candidateAt(middle).minimumContrast >= target) passing = middle
      else failing = middle
    }
    candidates.push(candidateAt(passing))
  }
  if (candidates.length === 0) return solveForeground(mapped[0] as OklchColor, desiredContrast)
  const reference = mapped.reduce((sum, color) => sum + color.l, 0) / mapped.length
  return candidates.reduce((best, candidate) =>
    Math.abs(candidate.color.l - reference) < Math.abs(best.color.l - reference) ? candidate : best,
  ).color
}

export function solveVisibleColor(
  background: OklchColor,
  hue: number,
  chroma: number,
  minimumContrast: number,
  preferredLightness: number,
): OklchColor {
  const backgroundRgb = oklchToSrgb(gamutMap(background))
  const candidates = Array.from({ length: 41 }, (_, index) => {
    const l = 0.05 + index * 0.0225
    const color = gamutMap({ l, c: chroma, h: hue })
    return { color, contrast: contrastRatio(oklchToSrgb(color), backgroundRgb) }
  }).filter((candidate) => candidate.contrast >= minimumContrast)
  if (candidates.length === 0) return solveForeground(background, minimumContrast)
  return candidates.reduce((best, candidate) =>
    Math.abs(candidate.color.l - preferredLightness) < Math.abs(best.color.l - preferredLightness)
      ? candidate
      : best,
  ).color
}

function srgbToOklab(color: SrgbColor): OklabColor {
  const red = srgbToLinear(color.r)
  const green = srgbToLinear(color.g)
  const blue = srgbToLinear(color.b)
  const l = 0.412_221_470_8 * red + 0.536_332_536_3 * green + 0.051_445_992_9 * blue
  const m = 0.211_903_498_2 * red + 0.680_699_545_1 * green + 0.107_396_956_6 * blue
  const s = 0.088_302_461_9 * red + 0.281_718_837_6 * green + 0.629_978_700_5 * blue
  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)
  return {
    l: 0.210_454_255_3 * lRoot + 0.793_617_785 * mRoot - 0.004_072_046_8 * sRoot,
    a: 1.977_998_495_1 * lRoot - 2.428_592_205 * mRoot + 0.450_593_709_9 * sRoot,
    b: 0.025_904_037_1 * lRoot + 0.782_771_766_2 * mRoot - 0.808_675_766 * sRoot,
  }
}

export function perceptualDistance(left: string, right: string): number | undefined {
  const leftRgb = parseCssColor(left)
  const rightRgb = parseCssColor(right)
  if (!leftRgb || !rightRgb) return undefined
  const first = srgbToOklab(leftRgb)
  const second = srgbToOklab(rightRgb)
  return Math.hypot(first.l - second.l, first.a - second.a, first.b - second.b)
}

export function perceptualLightness(source: string): number | undefined {
  const color = parseCssColor(source)
  return color ? srgbToOklab(color).l : undefined
}
