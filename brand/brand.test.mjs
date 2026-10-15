import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { brandColors, logoSvg, tileSvg } from '../packages/ui/src/brand/geometry.ts'
import { checkIcons } from './build.mjs'
import { ICNS_TYPES, icns, ico, png } from './raster.mjs'

/** An `oklch(L C H)` color as `#RRGGBB`, through OKLab and linear sRGB. */
function oklchHex(lightness, chroma, hue) {
  const a = chroma * Math.cos((hue * Math.PI) / 180)
  const b = chroma * Math.sin((hue * Math.PI) / 180)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const channel = (value) => {
    const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, encoded)) * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${linear.map(channel).join('')}`.toUpperCase()
}

test('the brand blue is the light primary of the astrale preset', async () => {
  const preset = await readFile('packages/ui/src/theme/presets/astrale.css', 'utf8')
  const light = preset.slice(0, preset.indexOf(':root.dark'))
  const [, lightness, chroma, hue] = /--ui-primary: oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/u.exec(
    light,
  )
  assert.equal(oklchHex(Number(lightness), Number(chroma), Number(hue)), brandColors.blue)
})

test('the committed icon set is drawn from the current geometry and colors', async () => {
  assert.deepEqual(await checkIcons(), [])
})

test('a logo never vanishes into its background', () => {
  assert.throws(
    () => logoSvg({ lockup: 'symbol', color: 'blue', background: 'black' }),
    /contrast/u,
  )
  assert.throws(
    () => logoSvg({ lockup: 'symbol', color: 'black', background: 'blue' }),
    /contrast/u,
  )
  assert.throws(() => logoSvg({ lockup: 'symbol', color: 'white', background: 'white' }))
  assert.throws(() =>
    tileSvg({ size: 64, color: 'blue', background: 'blue', radius: 0, glyph: 0.6 }),
  )
  assert.match(
    logoSvg({ lockup: 'horizontal', color: 'blue' }),
    /^<svg [^>]*><path fill="#003B82"/u,
  )
  assert.match(
    logoSvg({ lockup: 'symbol', color: 'white', background: 'black' }),
    /<rect width="140.28" height="140.28" fill="#000000"\/>/u,
  )
})

test('ICO and ICNS files hold the PNG images they declare', () => {
  const svg = tileSvg({ size: 64, color: 'white', background: 'blue', radius: 0.2, glyph: 0.6 })
  const images = [16, 32].map((side) => png(svg, side))
  const icon = ico(images)
  assert.equal(icon.readUInt16LE(2), 1)
  assert.equal(icon.readUInt16LE(4), 2)
  assert.equal(icon.readUInt8(6), 16)
  assert.equal(icon.readUInt32LE(6 + 12), 6 + 16 * 2)

  const sides = [...new Set(ICNS_TYPES.map(([, side]) => side))]
  const apple = icns(new Map(sides.map((side) => [side, png(svg, side)])))
  assert.equal(apple.toString('latin1', 0, 4), 'icns')
  assert.equal(apple.readUInt32BE(4), apple.length)
  const types = []
  for (let offset = 8; offset < apple.length; offset += apple.readUInt32BE(offset + 4)) {
    const type = apple.toString('latin1', offset, offset + 4)
    types.push(type)
    // Each element is a whole PNG of the side its type declares (its IHDR width).
    const side = ICNS_TYPES.find(([candidate]) => candidate === type)[1]
    assert.equal(apple.readUInt32BE(offset + 8 + 16), side)
  }
  assert.deepEqual(
    types,
    ICNS_TYPES.map(([type]) => type),
  )
})
