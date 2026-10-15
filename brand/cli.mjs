import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

import {
  brandColors,
  contrastProblem,
  lockups,
  logoSvg,
  tileSvg,
} from '../packages/ui/src/brand/geometry.ts'
import { ICNS_TYPES, icns, ico, png } from './raster.mjs'

const USAGE = `Usage: pnpm brand [options]

Generates one Astrale logo file, or one file per size.

  --lockup      symbol | wordmark | horizontal | stacked | tile   (default: horizontal)
  --color       ${Object.keys(brandColors).join(' | ')}   (default: blue)
  --background  transparent | ${Object.keys(brandColors).join(' | ')}   (default: transparent)
  --format      svg | png | ico | icns   (default: svg; ico and icns need --lockup tile)
  --size        pixel width, or a comma-separated list (png); tile side (tile)
  --padding     space around a lockup, in lockup units (default: its clear space on a background)
  --radius      tile corner radius over its side (default: 0.225)
  --glyph       symbol width over the tile side (default: 0.68)
  --out         output directory (default: the current directory)

Examples:
  pnpm brand --lockup horizontal --color white --background black --format png --size 800,1600
  pnpm brand --lockup tile --color white --background blue --format png --size 512
`

const { values } = parseArgs({
  options: {
    lockup: { type: 'string', default: 'horizontal' },
    color: { type: 'string', default: 'blue' },
    background: { type: 'string', default: 'transparent' },
    format: { type: 'string', default: 'svg' },
    size: { type: 'string' },
    padding: { type: 'string' },
    radius: { type: 'string', default: '0.225' },
    glyph: { type: 'string', default: '0.68' },
    out: { type: 'string', default: '.' },
    help: { type: 'boolean', short: 'h' },
  },
})

function fail(message) {
  process.stderr.write(`${message}\n\n${USAGE}`)
  process.exit(1)
}

if (values.help) {
  process.stdout.write(USAGE)
  process.exit(0)
}

const { lockup, color, background, format } = values
if (lockup !== 'tile' && !(lockup in lockups)) fail(`Unknown lockup: ${lockup}`)
if (!(color in brandColors)) fail(`Unknown color: ${color}`)
if (background !== 'transparent' && !(background in brandColors))
  fail(`Unknown background: ${background}`)
if (!['svg', 'png', 'ico', 'icns'].includes(format)) fail(`Unknown format: ${format}`)
if ((format === 'ico' || format === 'icns') && lockup !== 'tile')
  fail(`${format} needs --lockup tile`)
if (lockup === 'tile' && background === 'transparent') fail('A tile needs a --background color')
const contrast = contrastProblem(color, background)
if (contrast !== null) fail(contrast)

const sizes = values.size?.split(',').map((size) => {
  const value = Number(size)
  if (!Number.isInteger(value) || value <= 0 || value > 8192) fail(`Invalid size: ${size}`)
  return value
})

const tile = (size) =>
  tileSvg({
    size,
    color,
    background,
    radius: Number(values.radius),
    glyph: Number(values.glyph),
  })
const svg =
  lockup === 'tile'
    ? tile(sizes?.[0] ?? 512)
    : logoSvg({
        lockup,
        color,
        background,
        padding: values.padding === undefined ? undefined : Number(values.padding),
      })

// pnpm runs scripts from the repository root; INIT_CWD is where the command was typed.
const directory = path.resolve(process.env.INIT_CWD ?? process.cwd(), values.out)
const name = `astrale-${lockup}-${color}${background === 'transparent' ? '' : `-on-${background}`}`
const outputs = []
if (format === 'svg') outputs.push([`${name}.svg`, Buffer.from(svg)])
if (format === 'png') {
  for (const size of sizes ?? [1024]) outputs.push([`${name}-${size}px.png`, png(svg, size)])
}
if (format === 'ico')
  outputs.push([`${name}.ico`, ico([16, 32, 48].map((size) => png(tile(64), size)))])
if (format === 'icns') {
  const sides = [...new Set(ICNS_TYPES.map(([, side]) => side))]
  outputs.push([`${name}.icns`, icns(new Map(sides.map((side) => [side, png(tile(1024), side)])))])
}

await mkdir(directory, { recursive: true })
for (const [file, bytes] of outputs) {
  await writeFile(path.join(directory, file), bytes)
  process.stdout.write(`${path.join(directory, file)}\n`)
}
