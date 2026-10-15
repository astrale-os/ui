import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { iconSet } from './icons.mjs'

/*
 * Writes the icon set to `packages/ui/src/brand/icons/`, with a manifest of what each file is drawn
 * from. `--check` verifies the committed set instead, without rendering: every file is still drawn
 * from the current geometry and colors, and still holds the bytes it was rendered with.
 */

export const ICONS = fileURLToPath(new URL('../packages/ui/src/brand/icons/', import.meta.url))
const MANIFEST = path.join(ICONS, 'manifest.json')

const require = createRequire(import.meta.url)
const renderer = `@resvg/resvg-js@${require('@resvg/resvg-js/package.json').version}`

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function build() {
  await rm(ICONS, { recursive: true, force: true })
  const manifest = { renderer, files: {} }
  for (const file of iconSet()) {
    const bytes = file.render()
    await mkdir(path.dirname(path.join(ICONS, file.path)), { recursive: true })
    await writeFile(path.join(ICONS, file.path), bytes)
    manifest.files[file.path] = { input: sha256(renderer + file.input), output: sha256(bytes) }
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  process.stdout.write(
    `Wrote ${Object.keys(manifest.files).length} icons to ${path.relative(process.cwd(), ICONS)}\n`,
  )
}

export async function checkIcons() {
  const problems = []
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8').catch(() => '{"files":{}}'))
  const expected = iconSet()
  const listed = new Set(Object.keys(manifest.files))
  for (const file of expected) {
    const entry = manifest.files[file.path]
    listed.delete(file.path)
    if (entry === undefined) {
      problems.push(`${file.path} is missing`)
      continue
    }
    if (entry.input !== sha256(renderer + file.input)) problems.push(`${file.path} is stale`)
    const bytes = await readFile(path.join(ICONS, file.path)).catch(() => undefined)
    if (bytes === undefined) problems.push(`${file.path} is missing`)
    else if (sha256(bytes) !== entry.output) problems.push(`${file.path} was edited by hand`)
  }
  for (const extra of listed) problems.push(`${extra} is no longer part of the set`)
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const problems = await checkIcons()
    if (problems.length > 0) {
      process.stderr.write(
        `Brand icons are out of date (run pnpm brand:build):\n- ${problems.join('\n- ')}\n`,
      )
      process.exit(1)
    }
    process.stdout.write('PASS brand icons\n')
  } else {
    await build()
  }
}
