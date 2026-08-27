import assert from 'node:assert/strict'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  parseThemeDocumentText,
  renderThemeCss,
  themeFontRegistryDependencies,
  themeCanonicalAddress,
  themeCssTarget,
} from '../tooling/theme-document/index.ts'

const check = process.argv.includes('--check')
const directory = 'registry/themes'
const sources = (await readdir(directory))
  .filter((file) => file.endsWith('.astrale-theme.json'))
  .toSorted()
const items = []

for (const file of sources) {
  const theme = parseThemeDocumentText(await readFile(path.join(directory, file), 'utf8'))
  assert.equal(file, `${theme.name}.astrale-theme.json`)
  const cssFile = `${theme.name}.css`
  const css = renderThemeCss(theme)
  const target = path.join(directory, cssFile)
  if (check) {
    assert.equal(await readFile(target, 'utf8'), css, `${target} is stale`)
  } else {
    await writeFile(target, css, 'utf8')
  }
  items.push({
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: `theme-${theme.name}`,
    type: 'registry:theme',
    title: `Theme · ${theme.label}`,
    description: theme.description,
    dependencies: ['@astrale-os/ui@^0.3.0-beta.0'],
    registryDependencies: themeFontRegistryDependencies(theme),
    files: [
      {
        path: cssFile,
        type: 'registry:file',
        target: themeCssTarget(theme),
      },
    ],
    meta: {
      canonicalAddress: themeCanonicalAddress(theme),
      ownership: 'consumer-source',
      document: file,
    },
  })
}

assert.ok(items.length >= 2, 'theme registry must expose a real family')
const manifest = `${JSON.stringify({ items }, null, 2)}\n`
const manifestPath = path.join(directory, 'registry.json')
if (check) {
  assert.equal(await readFile(manifestPath, 'utf8'), manifest, `${manifestPath} is stale`)
} else {
  await writeFile(manifestPath, manifest, 'utf8')
}
