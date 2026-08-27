import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const provenance = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', 'utf8'),
)
const catalog = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/catalog.json', 'utf8'),
)
const crosswalk = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/crosswalk.json', 'utf8'),
)
const tailwindProvenance = JSON.parse(
  await readFile('tooling/upstream/providers/tailwindcss/4.3.3/provenance.json', 'utf8'),
)
const reactAriaProvenance = JSON.parse(
  await readFile(
    'tooling/upstream/providers/react-aria/1.20.0/tailwind-color-picker/provenance.json',
    'utf8',
  ),
)
const owners = new Map(
  provenance.components
    .filter((component) => component.disposition === 'owned-runtime')
    .map((component) => [
      component.address.slice('@shadcn/'.length),
      component.implementation.replace(/^packages\/ui\/src\//u, '').replace(/\/index\.tsx$/u, ''),
    ]),
)

function digest(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

function restoreUpstreamImports(content, component, upstream) {
  let restored = content
    .replaceAll("'@astrale-os/ui/class-name'", "'@/lib/utils'")
    .replaceAll("'#astrale-ui/class-name'", "'@/lib/utils'")
    .replaceAll("'./use-mobile'", "'@/hooks/use-mobile'")
    .replaceAll("'#astrale-ui/hook/use-mobile'", "'@/hooks/use-mobile'")
    .replace(/'@astrale-os\/ui\/([^']+)'/gu, "'@/components/ui/$1'")
  for (const [name, owner] of owners) {
    restored = restored.replaceAll(`'#astrale-ui/${owner}'`, `'@/components/ui/${name}'`)
  }
  const reactImport = upstream.match(/^import \* as React from ['"]react['"]\n/u)?.[0]
  if (reactImport && !restored.includes("import * as React from 'react'")) {
    restored = reactImport + restored
  }
  assert.equal(component.adaptation, 'imports-only')
  return restored
}

test('the provider census is the closed union of global and Base Nova scopes', () => {
  assert.equal(catalog.scopes.global, 471)
  assert.equal(catalog.scopes['base-nova'], 216)
  assert.equal(catalog.scopes.union, 543)
  assert.equal(catalog.total, 543)
  assert.equal(catalog.counts['registry:ui'], 63)
  assert.equal(catalog.items.length, catalog.total)
  const addresses = catalog.items.map((item) => item.addCommandArgument)
  assert.equal(new Set(addresses).size, catalog.total)
  assert.deepEqual(
    Object.fromEntries(
      [...Map.groupBy(catalog.items, (item) => item.type)]
        .map(([type, items]) => [type, items.length])
        .toSorted(),
    ),
    catalog.counts,
  )
  assert.equal(crosswalk.items.length, catalog.items.length)
  const crosswalkAddresses = crosswalk.items.map((item) => item.address)
  assert.equal(new Set(crosswalkAddresses).size, catalog.total)
  assert.deepEqual(crosswalkAddresses.toSorted(), addresses.toSorted())
})

test('every emitted Base Nova UI source is owned and form is explicitly fileless', () => {
  const official = catalog.items
    .filter((item) => item.type === 'registry:ui')
    .map((item) => item.addCommandArgument)
  const emitted = provenance.components.map((item) => item.address)
  assert.deepEqual(new Set([...emitted, '@shadcn/form']), new Set(official))
  assert.equal(provenance.aliases[0].address, '@shadcn/form')
  assert.equal(provenance.aliases[0].disposition, 'no-files-for-profile')
})

test('owned bodies differ from upstream only by independently reversed imports and formatting', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-ui-fidelity-'))
  try {
    for (const component of provenance.components) {
      const source = await readFile(component.source, 'utf8')
      assert.equal(digest(source), component.sourceDigest)
      const sourceTarget = path.join(temporary, 'source', `${component.address.slice(8)}.tsx`)
      const restoredTarget = path.join(temporary, 'restored', `${component.address.slice(8)}.tsx`)
      await mkdir(path.dirname(sourceTarget), { recursive: true })
      await mkdir(path.dirname(restoredTarget), { recursive: true })
      await writeFile(sourceTarget, source)
      await writeFile(
        restoredTarget,
        restoreUpstreamImports(await readFile(component.implementation, 'utf8'), component, source),
      )
    }
    for (const hook of provenance.hooks) {
      const source = await readFile(hook.source, 'utf8')
      assert.equal(digest(source), hook.sourceDigest)
      const sourceTarget = path.join(temporary, 'source/hooks/use-mobile.ts')
      const restoredTarget = path.join(temporary, 'restored/hooks/use-mobile.ts')
      await mkdir(path.dirname(sourceTarget), { recursive: true })
      await mkdir(path.dirname(restoredTarget), { recursive: true })
      await writeFile(sourceTarget, source)
      await writeFile(restoredTarget, await readFile(hook.implementation, 'utf8'))
    }
    const formatted = spawnSync('pnpm', ['exec', 'oxfmt', '--write', temporary], {
      encoding: 'utf8',
    })
    assert.equal(formatted.status, 0, formatted.stderr)
    for (const component of provenance.components) {
      const name = `${component.address.slice(8)}.tsx`
      assert.equal(
        await readFile(path.join(temporary, 'restored', name), 'utf8'),
        await readFile(path.join(temporary, 'source', name), 'utf8'),
        `${component.implementation} contains a non-import upstream change`,
      )
    }
    assert.equal(
      await readFile(path.join(temporary, 'restored/hooks/use-mobile.ts'), 'utf8'),
      await readFile(path.join(temporary, 'source/hooks/use-mobile.ts'), 'utf8'),
      'use-mobile contains a non-formatting upstream change',
    )
  } finally {
    await rm(temporary, { recursive: true })
  }
})

test('physical snapshots and runtime owners are closed to the proven inventory', async () => {
  const snapshots = (
    await readdir('tooling/upstream/providers/shadcn/4.18.0/base-nova/components')
  ).toSorted()
  assert.deepEqual(
    snapshots,
    provenance.components.map((component) => path.basename(component.source)).toSorted(),
  )
  const runtimeImplementations = new Set(
    provenance.components
      .filter((component) => component.disposition === 'owned-runtime')
      .map((component) => component.implementation),
  )
  const sourceFiles = []
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) await walk(target)
      else if (target.endsWith('/index.tsx')) sourceFiles.push(target)
    }
  }
  await walk('packages/ui/src')
  assert.deepEqual(
    sourceFiles.filter((file) => file !== 'packages/ui/src/icon/index.tsx').toSorted(),
    [...runtimeImplementations].toSorted(),
  )
})

