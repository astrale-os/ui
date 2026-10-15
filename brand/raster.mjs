import { Resvg } from '@resvg/resvg-js'

/** An SVG document rendered to a PNG `width` pixels wide. */
export function png(svg, width) {
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng())
}

function pngSide(image) {
  return image.readUInt32BE(16)
}

/** An ICO file holding PNG images, which every current browser and Windows read. */
export function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((image, index) => {
    const side = pngSide(image)
    const entry = 6 + 16 * index
    header.writeUInt8(side >= 256 ? 0 : side, entry)
    header.writeUInt8(side >= 256 ? 0 : side, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += image.length
  })
  return Buffer.concat([header, ...images])
}

/**
 * The ICNS element types that hold PNG data, by pixel side. Retina types (`@2x`) reuse the image of
 * twice the side, so one render per side covers both.
 */
export const ICNS_TYPES = [
  ['icp4', 16],
  ['ic11', 32],
  ['icp5', 32],
  ['ic12', 64],
  ['ic07', 128],
  ['ic13', 256],
  ['ic08', 256],
  ['ic14', 512],
  ['ic09', 512],
  ['ic10', 1024],
]

/** An ICNS file (the macOS app icon) from PNG images keyed by pixel side. */
export function icns(imagesBySide) {
  const elements = ICNS_TYPES.map(([type, side]) => {
    const image = imagesBySide.get(side)
    if (image === undefined) throw new Error(`ICNS needs a ${side}px image`)
    const header = Buffer.alloc(8)
    header.write(type, 0, 'latin1')
    header.writeUInt32BE(8 + image.length, 4)
    return Buffer.concat([header, image])
  })
  const header = Buffer.alloc(8)
  header.write('icns', 0, 'latin1')
  header.writeUInt32BE(8 + elements.reduce((total, element) => total + element.length, 0), 4)
  return Buffer.concat([header, ...elements])
}
