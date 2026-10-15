/*
 * The Astrale logo: its geometry, its brand colors, and the SVG documents generated from them. The
 * React components here, the icon set under `icons/`, the brand generator (`brand/` at the
 * repository root) and brand.astrale.ai all draw from this file.
 *
 * The logo and the Astrale name are trademarks of Astrale. Unlike the rest of this package, they are
 * not licensed under the MIT License.
 *
 * The file imports nothing, so the brand generator can run it directly under Node.
 */

/** The rounded nut, in a 100-unit design square centred on (50, 50). */
export const SYMBOL_PATH =
  'M68.72 10.18A150 150 0 0 0 93.84 53.7A44 44 0 0 1 75.13 86.12A150 150 0 0 0 24.87 86.12A44 44 0 0 1 6.16 53.7A150 150 0 0 0 31.28 10.18A44 44 0 0 1 68.72 10.18ZM28 50A22 22 0 1 0 72 50A22 22 0 1 0 28 50Z'

/** "Astrale" outlined in Manrope Bold, baseline at y = 0, cap height 72. */
export const WORDMARK_PATH =
  'M2 0 24.7 -72H42.35L65.05 0H52.65L32.05 -64.6H34.75L14.4 0ZM14.65 -15.6V-26.85H52.45V-15.6ZM93.9 1.5Q83.9 1.5 77.65 -3Q71.4 -7.5 70.05 -15.65L82.35 -17.55Q83.3 -13.55 86.55 -11.25Q89.8 -8.95 94.75 -8.95Q99.1 -8.95 101.48 -10.67Q103.85 -12.4 103.85 -15.4Q103.85 -17.25 102.98 -18.37Q102.1 -19.5 99.15 -20.55Q96.2 -21.6 90.1 -23.2Q83.3 -25 79.3 -27.08Q75.3 -29.15 73.55 -32Q71.8 -34.85 71.8 -38.9Q71.8 -43.95 74.45 -47.7Q77.1 -51.45 81.85 -53.47Q86.6 -55.5 93.05 -55.5Q99.35 -55.5 104.23 -53.55Q109.1 -51.6 112.1 -48Q115.1 -44.4 115.8 -39.55L103.5 -37.35Q103.05 -40.8 100.38 -42.8Q97.7 -44.8 93.25 -45.05Q89 -45.3 86.4 -43.78Q83.8 -42.25 83.8 -39.5Q83.8 -37.95 84.85 -36.85Q85.9 -35.75 89.08 -34.65Q92.25 -33.55 98.55 -31.95Q105 -30.3 108.88 -28.17Q112.75 -26.05 114.48 -23.1Q116.2 -20.15 116.2 -15.95Q116.2 -7.8 110.28 -3.15Q104.35 1.5 93.9 1.5ZM157.85 0Q152.5 1 147.38 0.88Q142.25 0.75 138.2 -1.03Q134.15 -2.8 132.05 -6.65Q130.2 -10.15 130.1 -13.8Q130 -17.45 130 -22.05V-69H142V-22.75Q142 -19.5 142.07 -17.05Q142.15 -14.6 143.1 -13.05Q144.9 -10.05 148.85 -9.7Q152.8 -9.35 157.85 -10.1ZM120.2 -44.55V-54H157.85V-44.55ZM168.5 0V-54H179.15V-40.85L177.85 -42.55Q178.85 -45.25 180.52 -47.47Q182.2 -49.7 184.55 -51.15Q186.55 -52.5 188.98 -53.28Q191.4 -54.05 193.95 -54.23Q196.5 -54.4 198.9 -54V-42.75Q196.5 -43.45 193.38 -43.2Q190.25 -42.95 187.75 -41.45Q185.25 -40.1 183.68 -38Q182.1 -35.9 181.35 -33.22Q180.6 -30.55 180.6 -27.45V0ZM222.5 1.5Q216.65 1.5 212.6 -0.73Q208.55 -2.95 206.48 -6.65Q204.4 -10.35 204.4 -14.8Q204.4 -18.7 205.7 -21.83Q207 -24.95 209.7 -27.22Q212.4 -29.5 216.7 -30.95Q219.95 -32 224.33 -32.85Q228.7 -33.7 233.83 -34.42Q238.95 -35.15 244.55 -36L240.25 -33.55Q240.3 -39.15 237.75 -41.8Q235.2 -44.45 229.15 -44.45Q225.5 -44.45 222.1 -42.75Q218.7 -41.05 217.35 -36.9L206.35 -40.35Q208.35 -47.2 213.98 -51.35Q219.6 -55.5 229.15 -55.5Q236.35 -55.5 241.83 -53.15Q247.3 -50.8 249.95 -45.45Q251.4 -42.6 251.7 -39.62Q252 -36.65 252 -33.15V0H241.45V-11.7L243.2 -9.8Q239.55 -3.95 234.68 -1.23Q229.8 1.5 222.5 1.5ZM224.9 -8.1Q229 -8.1 231.9 -9.55Q234.8 -11 236.53 -13.1Q238.25 -15.2 238.85 -17.05Q239.8 -19.35 239.93 -22.33Q240.05 -25.3 240.05 -27.15L243.75 -26.05Q238.3 -25.2 234.4 -24.55Q230.5 -23.9 227.7 -23.33Q224.9 -22.75 222.75 -22.05Q220.65 -21.3 219.2 -20.3Q217.75 -19.3 216.98 -18Q216.2 -16.7 216.2 -14.95Q216.2 -12.95 217.2 -11.42Q218.2 -9.9 220.13 -9Q222.05 -8.1 224.9 -8.1ZM265 0V-73.5H277.05V0ZM315.6 1.5Q307.4 1.5 301.2 -2.05Q295 -5.6 291.52 -11.9Q288.05 -18.2 288.05 -26.4Q288.05 -35.25 291.45 -41.78Q294.85 -48.3 300.9 -51.9Q306.95 -55.5 314.9 -55.5Q323.3 -55.5 329.18 -51.57Q335.05 -47.65 337.9 -40.5Q340.75 -33.35 340.05 -23.65H328.1V-28.05Q328.05 -36.85 325 -40.9Q321.95 -44.95 315.4 -44.95Q308 -44.95 304.4 -40.37Q300.8 -35.8 300.8 -27Q300.8 -18.8 304.4 -14.3Q308 -9.8 314.9 -9.8Q319.35 -9.8 322.58 -11.77Q325.8 -13.75 327.55 -17.5L339.45 -13.9Q336.35 -6.6 329.88 -2.55Q323.4 1.5 315.6 1.5ZM297 -23.65V-32.75H334.15V-23.65Z'