test('the upstream Tailwind support layer is vendored verbatim', async () => {
  for (const style of [...provenance.styles, ...tailwindProvenance.styles]) {
    const source = await readFile(style.source, 'utf8')
    const implementation = await readFile(style.implementation, 'utf8')
    assert.equal(digest(source), style.sourceDigest)
    assert.equal(implementation, source)
  }
})

test('the React Aria color picker differs only by owned imports and formatting', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-color-picker-fidelity-'))
  const importOwners = new Map([
    ['color-picker.js', 'ColorPicker'],
    ['color-swatch.js', 'ColorSwatch'],
    ['color-area.js', 'ColorArea'],
    ['color-slider.js', 'ColorSlider'],
    ['color-field.js', 'ColorField'],
    ['color-thumb.js', 'ColorThumb'],
    ['dialog.js', 'Dialog'],
    ['popover.js', 'Popover'],
    ['field.js', 'Field'],
  ])
  try {
    for (const [filename, expectedDigest] of Object.entries(reactAriaProvenance.files)) {
      const source = await readFile(
        `tooling/upstream/providers/react-aria/1.20.0/tailwind-color-picker/${filename}`,
        'utf8',
      )
      assert.equal(digest(source), expectedDigest)
      let implementation = await readFile(`registry/components/color-picker/${filename}`, 'utf8')
      for (const [target, owner] of importOwners) {
        implementation = implementation.replaceAll(
          `'./${target}'`,
          `'@/registry/react-aria/ui/${owner}'`,
        )
      }
      implementation = implementation.replaceAll(
        "'./react-aria-utils.js'",
        "'@/registry/react-aria/lib/react-aria-utils'",
      )
      if (
        source.includes("import React from 'react';") &&
        !implementation.includes("from 'react'")
      ) {
        implementation = implementation.replace(
          "'use client'\n",
          "'use client'\nimport React from 'react'\n",
        )
      }
      await mkdir(path.join(temporary, 'source'), { recursive: true })
      await mkdir(path.join(temporary, 'implementation'), { recursive: true })
      await writeFile(path.join(temporary, 'source', filename), source)
      await writeFile(path.join(temporary, 'implementation', filename), implementation)
    }
    const formatted = spawnSync('pnpm', ['exec', 'oxfmt', '--write', temporary], {
      encoding: 'utf8',
    })
    assert.equal(formatted.status, 0, formatted.stderr)
    for (const filename of Object.keys(reactAriaProvenance.files)) {
      assert.equal(
        await readFile(path.join(temporary, 'implementation', filename), 'utf8'),
        await readFile(path.join(temporary, 'source', filename), 'utf8'),
        `${filename} contains a non-import upstream change`,
      )
    }
  } finally {
    await rm(temporary, { recursive: true })
  }
})
