import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'

import {
  brandColors,
  contrastProblem,
  lockups,
  logoSvg,
  tileSvg,
  SYMBOL_PATH,
} from '../packages/ui/src/brand/geometry.ts'
import { ICONS } from './build.mjs'
import { png } from './raster.mjs'

/*
 * Builds brand.astrale.ai into `brand/dist/`: every lockup in every brand color and background, as
 * SVG and PNG at the usual sizes, social profile formats, the app icon set, a zip of all of it, and
 * an index page. Files live under `/v<VERSION>/`: bump VERSION whenever a published file changes, so
 * a link someone already shared keeps showing what it showed.
 */

export const VERSION = 1
const ROOT = fileURLToPath(new URL('./', import.meta.url))
const DIST = path.join(ROOT, 'dist')
const BASE = `v${VERSION}`

const colors = Object.keys(brandColors)
const backgrounds = ['transparent', ...colors]
const widths = {
  symbol: [64, 128, 256, 512, 1024, 2048],
  horizontal: [400, 800, 1600, 3200],
  stacked: [300, 600, 1200, 2400],
  wordmark: [400, 800, 1600, 3200],
}

/** Every published file, as [path under the version folder, bytes]. */
function logoFiles() {
  const files = []
  for (const lockup of Object.keys(lockups)) {
    for (const color of colors) {
      for (const background of backgrounds) {
        if (contrastProblem(color, background) !== null) continue
        const name = `astrale-${lockup}-${color}${background === 'transparent' ? '' : `-on-${background}`}`
        const svg = logoSvg({ lockup, color, background })
        files.push([`${lockup}/${name}.svg`, Buffer.from(svg)])
        for (const width of widths[lockup]) {
          files.push([`${lockup}/${name}-${width}px.png`, png(svg, width)])
        }
      }
    }
  }
  return files
}

/** Social formats: the white logo on the brand blue, sized for each platform. */
function socialFiles() {
  const centered = (width, height, lockup, logoHeight) => {
    const { width: lockupWidth, height: lockupHeight, shapes } = lockups[lockup]
    const scale = logoHeight / lockupHeight
    const x = (width - lockupWidth * scale) / 2
    const y = (height - logoHeight) / 2
    const paths = shapes
      .map(
        (shape) =>
          `<path fill="${brandColors.white}"${shape.evenOdd ? ' fill-rule="evenodd"' : ''} transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)}) ${shape.transform}" d="${shape.d}"/>`,
      )
      .join('')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${brandColors.blue}"/>${paths}</svg>\n`
  }
  const avatar = tileSvg({ size: 512, color: 'white', background: 'blue', radius: 0, glyph: 0.56 })
  return [
    ['social/astrale-avatar-512px.png', png(avatar, 512)],
    ['social/astrale-avatar.svg', Buffer.from(avatar)],
    ['social/astrale-share-1200x630.png', png(centered(1200, 630, 'horizontal', 150), 1200)],
    [
      'social/astrale-linkedin-banner-1584x396.png',
      png(centered(1584, 396, 'horizontal', 110), 1584),
    ],
    ['social/astrale-x-header-1500x500.png', png(centered(1500, 500, 'horizontal', 120), 1500)],
  ]
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** A ZIP archive (deflate, fixed 1980 timestamps so the bytes depend only on the content). */
function zip(entries) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, bytes] of entries) {
    const nameBytes = Buffer.from(name)
    const data = deflateRawSync(bytes, { level: 9 })
    const crc = crc32(bytes)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0x21, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(bytes.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    locals.push(local, nameBytes, data)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0x21, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(bytes.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBytes)
    offset += local.length + nameBytes.length + data.length
  }
  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}

