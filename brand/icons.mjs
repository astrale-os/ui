import { tileSvg } from '../packages/ui/src/brand/geometry.ts'
import { ICNS_TYPES, icns, ico, png } from './raster.mjs'

/*
 * The icon set published under `@astrale-os/ui/brand/icons/`: one folder per tile, each holding the
 * favicons, touch and PWA icons an app serves itself. Apps copy these files at build time.
 *
 * - `tile-blue/`: the white symbol on the brand blue, the icon of the Astrale apps.
 * - `tile-black/`: the white symbol on black, the icon of the back-office.
 */

/** Favicons and PWA icons: a rounded tile, legible on any tab or home screen. */
const FAVICON = { radius: 0.225, glyph: 0.68 }
/** The iOS touch icon is full bleed: iOS rounds it itself. */
const TOUCH = { radius: 0, glyph: 0.6 }
/** The macOS app icon: an 824px tile on Apple's 1024px grid. */
const MACOS = { radius: 0.225, glyph: 0.6, inset: 100 }

const FAVICON_SIDES = [16, 32, 48, 96, 192, 512]

const tiles = [
  { folder: 'tile-blue', color: 'white', background: 'blue', macos: true },
  { folder: 'tile-black', color: 'white', background: 'black', macos: false },
]

/**
 * Every file of the set, with what it is drawn from (`input`, to detect a stale set without
 * rendering) and how to render it.
 */
export function iconSet() {
  const files = []
  for (const { folder, color, background, macos } of tiles) {
    const favicon = tileSvg({ size: 64, color, background, ...FAVICON })
    files.push({
      path: `${folder}/favicon.svg`,
      input: favicon,
      render: () => Buffer.from(favicon),
    })
    for (const side of FAVICON_SIDES) {
      files.push({
        path: `${folder}/favicon-${side}.png`,
        input: `${favicon}png:${side}`,
        render: () => png(favicon, side),
      })
    }
    files.push({
      path: `${folder}/favicon.ico`,
      input: `${favicon}ico:16,32,48`,
      render: () => ico([16, 32, 48].map((side) => png(favicon, side))),
    })
    const touch = tileSvg({ size: 180, color, background, ...TOUCH })
    files.push({
      path: `${folder}/apple-touch-icon.png`,
      input: `${touch}png:180`,
      render: () => png(touch, 180),
    })
    if (!macos) continue
    const app = tileSvg({ size: 1024, color, background, ...MACOS })
    files.push({
      path: `${folder}/icon.png`,
      input: `${app}png:1024`,
      render: () => png(app, 1024),
    })
    const sides = [...new Set(ICNS_TYPES.map(([, side]) => side))]
    files.push({
      path: `${folder}/icon.icns`,
      input: `${app}icns:${ICNS_TYPES.map(([type, side]) => `${type}=${side}`).join(',')}`,
      render: () => icns(new Map(sides.map((side) => [side, png(app, side)]))),
    })
  }
  return files
}
