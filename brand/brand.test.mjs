import assert from 'node:assert/strict'
import test from 'node:test'

import { brandColors, logoSvg, tileSvg } from '../packages/ui/src/brand/geometry.ts'
import { checkIcons } from './build.mjs'
import { ICNS_TYPES, icns, ico, png } from './raster.mjs'

test('the committed icon set is drawn from the current geometry and colors', async () => {
  assert.deepEqual(await checkIcons(), [])
})

test('an inlined logo takes the text color of its page', () => {
  const svg = logoSvg({ lockup: 'horizontal', color: 'currentColor' })
  assert.equal(svg.match(/fill="currentColor"/gu)?.length, 2)
  assert.doesNotMatch(svg, /<rect/u)
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

test('a symbol icon has no tile, so the client surface shows through', () => {
  const svg = tileSvg({
    size: 64,
    color: 'white',
    background: 'transparent',
    radius: 0,
    glyph: 0.875,
  })
  assert.doesNotMatch(svg, /<rect/u)
  assert.match(svg, /^<svg [^>]*viewBox="0 0 64 64"[^>]*><path fill="#FFFFFF"/u)
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