/**
 * The colors of generated logo files. Interfaces draw the logo in `currentColor` instead, so it
 * takes the text color of its surface. `blue` is the light `--ui-primary` of the astrale preset.
 */
export const brandColors = {
  blue: '#003B82',
  black: '#000000',
  white: '#FFFFFF',
} as const

export type BrandColor = keyof typeof brandColors

interface Shape {
  readonly d: string
  readonly evenOdd: boolean
  readonly transform: string
}

export interface Lockup {
  readonly width: number
  readonly height: number
  readonly shapes: readonly Shape[]
  /** Clear space around the lockup when it is set on a background, in lockup units. */
  readonly clearSpace: number
}

const symbol = (transform: string): Shape => ({ d: SYMBOL_PATH, evenOdd: true, transform })
const wordmark = (transform: string): Shape => ({ d: WORDMARK_PATH, evenOdd: false, transform })

export const lockups = {
  /** The symbol alone, centred in a square. */
  symbol: {
    width: 87.68,
    height: 87.68,
    shapes: [symbol('translate(-6.16 -2.21)')],
    clearSpace: 26.3,
  },
  /** The name alone. */
  wordmark: {
    width: 338.19,
    height: 75,
    shapes: [wordmark('translate(-2 73.5)')],
    clearSpace: 84.55,
  },
  /** The symbol beside the name: the primary lockup. */
  horizontal: {
    width: 346.71,
    height: 80.14,
    shapes: [symbol('translate(-6.16 -5.98)'), wordmark('translate(111.94 64.91) scale(0.690094)')],
    clearSpace: 86.68,
  },
  /** The symbol over the name. */
  stacked: {
    width: 135.51,
    height: 132.63,
    shapes: [symbol('translate(17.76 -5.98)'), wordmark('translate(-0.8 132.03) scale(0.4007)')],
    clearSpace: 33.88,
  },
} as const satisfies Record<string, Lockup>

