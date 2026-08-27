import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const providerRoot = 'tooling/upstream/providers/react-aria/1.20.0/tailwind-color-picker'
const registryRoot = 'registry/components/color-picker'
const registryUrls = [
  'https://react-aria.adobe.com/registry/tailwind-colorpicker.json',
  'https://react-aria.adobe.com/registry/tailwind-colorswatch.json',
  'https://react-aria.adobe.com/registry/tailwind-colorarea.json',
  'https://react-aria.adobe.com/registry/tailwind-colorslider.json',
  'https://react-aria.adobe.com/registry/tailwind-colorfield.json',
  'https://react-aria.adobe.com/registry/tailwind-dialog.json',
  'https://react-aria.adobe.com/registry/tailwind-popover.json',
  'https://react-aria.adobe.com/registry/tailwind-utils.json',
  'https://react-aria.adobe.com/registry/tailwind-colorthumb.json',
  'https://react-aria.adobe.com/registry/tailwind-field.json',
]

const filenames = new Map([
  ['ColorPicker.tsx', 'color-picker.tsx'],
  ['ColorSwatch.tsx', 'color-swatch.tsx'],
  ['ColorArea.tsx', 'color-area.tsx'],
  ['ColorSlider.tsx', 'color-slider.tsx'],
  ['ColorField.tsx', 'color-field.tsx'],
  ['ColorThumb.tsx', 'color-thumb.tsx'],
  ['Dialog.tsx', 'dialog.tsx'],
  ['Popover.tsx', 'popover.tsx'],
  ['Field.tsx', 'field.tsx'],
  ['react-aria-utils.ts', 'react-aria-utils.ts'],
])

const importOwners = new Map([
  ['ColorPicker', 'color-picker.js'],
  ['ColorSwatch', 'color-swatch.js'],
  ['ColorArea', 'color-area.js'],
  ['ColorSlider', 'color-slider.js'],
  ['ColorField', 'color-field.js'],
  ['ColorThumb', 'color-thumb.js'],
  ['Dialog', 'dialog.js'],
  ['Popover', 'popover.js'],
  ['Field', 'field.js'],
])

function digest(source) {
  return createHash('sha256').update(source).digest('hex')
}

function adapt(source) {
  let output = source.replaceAll(
    /@\/(?:registry\/react-aria\/)?ui\/(ColorPicker|ColorSwatch|ColorArea|ColorSlider|ColorField|ColorThumb|Dialog|Popover|Field)/gu,
    (_, owner) => `./${importOwners.get(owner)}`,
  )
  output = output.replaceAll(
    /@\/(?:registry\/react-aria\/)?lib\/react-aria-utils/gu,
    './react-aria-utils.js',
  )
  const withoutReactImport = output.replace("import React from 'react';\n", '')
  if (!withoutReactImport.includes('React.')) output = withoutReactImport
  return output
}

await mkdir(path.join(providerRoot, 'raw'), { recursive: true })
await mkdir(registryRoot, { recursive: true })

const documents = []
for (const url of registryUrls) {
  const response = await fetch(url)
  assert.equal(response.ok, true, `${url}: ${response.status}`)
  const source = await response.text()
  const item = JSON.parse(source)
  documents.push({ url, source, item })
  await writeFile(path.join(providerRoot, 'raw', `${item.name}.json`), `${source.trim()}\n`)
}

const resolved = new Map()
for (const { item } of documents) {
  for (const file of item.files ?? []) {
    const basename = path.posix.basename(file.path)
    const filename = filenames.get(basename)
    if (!filename) continue
    const existing = resolved.get(filename)
    assert.ok(!existing || existing === file.content, `unequal ${filename} collision`)
    resolved.set(filename, file.content)
  }
}
assert.deepEqual([...resolved.keys()].sort(), [...filenames.values()].sort())

for (const [filename, source] of resolved) {
  await writeFile(path.join(providerRoot, filename), source)
  await writeFile(path.join(registryRoot, filename), adapt(source))
}

const fileDigests = Object.fromEntries(
  [...resolved]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([filename, source]) => [filename, `sha256:${digest(source)}`]),
)
const sourceDigest = digest(
  Object.entries(fileDigests)
    .map(([filename, value]) => `${filename}\0${value}`)
    .join('\n'),
)
await writeFile(
  path.join(providerRoot, 'provenance.json'),
  `${JSON.stringify(
    {
      provider: '@react-aria',
      upstreamAddress: '@react-aria/tailwind-colorpicker',
      package: 'react-aria-components',
      packageVersion: '1.20.0',
      resolvedAt: '2026-08-27',
      registryUrls,
      sourceDigest: `sha256:${sourceDigest}`,
      files: fileDigests,
    },
    null,
    2,
  )}\n`,
)

console.log(
  `PASS React Aria color picker (${resolved.size} exact source files, sha256:${sourceDigest})`,
)
