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
const envVariablesProvenance = JSON.parse(
  await readFile(
    'tooling/upstream/providers/chadcn/9f92a7134a2df98b249f455104137780ebf958a0/env-variables/provenance.json',
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

const declaredEnvVariableRegions = [
  [
    'alert dialog import',
    ['import {', '  AlertDialog,'],
    ["import { Badge } from '@astrale-os/ui/badge'"],
  ],
  ['host actions', ['', '  const runAction = async ('], ['', '  return (']],
  [
    'live status region',
    ['', '      <p', '        role="status"'],
    ['', '', '      {showImport && ('],
  ],
  [
    'delete confirmation',
    ['', '      <AlertDialog', '        open={deleteTarget !== null}'],
    ['    </div>', '  )', '}'],
  ],
]

const declaredEnvVariableEdits = [
  [
    'unreferenced card imports',
    ["import { Card, CardContent } from '@astrale-os/ui/card'"],
    ["import { Card, CardContent, CardHeader, CardTitle } from '@astrale-os/ui/card'"],
  ],
  [
    'unreferenced icon imports',
    ['  Clock,', '  ToggleLeft,', '  KeyRound,'],
    ['  Clock,', '  Hash,', '  ToggleLeft,', '  Globe,', '  KeyRound,'],
  ],
  [
    'spinner import',
    [
      "import { Separator } from '@astrale-os/ui/separator'",
      "import { Spinner } from '@astrale-os/ui/spinner'",
    ],
    ["import { Separator } from '@astrale-os/ui/separator'"],
  ],
  [
    'stable field identifiers import',
    ["import { useId, useState } from 'react'"],
    ["import { useState } from 'react'"],
  ],
  ['exported record type', ['export interface EnvVar {'], ['interface EnvVar {']],
  [
    'type badge token mapping',
    [
      "type TypeBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'",
      '',
      'const typeConfig: Record<VarType, { label: string; variant: TypeBadgeVariant }> = {',
      "  url: { label: 'URL', variant: 'outline' },",
      "  secret: { label: 'Secret', variant: 'destructive' },",
      "  boolean: { label: 'Bool', variant: 'secondary' },",
      "  number: { label: 'Num', variant: 'default' },",
      "  string: { label: 'Str', variant: 'ghost' },",
      '}',
    ],
    [
      'const typeConfig: Record<VarType, { label: string; color: string }> = {',
      "  url: { label: 'URL', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' },",
      "  secret: { label: 'Secret', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950' },",
      "  boolean: { label: 'Bool', color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950' },",
      "  number: { label: 'Num', color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' },",
      "  string: { label: 'Str', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950' },",
      '}',
    ],
  ],
  [
    'type badge token rendering',
    [
      '                                    <Badge',
      '                                      variant={typeConfig[envVar.type].variant}',
      '                                      className="text-[10px]"',
      '                                    >',
      '                                      {typeConfig[envVar.type].label}',
      '                                    </Badge>',
    ],
    [
      '                                    <span',
      '                                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${typeConfig[envVar.type].color}`}',
      '                                    >',
      '                                      {typeConfig[envVar.type].label}',
      '                                    </span>',
    ],
  ],
  [
    'host data and action boundary',
    [
      'export interface EnvVariablesProps {',
      '  defaultVariables?: EnvVar[]',
      '  onCreateVariable?(variable: EnvVar): Promise<void> | void',
      '  onUpdateVariable?(variable: EnvVar): Promise<void> | void',
      '  onDeleteVariable?(variable: EnvVar): Promise<void> | void',
      '  onCopyValue?(variable: EnvVar): Promise<void> | void',
      '}',
      '',
      'export function EnvVariables({',
      '  defaultVariables = allVariables,',
      '  onCreateVariable,',
      '  onUpdateVariable,',
      '  onDeleteVariable,',
      '  onCopyValue,',
      '}: EnvVariablesProps = {}) {',
      '  const [variables, setVariables] = useState<EnvVar[]>(defaultVariables)',
      '  const [editingId, setEditingId] = useState<number | null>(null)',
      '  const [deleteTarget, setDeleteTarget] = useState<EnvVar | null>(null)',
      '  const [pendingMessage, setPendingMessage] = useState<string | null>(null)',
      "  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)",
      '  const fieldId = useId()',
    ],
    ['export function EnvVariables() {', '  const [variables] = useState<EnvVar[]>(allVariables)'],
  ],
  [
    'wrapped heading row',
    ['      <div className="flex flex-wrap items-start justify-between gap-2">'],
    ['      <div className="flex items-start justify-between">'],
  ],
  [
    'wrapped toolbar row',
    [
      '      <div className="flex flex-wrap items-center gap-2">',
      '        <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>',
    ],
    [
      '      <div className="flex items-center gap-2">',
      '        <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>',
    ],
  ],
  [
    'add variable form reset',
    [
      '        <Button',
      '          size="sm"',
      '          onClick={() => {',
      '            setEditingId(null)',
      "            setNewKey('')",
      "            setNewValue('')",
      "            setNewEnvs(['development'])",
      '            setNewEncrypted(false)',
      '            setShowAddForm(true)',
      '          }}',
      '        >',
    ],
    ['        <Button size="sm" onClick={() => setShowAddForm(true)}>'],
  ],
  [
    'import field label',
    [
      '            <Label htmlFor={`${fieldId}-import`} className="text-xs">',
      '              Paste your .env file contents below',
      '            </Label>',
      '            <Textarea',
      '              id={`${fieldId}-import`}',
    ],
    [
      '            <Label className="text-xs">Paste your .env file contents below</Label>',
      '            <Textarea',
    ],
  ],
  [
    'update form heading',
    [
      '            <h3 className="mb-3 text-sm font-medium">',
      "              {editingId === null ? 'New Variable' : 'Edit Variable'}",
      '            </h3>',
    ],
    ['            <h3 className="mb-3 text-sm font-medium">New Variable</h3>'],
  ],
  [
    'key field label',
    [
      '                <Label htmlFor={`${fieldId}-key`} className="text-xs">',
      '                  Key',
      '                </Label>',
      '                <Input',
      '                  id={`${fieldId}-key`}',
    ],
    ['                <Label className="text-xs">Key</Label>', '                <Input'],
  ],
  [
    'value field label',
    [
      '                <Label htmlFor={`${fieldId}-value`} className="text-xs">',
      '                  Value',
      '                </Label>',
      '                <Input',
      '                  id={`${fieldId}-value`}',
    ],
    ['                <Label className="text-xs">Value</Label>', '                <Input'],
  ],
  [
    'wrapped form options row',
    ['            <div className="mt-3 flex flex-wrap items-center gap-6">'],
    ['            <div className="mt-3 flex items-center gap-6">'],
  ],
  [
    'form cancel resets the edited variable',
    [
      '              <Button',
      '                variant="ghost"',
      '                size="sm"',
      '                onClick={() => {',
      '                  setEditingId(null)',
      '                  resetForm()',
      '                }}',
      '              >',
      '                <X size={14} className="mr-1" />',
    ],
    [
      '              <Button variant="ghost" size="sm" onClick={resetForm}>',
      '                <X size={14} className="mr-1" />',
    ],
  ],
  [
    'form save action',
    [
      '              <Button',
      '                size="sm"',
      '                disabled={pendingMessage !== null}',
      '                onClick={() => void handleSave()}',
      '              >',
    ],
    ['              <Button size="sm">'],
  ],
  [
    'wrapped tab row',
    ['        <div className="flex flex-wrap items-center justify-between gap-4">'],
    ['        <div className="flex items-center justify-between gap-4">'],
  ],
  [
    'wrapped filter row',
    ['          <div className="flex flex-wrap items-center gap-2">', '            <Select'],
    ['          <div className="flex items-center gap-2">', '            <Select'],
  ],
  [
    'group filter narrowing',
    [
      '            <Select',
      '              value={groupFilter}',
      '              onValueChange={(value) => {',
      '                if (value !== null) setGroupFilter(value)',
      '              }}',
      '            >',
    ],
    ['            <Select value={groupFilter} onValueChange={setGroupFilter}>'],
  ],
  [
    'group filter name',
    ['              <SelectTrigger aria-label="Filter by group" className="w-[140px] text-sm">'],
    ['              <SelectTrigger className="w-[140px] text-sm">'],
  ],
  [
    'search field name',
    [
      '              <Input',
      '                aria-label="Filter variables"',
      '                placeholder="Filter variables..."',
    ],
    ['              <Input', '                placeholder="Filter variables..."'],
  ],
  [
    'bulk field label',
    [
      '                  <Label htmlFor={`${fieldId}-bulk-${env}`} className="text-xs">',
      '                    Raw .env format ({env})',
      '                  </Label>',
      '                  <Textarea',
      '                    id={`${fieldId}-bulk-${env}`}',
    ],
    [
      '                  <Label className="text-xs">Raw .env format ({env})</Label>',
      '                  <Textarea',
    ],
  ],
  [
    'wrapped variable row',
    [
      '                                <div className="flex flex-wrap items-center gap-3">',
      '                                  <div className="sm:min-w-[180px]">',
    ],
    [
      '                                <div className="flex items-center gap-3">',
      '                                  <div className="min-w-[180px]">',
    ],
  ],
  [
    'wrapped value column',
    [
      '                                  <div className="flex flex-1 basis-full items-center gap-1.5 sm:basis-auto">',
    ],
    ['                                  <div className="flex flex-1 items-center gap-1.5">'],
  ],
  [
    'value field name',
    [
      '                                      readOnly',
      '                                      aria-label={`Value of ${envVar.key}`}',
    ],
    ['                                      readOnly'],
  ],
  [
    'reveal control name',
    [
      '                                      size="icon"',
      '                                      aria-label={',
      '                                        revealed[envVar.id]',
      '                                          ? `Hide value of ${envVar.key}`',
      '                                          : `Reveal value of ${envVar.key}`',
      '                                      }',
      '                                      aria-pressed={Boolean(revealed[envVar.id])}',
      '                                      className="shrink-0"',
      '                                      onClick={() => toggleReveal(envVar.id)}',
    ],
    [
      '                                      size="icon"',
      '                                      className="shrink-0"',
      '                                      onClick={() => toggleReveal(envVar.id)}',
    ],
  ],
  [
    'wrapped badge column',
    [
      '                                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">',
    ],
    ['                                  <div className="flex shrink-0 items-center gap-1.5">'],
  ],
  [
    'menu trigger render and name',
    [
      '                                    <DropdownMenuTrigger',
      '                                      render={',
      '                                        <Button',
      '                                          variant="ghost"',
      '                                          size="icon"',
      '                                          aria-label={`Actions for ${envVar.key}`}',
      '                                          className="shrink-0"',
      '                                        >',
      '                                          <MoreVertical size={14} />',
      '                                        </Button>',
      '                                      }',
      '                                    />',
    ],
    [
      '                                    <DropdownMenuTrigger asChild>',
      '                                      <Button variant="ghost" size="icon" className="shrink-0">',
      '                                        <MoreVertical size={14} />',
      '                                      </Button>',
      '                                    </DropdownMenuTrigger>',
    ],
  ],
  [
    'edit action',
    ['                                      <DropdownMenuItem onClick={() => handleEdit(envVar)}>'],
    ['                                      <DropdownMenuItem>'],
  ],
  [
    'copy action',
    [
      '                                      <DropdownMenuItem onClick={() => void handleCopy(envVar)}>',
    ],
    ['                                      <DropdownMenuItem>'],
  ],
  [
    'delete action',
    [
      '                                      <DropdownMenuItem',
      '                                        className="text-destructive"',
      '                                        onClick={() => setDeleteTarget(envVar)}',
      '                                      >',
    ],
    ['                                      <DropdownMenuItem className="text-destructive">'],
  ],
  [
    'wrapped variable footer',
    [
      '                                <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-3 text-[11px] sm:pl-[180px]">',
    ],
    [
      '                                <div className="text-muted-foreground mt-1.5 flex items-center gap-3 pl-[180px] text-[11px]">',
    ],
  ],
]

test('the chadcn environment variables block has only the declared Astrale adaptation', async () => {
  assert.equal(envVariablesProvenance.adaptation, 'astrale-revision')
  const providerRoot =
    'tooling/upstream/providers/chadcn/9f92a7134a2df98b249f455104137780ebf958a0/env-variables'
  assert.equal(
    digest(await readFile(`${providerRoot}/LICENSE-package.json`, 'utf8')),
    envVariablesProvenance.licenseDigest,
  )
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-env-variables-fidelity-'))
  try {
    for (const [filename, file] of Object.entries(envVariablesProvenance.files)) {
      if (!file.implementation) continue
      const source = await readFile(file.source, 'utf8')
      assert.equal(digest(source), file.sourceDigest)
      const replaceDeclared = (value, from, to, label) => {
        assert.equal(value.split(from).length - 1, 1, `${label} adaptation is not exact`)
        return value.replace(from, to)
      }
      const removeDeclaredRegion = (value, start, end, label) => {
        assert.equal(value.split(start).length - 1, 1, `${label} region start is not exact`)
        assert.equal(value.split(end).length - 1, 1, `${label} region end is not exact`)
        return value.slice(0, value.indexOf(start)) + value.slice(value.indexOf(end))
      }
      let implementation = await readFile(file.implementation, 'utf8')
      for (const [label, start, end] of declaredEnvVariableRegions) {
        implementation = removeDeclaredRegion(
          implementation,
          start.join('\n'),
          end.join('\n'),
          label,
        )
      }
      for (const [label, adapted, upstream] of declaredEnvVariableEdits) {
        implementation = replaceDeclared(
          implementation,
          adapted.join('\n'),
          upstream.join('\n'),
          label,
        )
      }
      const routedImports = implementation.split("'@astrale-os/ui/").length - 1
      assert.equal(routedImports, 12, 'routed component imports are not the declared adaptation')
      implementation = implementation.replaceAll("'@astrale-os/ui/", "'@/components/ui/")
      await mkdir(path.join(temporary, 'source'), { recursive: true })
      await mkdir(path.join(temporary, 'implementation'), { recursive: true })
      await writeFile(path.join(temporary, 'source', filename), source)
      await writeFile(path.join(temporary, 'implementation', filename), implementation)
    }
    const formatted = spawnSync('pnpm', ['exec', 'oxfmt', '--write', temporary], {
      encoding: 'utf8',
    })
    assert.equal(formatted.status, 0, formatted.stderr)
    for (const [filename, file] of Object.entries(envVariablesProvenance.files)) {
      if (!file.implementation) continue
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