export type LockupName = keyof typeof lockups

/** The symbol's own bounds inside its design square, to centre it on a tile. */
const SYMBOL_BOUNDS = { x: 6.16, y: 5.98, width: 87.68, height: 80.14 } as const

export interface LogoOptions {
  readonly lockup: LockupName
  /**
   * A brand color for a file, or `currentColor` for an SVG inlined in a page, where the logo takes
   * the text color of its surface as the React components do.
   */
  readonly color: BrandColor | 'currentColor'
  /** A solid surface behind the lockup, or none. Defaults to none. */
  readonly background?: BrandColor | 'transparent'
  /** Space around the lockup, in lockup units. Defaults to its clear space on a background, 0 without. */
  readonly padding?: number
}

/** A lockup as a standalone SVG document, at one CSS pixel per lockup unit. */
export function logoSvg({
  lockup,
  color,
  background = 'transparent',
  padding,
}: LogoOptions): string {
  if (color !== 'currentColor') assertContrast(color, background)
  const { width, height, shapes, clearSpace } = lockups[lockup] as Lockup
  const space = padding ?? (background === 'transparent' ? 0 : clearSpace)
  const outerWidth = width + 2 * space
  const outerHeight = height + 2 * space
  const surface =
    background === 'transparent'
      ? ''
      : `<rect width="${round(outerWidth)}" height="${round(outerHeight)}" fill="${brandColors[background]}"/>`
  const drawing = shapes
    .map(
      (shape) =>
        `<path fill="${color === 'currentColor' ? color : brandColors[color]}"${shape.evenOdd ? ' fill-rule="evenodd"' : ''} transform="translate(${round(space)} ${round(space)}) ${shape.transform}" d="${shape.d}"/>`,
    )
    .join('')
  return svgDocument(outerWidth, outerHeight, surface + drawing)
}

export interface TileOptions {
  /** Side of the square canvas, in pixels. */
  readonly size: number
  readonly color: BrandColor
  readonly background: BrandColor
  /** Corner radius over the tile side; 0 draws a square. */
  readonly radius: number
  /** Symbol width over the tile side. */
  readonly glyph: number
  /** Transparent margin between the canvas edge and the tile, in pixels (the macOS icon grid). */
  readonly inset?: number
}

/** The symbol centred on a solid tile: an app icon or a favicon. */
export function tileSvg({
  size,
  color,
  background,
  radius,
  glyph,
  inset = 0,
}: TileOptions): string {
  assertContrast(color, background)
  const side = size - 2 * inset
  const scale = (side * glyph) / SYMBOL_BOUNDS.width
  const x = inset + (side - SYMBOL_BOUNDS.width * scale) / 2 - SYMBOL_BOUNDS.x * scale
  const y = inset + (side - SYMBOL_BOUNDS.height * scale) / 2 - SYMBOL_BOUNDS.y * scale
  const corner = radius > 0 ? ` rx="${round(side * radius)}"` : ''
  return svgDocument(
    size,
    size,
    `<rect x="${round(inset)}" y="${round(inset)}" width="${round(side)}" height="${round(side)}"${corner} fill="${brandColors[background]}"/>` +
      `<path fill="${brandColors[color]}" fill-rule="evenodd" transform="translate(${round(x)} ${round(y)}) scale(${round(scale, 4)})" d="${SYMBOL_PATH}"/>`,
  )
}

/**
 * Why a logo color cannot sit on a background, or null when it can: a logo never shares its
 * background's color, and blue and black are too close to read on each other (2.3:1).
 */
export function contrastProblem(
  color: BrandColor,
  background: BrandColor | 'transparent',
): string | null {
  if (color === background) return `A ${color} logo would vanish on a ${background} background.`
  const pair = new Set([color, background])
  if (pair.has('blue') && pair.has('black')) {
    return `A ${color} logo lacks contrast on a ${background} background.`
  }
  return null
}

function assertContrast(color: BrandColor, background: BrandColor | 'transparent'): void {
  const problem = contrastProblem(color, background)
  if (problem !== null) throw new Error(problem)
}

function svgDocument(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}">${body}</svg>\n`
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
