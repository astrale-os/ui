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
const heatmapProvenance = JSON.parse(
  await readFile(
    'tooling/upstream/providers/heatmap/6cdef1109364760536410d5325ac0d1af451196e/status-heatmap/provenance.json',
    'utf8',
  ),
)
const statusMonitorProvenance = JSON.parse(
  await readFile(
    'tooling/upstream/providers/8starlabs/763f9b6f27d2ded9967d62b099e66768994dd68c/status-monitor/provenance.json',
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

test('the status heatmap differs only by owned imports and formatting', async () => {
  assert.equal(heatmapProvenance.adaptation, 'imports-only')
  assert.equal(
    digest(
      await readFile(
        'tooling/upstream/providers/heatmap/6cdef1109364760536410d5325ac0d1af451196e/status-heatmap/LICENSE',
        'utf8',
      ),
    ),
    heatmapProvenance.licenseDigest,
  )
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-status-heatmap-fidelity-'))
  try {
    for (const [filename, file] of Object.entries(heatmapProvenance.files)) {
      const source = await readFile(file.source, 'utf8')
      assert.equal(digest(source), file.sourceDigest)
      const implementation = (await readFile(file.implementation, 'utf8')).replaceAll(
        "'@astrale-os/ui/class-name'",
        "'@/lib/utils'",
      )
      await mkdir(path.join(temporary, 'source'), { recursive: true })
      await mkdir(path.join(temporary, 'implementation'), { recursive: true })
      await writeFile(path.join(temporary, 'source', filename), source)
      await writeFile(path.join(temporary, 'implementation', filename), implementation)
    }
    const formatted = spawnSync('pnpm', ['exec', 'oxfmt', '--write', temporary], {
      encoding: 'utf8',
    })
    assert.equal(formatted.status, 0, formatted.stderr)
    for (const filename of Object.keys(heatmapProvenance.files)) {
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

test('the 8StarLabs status monitor has only the declared Astrale adaptation', async () => {
  assert.equal(statusMonitorProvenance.adaptation, 'astrale-revision')
  const providerRoot =
    'tooling/upstream/providers/8starlabs/763f9b6f27d2ded9967d62b099e66768994dd68c/status-monitor'
  assert.equal(
    digest(await readFile(`${providerRoot}/LICENSE.md`, 'utf8')),
    statusMonitorProvenance.licenseDigest,
  )
  assert.equal(
    digest(await readFile(`${providerRoot}/registry-item.json`, 'utf8')),
    statusMonitorProvenance.registryItemDigest,
  )
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-status-monitor-fidelity-'))
  try {
    for (const [filename, file] of Object.entries(statusMonitorProvenance.files)) {
      const source = await readFile(file.source, 'utf8')
      assert.equal(digest(source), file.sourceDigest)
      const implementationSource = await readFile(file.implementation, 'utf8')
      const replaceDeclared = (value, from, to, label) => {
        assert.equal(value.split(from).length - 1, 1, `${label} adaptation is not exact`)
        return value.replace(from, to)
      }
      const adaptedTimestamp = `function formatTimestamp(timestamp: AppStatusData['timestamp'], unit: 'days' | 'hours') {
  if (!timestamp) return undefined

  if (timestamp instanceof Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      ...(unit === 'hours' ? { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' } : {}),
    }).format(timestamp)
  }

  return timestamp
}`
      const upstreamTimestamp = `function formatTimestamp(timestamp: AppStatusData['timestamp']) {
  if (!timestamp) return undefined

  if (timestamp instanceof Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(timestamp)
  }

  return timestamp
}`
      const adaptedUptime = `  const uptimeLabel = useMemo(() => {
    const validStatuses = visibleStatuses.filter((status) => status.status !== 'empty')
    if (validStatuses.length === 0) return 'N/A'

    const normalCount = validStatuses.filter((status) => status.status === 'normal').length
    return \`${'${parseFloat(((normalCount / validStatuses.length) * 100).toFixed(2))}'}%\`
  }, [visibleStatuses])
`
      const upstreamUptime = `  const uptimePercentage = useMemo(() => {
    const validStatuses = statuses.filter((s) => s.status !== 'empty')
    if (validStatuses.length === 0) return 100

    const normalCount = validStatuses.filter((s) => s.status === 'normal').length
    return parseFloat(((normalCount / validStatuses.length) * 100).toFixed(2))
  }, [statuses])

`
      let implementation = implementationSource
      implementation = replaceDeclared(
        implementation,
        "'@astrale-os/ui/tooltip'",
        "'@/registry/8starlabs-ui/ui/tooltip'",
        'tooltip import',
      )
      implementation = replaceDeclared(
        implementation,
        "'@astrale-os/ui/class-name'",
        "'@/lib/utils'",
        'class-name import',
      )
      implementation = replaceDeclared(
        implementation,
        adaptedTimestamp,
        upstreamTimestamp,
        'hour timestamp',
      )
      implementation = replaceDeclared(implementation, adaptedUptime, '', 'visible uptime')
      implementation = replaceDeclared(
        implementation,
        '  const paddedStatuses = useMemo(() => {',
        `${upstreamUptime}  const paddedStatuses = useMemo(() => {`,
        'upstream uptime placement',
      )
      implementation = replaceDeclared(
        implementation,
        '{uptimeLabel} uptime',
        '{uptimePercentage}% uptime',
        'uptime label',
      )
      implementation = replaceDeclared(
        implementation,
        'formatTimestamp(item.timestamp, unit)',
        'formatTimestamp(item.timestamp)',
        'timestamp unit',
      )
      implementation = replaceDeclared(
        implementation,
        "import React, { useEffect, useId, useMemo, useRef, useState } from 'react'",
        "import React, { useEffect, useMemo, useRef, useState } from 'react'",
        'stable id import',
      )
      implementation = replaceDeclared(
        implementation,
        '  const statusMonitorId = useId()\n',
        '',
        'stable monitor id',
      )
      implementation = replaceDeclared(
        implementation,
        '  const [pressedStatus, setPressedStatus] = useState<number | null>(null)\n',
        '',
        'press state',
      )
      implementation = replaceDeclared(
        implementation,
        '              const triggerId = `${statusMonitorId}-status-${index}`\n' +
          '              const tooltipId = `${triggerId}-description`\n',
        '',
        'description ids',
      )
      implementation = replaceDeclared(
        implementation,
        `                <Tooltip
                  key={index}
                  open={pressedStatus === index}
                  triggerId={triggerId}
                  onOpenChange={(open) => {
                    setPressedStatus(open ? index : null)
                  }}
                >`,
        '                <Tooltip key={index}>',
        'press-controlled tooltip',
      )
      implementation = replaceDeclared(
        implementation,
        `                      <button
                        id={triggerId}
                        type="button"`,
        '                      <div',
        'button trigger',
      )
      implementation = replaceDeclared(
        implementation,
        "'h-full w-[5px] border-0 p-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'",
        "'h-full w-[5px] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'",
        'button reset',
      )
      implementation = replaceDeclared(
        implementation,
        `                        aria-label={label}
                        aria-describedby={tooltipId}
                        onClick={() => {
                          setPressedStatus((current) => (current === index ? null : index))
                        }}`,
        `                        tabIndex={0}
                        aria-label={label}`,
        'operable trigger semantics',
      )
      implementation = replaceDeclared(
        implementation,
        '                  <TooltipContent\n                    id={tooltipId}',
        '                  <TooltipContent',
        'tooltip description id',
      )
      await mkdir(path.join(temporary, 'source'), { recursive: true })
      await mkdir(path.join(temporary, 'implementation'), { recursive: true })
      await writeFile(path.join(temporary, 'source', filename), source)
      await writeFile(path.join(temporary, 'implementation', filename), implementation)
    }
    const formatted = spawnSync('pnpm', ['exec', 'oxfmt', '--write', temporary], {
      encoding: 'utf8',
    })
    assert.equal(formatted.status, 0, formatted.stderr)
    for (const filename of Object.keys(statusMonitorProvenance.files)) {
      assert.equal(
        await readFile(path.join(temporary, 'implementation', filename), 'utf8'),
        await readFile(path.join(temporary, 'source', filename), 'utf8'),
        `${filename} contains an undeclared upstream change`,
      )
    }
  } finally {
    await rm(temporary, { recursive: true })
  }
})