const escape = (value) => value.replace(/[&<>"]/gu, (char) => `&#${char.charCodeAt(0)};`)

function indexPage(files) {
  const group = (folder, title) => {
    const svgs = files.filter(([file]) => file.startsWith(`${folder}/`) && file.endsWith('.svg'))
    const cards = svgs
      .map(([file]) => {
        const stem = file.slice(0, -'.svg'.length)
        // Only this variant's widths: `-black-800px` but not `-black-on-blue-800px`.
        const pngs = files
          .map(([candidate]) => [candidate, /^(.*)-(\d+)px\.png$/u.exec(candidate)])
          .filter(([, match]) => match?.[1] === stem)
          .map(([candidate, match]) => [candidate, Number(match[2])])
          .toSorted(([, left], [, right]) => left - right)
        // A white logo without a background is previewed on a dark checkerboard, or it would not show.
        const surface =
          /-on-(\w+)$/u.exec(stem)?.[1] ??
          (stem.endsWith('-white') ? 'transparent-dark' : 'transparent')
        const links = [`<a href="/${BASE}/${file}">SVG</a>`]
          .concat(
            pngs.map(([candidate, width]) => `<a href="/${BASE}/${candidate}">${width}px</a>`),
          )
          .join(' ')
        return `<figure><div class="swatch" data-surface="${surface}"><img src="/${BASE}/${file}" alt="" loading="lazy"></div><figcaption><code>${escape(path.basename(stem))}</code><span>${links}</span></figcaption></figure>`
      })
      .join('')
    return `<section><h2>${title}</h2><div class="grid">${cards}</div></section>`
  }
  const iconLinks = (folder) =>
    files
      .filter(([file]) => file.startsWith(`icons/${folder}/`))
      .map(([file]) => `<a href="/${BASE}/${file}">${escape(path.basename(file))}</a>`)
      .join(' ')
  const socialLinks = files
    .filter(([file]) => file.startsWith('social/'))
    .map(([file]) => `<a href="/${BASE}/${file}">${escape(path.basename(file))}</a>`)
    .join(' ')
  const mark = `<svg viewBox="0 0 87.68 87.68" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" transform="translate(-6.16 -2.21)" d="${SYMBOL_PATH}"/></svg>`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Astrale brand assets</title>
<meta name="description" content="The Astrale logo, in the brand colors and the usual sizes.">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
:root{color-scheme:light;--ink:#0e141d;--muted:#5b6472;--line:#e3e0d8;--paper:#fcfaf6;--blue:${brandColors.blue}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 system-ui,sans-serif}
header,main,footer{max-width:72rem;margin:0 auto;padding:0 1.25rem}
header{display:flex;align-items:center;gap:.75rem;padding-top:2.5rem}
header svg{width:2rem;height:2rem;color:var(--blue)}
h1{margin:0;font-size:1.5rem}
h2{margin:2.5rem 0 1rem;font-size:1.1rem}
p{max-width:44rem}
a{color:var(--blue)}
.lead a{font-weight:600}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))}
figure{margin:0;border:1px solid var(--line);border-radius:.75rem;overflow:hidden;background:#fff}
.swatch{display:grid;place-items:center;height:9rem;padding:1rem}
.swatch img{max-width:100%;max-height:100%}
.swatch[data-surface=transparent]{background:repeating-conic-gradient(#ecebe7 0 25%,#fff 0 50%) 0 0/16px 16px}
.swatch[data-surface=transparent-dark]{background:repeating-conic-gradient(#1d2430 0 25%,#0e141d 0 50%) 0 0/16px 16px}
figcaption{display:grid;gap:.25rem;padding:.6rem .75rem;border-top:1px solid var(--line);font-size:.8rem}
figcaption span{display:flex;flex-wrap:wrap;gap:.5rem}
ul{padding-left:1.25rem}
footer{padding-block:3rem;color:var(--muted);font-size:.85rem}
code{font-size:.85em}
</style>
</head>
<body>
<header>${mark}<h1>Astrale brand assets</h1></header>
<main>
<p class="lead">The Astrale logo in the brand colors and the usual sizes. <a href="/${BASE}/astrale-logo-kit.zip">Download everything (zip)</a>.</p>
<h2>Usage</h2>
<ul>
<li>Colors: blue <code>${brandColors.blue}</code>, black <code>#000000</code>, white <code>#FFFFFF</code>. Use the blue or black logo on light backgrounds, the white logo on dark ones and on photos.</li>
<li>Leave clear space around the logo of at least half the symbol's height. The smallest sizes are 16px high for the symbol and 80px wide for the horizontal logo.</li>
<li>Do not stretch, recolor, outline or shadow the logo, and do not retype the name: it is outlined from Manrope Bold.</li>
<li>Prefer SVG; PNGs come in the widths below. Links under <code>/${BASE}/</code> never change.</li>
<li>Applications draw the logo with <code>@astrale-os/ui/brand</code> and ship their icons from <code>@astrale-os/ui/brand/icons/</code>.</li>
</ul>
${group('horizontal', 'Horizontal (primary)')}
${group('stacked', 'Stacked')}
${group('symbol', 'Symbol')}
${group('wordmark', 'Name')}
<section><h2>Social profiles</h2><p>${socialLinks}</p></section>
<section><h2>App icons</h2><p><strong>Blue tile</strong> (Astrale apps): ${iconLinks('tile-blue')}</p><p><strong>Black tile</strong> (back-office): ${iconLinks('tile-black')}</p></section>
</main>
<footer>The Astrale logo and name are trademarks of Astrale.</footer>
</body>
</html>
`
}

const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/${BASE}/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox

/
  Cache-Control: public, max-age=300
`

async function build() {
  await rm(DIST, { recursive: true, force: true })
  const files = [...logoFiles(), ...socialFiles()]
  // The app icon set, as the package publishes it.
  const manifest = JSON.parse(await readFile(path.join(ICONS, 'manifest.json'), 'utf8'))
  for (const file of Object.keys(manifest.files)) {
    files.push([`icons/${file}`, await readFile(path.join(ICONS, file))])
  }
  for (const [file, bytes] of files) {
    await mkdir(path.dirname(path.join(DIST, BASE, file)), { recursive: true })
    await writeFile(path.join(DIST, BASE, file), bytes)
  }
  await writeFile(
    path.join(DIST, BASE, 'astrale-logo-kit.zip'),
    zip(files.map(([file, bytes]) => [`astrale-logo-kit/${file}`, bytes])),
  )
  for (const file of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
    await cp(path.join(ICONS, 'tile-blue', file), path.join(DIST, file))
  }
  await writeFile(path.join(DIST, 'index.html'), indexPage(files))
  await writeFile(path.join(DIST, '_headers'), HEADERS)
  await writeFile(
    path.join(DIST, '404.html'),
    '<!doctype html><meta charset="utf-8"><title>Not found</title><p>Not found. The Astrale brand assets are on <a href="/">brand.astrale.ai</a>.</p>\n',
  )
  process.stdout.write(`Built brand.astrale.ai: ${files.length} files under /${BASE}/\n`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build()
