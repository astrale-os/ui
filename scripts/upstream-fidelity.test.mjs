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
const logViewerProvenance = JSON.parse(
  await readFile(
    'tooling/upstream/providers/logpilot/a0ac783c7dc6c579714f960731a2392043185dc6/log-viewer/provenance.json',
    'utf8',
  ),
)
const logViewerSupportProvenance = JSON.parse(
  await readFile(
    'tooling/upstream/providers/rivet/b5cac54a50103c0739b618f519ce32778119c3b4/log-viewer/provenance.json',
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
        '  const [pressedStatus, setPressedStatus] = useState<number | null>(null)\n',
        '',
        'press state',
      )
      implementation = replaceDeclared(
        implementation,
        `                <Tooltip
                  key={index}
                  disableHoverablePopup
                  open={pressedStatus === index}
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
        `                        aria-label={\`${'${label}'}. ${'${item.info ?? config.defaultInfo}'}\`}
                        onClick={() => {
                          setPressedStatus((current) => (current === index ? null : index))
                        }}`,
        `                        tabIndex={0}
                        aria-label={label}`,
        'operable trigger semantics',
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

const declaredLogViewerRegions = {
  'log-viewer.tsx': [
    ['follow tail', ['', '  // Follow tail effect'], ['', '  // Handlers']],
    [
      'stream error and host action feedback',
      ['', '      {/* Stream error */}'],
      ['', '      {/* Main content */}'],
    ],
  ],
}

const declaredLogViewerEdits = {
  'log-utils.ts': [
    [
      'module imports',
      [
        "import { isAfter, subDays, subHours } from 'date-fns'",
        '',
        "import type { LogEntry, LogLevel, ServiceName, TimeRange } from './types.js'",
      ],
      [
        'import { subHours, subDays, isAfter } from "date-fns";',
        'import type { LogEntry, LogLevel, ServiceName, TimeRange } from "./types";',
      ],
    ],
  ],
  'log-entry-row.tsx': [
    [
      'module imports',
      [
        "import { cn } from '@astrale-os/ui/class-name'",
        "import { format } from 'date-fns'",
        "import { ChevronDown, ChevronRight } from 'lucide-react'",
        "import { memo, useCallback } from 'react'",
        '',
        "import type { LogEntry } from './types.js'",
        '',
        "import { LEVEL_COLORS, SERVICE_COLORS } from './types.js'",
      ],
      [
        'import { memo, useCallback } from "react";',
        'import { format } from "date-fns";',
        'import { ChevronRight, ChevronDown } from "lucide-react";',
        'import { cn } from "@/lib/utils";',
        'import { LEVEL_COLORS, SERVICE_COLORS } from "@/lib/types";',
        'import type { LogEntry } from "@/lib/types";',
        'import { JsonTree } from "./json-tree";',
      ],
    ],
    [
      'row expansion state',
      ['        onClick={handleClick}', '        aria-expanded={isExpanded}'],
      ['        onClick={handleClick}'],
    ],
    [
      'json payload detail',
      ['          {/* Stack trace */}'],
      [
        '          {/* JSON payload */}',
        '          {entry.payload && (',
        '            <div>',
        '              <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">',
        '                Payload',
        '              </div>',
        '              <div className="bg-zinc-900/80 rounded p-2 overflow-x-auto">',
        '                <JsonTree data={entry.payload} defaultExpanded />',
        '              </div>',
        '            </div>',
        '          )}',
        '',
        '          {/* Stack trace */}',
      ],
    ],
  ],
  'log-list.tsx': [
    [
      'module imports',
      [
        "import { format, isSameDay } from 'date-fns'",
        "import { useMemo } from 'react'",
        '',
        "import type { LogEntry } from './types.js'",
        '',
        "import { LogEntryRow } from './log-entry-row.js'",
      ],
      [
        'import { useMemo } from "react";',
        'import { format, isSameDay } from "date-fns";',
        'import type { LogEntry } from "@/lib/types";',
        'import { LogEntryRow } from "./log-entry-row";',
      ],
    ],
    [
      'viewport boundary',
      [
        '  onSelect: (entry: LogEntry) => void',
        '  viewportRef?: React.Ref<HTMLDivElement>',
        '  onViewportScroll?: (viewport: HTMLDivElement) => void',
        '}',
      ],
      ['  onSelect: (entry: LogEntry) => void;', '}'],
    ],
    [
      'viewport parameters',
      ['  onSelect,', '  viewportRef,', '  onViewportScroll,', '}: LogListProps) {'],
      ['  onSelect,', '}: LogListProps) {'],
    ],
    [
      'observable scroll viewport',
      [
        '    <div',
        '      ref={viewportRef}',
        '      onScroll={(event) => onViewportScroll?.(event.currentTarget)}',
        '      className="flex-1 overflow-y-auto min-h-0"',
        '    >',
      ],
      ['    <div className="flex-1 overflow-y-auto min-h-0">'],
    ],
  ],
  'top-bar.tsx': [
    [
      'module imports',
      [
        "import { Button } from '@astrale-os/ui/button'",
        "import { cn } from '@astrale-os/ui/class-name'",
        "import { Toggle } from '@astrale-os/ui/toggle'",
        "import { ArrowDownToLine, Copy, Download, Pause, Play, Search, X } from 'lucide-react'",
        "import { useCallback } from 'react'",
        '',
        "import type { LogLevel, ServiceName, TimeRange } from './types.js'",
        '',
        "import { ALL_LEVELS, ALL_SERVICES, LEVEL_COLORS, TIME_RANGE_LABELS } from './types.js'",
      ],
      [
        'import { useCallback } from "react";',
        'import {',
        '  Search,',
        '  X,',
        '  Play,',
        '  Pause,',
        '  PanelRightOpen,',
        '  PanelRightClose,',
        '  Download,',
        '  Upload,',
        '  Bookmark,',
        '} from "lucide-react";',
        'import { Button } from "@/components/ui/button";',
        'import { cn } from "@/lib/utils";',
        'import {',
        '  ALL_LEVELS,',
        '  ALL_SERVICES,',
        '  LEVEL_COLORS,',
        '  TIME_RANGE_LABELS,',
        '} from "@/lib/types";',
        'import type { LogLevel, ServiceName, TimeRange } from "@/lib/types";',
      ],
    ],
    [
      'host boundary properties',
      [
        '  onToggleLiveTail: () => void',
        '  follow: boolean',
        '  onFollowChange: (follow: boolean) => void',
        '  isEmpty: boolean',
        '  onClearFilters: () => void',
        '  onCopy: () => void',
        '  onExport: () => void',
      ],
      [
        '  onToggleLiveTail: () => void;',
        '  sidebarOpen: boolean;',
        '  onToggleSidebar: () => void;',
        '  onClearFilters: () => void;',
        '  onExport: () => void;',
        '  onOpenPaste: () => void;',
        '  onOpenSavedFilters: () => void;',
      ],
    ],
    [
      'host boundary parameters',
      [
        '  onToggleLiveTail,',
        '  follow,',
        '  onFollowChange,',
        '  isEmpty,',
        '  onClearFilters,',
        '  onCopy,',
        '  onExport,',
      ],
      [
        '  onToggleLiveTail,',
        '  sidebarOpen,',
        '  onToggleSidebar,',
        '  onClearFilters,',
        '  onExport,',
        '  onOpenPaste,',
        '  onOpenSavedFilters,',
      ],
    ],
    [
      'wrapped action row',
      ['      <div className="flex flex-wrap items-center gap-2 px-3 py-2">'],
      ['      <div className="flex items-center gap-2 px-3 py-2">'],
    ],
    [
      'search clear name',
      [
        "              onClick={() => onSearchChange('')}",
        '              aria-label="Clear search"',
      ],
      ['              onClick={() => onSearchChange("")}'],
    ],
    [
      'live tail pressed state',
      ['          onClick={onToggleLiveTail}', '          aria-pressed={liveTail}'],
      ['          onClick={onToggleLiveTail}'],
    ],
    [
      'copy, export, and follow controls',
      [
        '        <Button variant="ghost" size="icon-sm" onClick={onCopy} aria-label="Copy" title="Copy">',
        '          <Copy className="size-3.5" />',
        '        </Button>',
        '        <Button',
        '          variant="ghost"',
        '          size="icon-sm"',
        '          onClick={onExport}',
        '          aria-label="Export filtered logs"',
        '          title="Export filtered logs"',
        '        >',
        '          <Download className="size-3.5" />',
        '        </Button>',
        '',
        '        <div className="h-4 w-px bg-zinc-800" />',
        '',
        '        {/* Follow logs */}',
        '        <Toggle',
        '          onPressedChange={onFollowChange}',
        '          pressed={isEmpty ? false : follow}',
        '          disabled={isEmpty}',
        '          variant="outline"',
        '          size="sm"',
        '          aria-label="Toggle follow logs"',
        '          title="Follow logs"',
        '        >',
        '          <ArrowDownToLine className="size-4" />',
        '        </Toggle>',
      ],
      [
        '        <Button variant="ghost" size="icon-sm" onClick={onOpenPaste} title="Import logs">',
        '          <Upload className="size-3.5" />',
        '        </Button>',
        '        <Button variant="ghost" size="icon-sm" onClick={onExport} title="Export filtered logs">',
        '          <Download className="size-3.5" />',
        '        </Button>',
        '        <Button',
        '          variant="ghost"',
        '          size="icon-sm"',
        '          onClick={onOpenSavedFilters}',
        '          title="Saved filters"',
        '        >',
        '          <Bookmark className="size-3.5" />',
        '        </Button>',
        '',
        '        <div className="h-4 w-px bg-zinc-800" />',
        '',
        '        {/* Sidebar toggle */}',
        '        <Button',
        '          variant={sidebarOpen ? "secondary" : "ghost"}',
        '          size="icon-sm"',
        '          onClick={onToggleSidebar}',
        '          title={sidebarOpen ? "Close inspector" : "Open inspector"}',
        '        >',
        '          {sidebarOpen ? (',
        '            <PanelRightClose className="size-3.5" />',
        '          ) : (',
        '            <PanelRightOpen className="size-3.5" />',
        '          )}',
        '        </Button>',
      ],
    ],
    [
      'level toggle pressed state',
      [
        '                onClick={() => onToggleLevel(level)}',
        '                aria-pressed={isActive}',
      ],
      ['                onClick={() => onToggleLevel(level)}'],
    ],
    [
      'service filter name',
      ['          onChange={handleServiceSelect}', '          aria-label="Service"'],
      ['          onChange={handleServiceSelect}'],
    ],
    [
      'time filter name',
      ['          onChange={handleTimeRangeSelect}', '          aria-label="Time"'],
      ['          onChange={handleTimeRangeSelect}'],
    ],
  ],
  'log-viewer.tsx': [
    [
      'module imports',
      [
        "import { Spinner } from '@astrale-os/ui/spinner'",
        "import { Radar, TriangleAlert } from 'lucide-react'",
        "import { useCallback, useEffect, useMemo, useRef, useState } from 'react'",
        '',
        "import type { LogEntry, LogLevel, ServiceName, TimeRange } from './types.js'",
        '',
        "import { LogList } from './log-list.js'",
        "import { exportLogsAsJson, filterLogs } from './log-utils.js'",
        "import { TopBar } from './top-bar.js'",
      ],
      [
        'import { useState, useEffect, useCallback, useMemo, useRef } from "react";',
        'import { Radar } from "lucide-react";',
        'import type { LogEntry, LogLevel, ServiceName, TimeRange, SavedFilter } from "@/lib/types";',
        'import { generateMockLogs, generateLiveTailEntry } from "@/lib/mock-data";',
        'import { filterLogs, exportLogsAsJson } from "@/lib/log-utils";',
        'import { TopBar } from "./top-bar";',
        'import { LogList } from "./log-list";',
        'import { SidebarInspector } from "./sidebar-inspector";',
        'import { Heatmap } from "./heatmap";',
        'import { PasteDialog } from "./paste-dialog";',
        'import { SavedFiltersDialog } from "./saved-filters-dialog";',
      ],
    ],
    [
      'host data boundary',
      [
        'export interface LogViewerProps {',
        '  defaultLogs?: LogEntry[]',
        '  isLoading?: boolean',
        '  streamError?: string | null',
        '  onNextLiveEntry?(): Promise<LogEntry> | LogEntry',
        '  onCopyLogs?(logs: LogEntry[]): Promise<void> | void',
        '  onExportLogs?(logs: LogEntry[]): Promise<void> | void',
        '}',
        '',
        'export function LogViewer({',
        '  defaultLogs = [],',
        '  isLoading = false,',
        '  streamError = null,',
        '  onNextLiveEntry,',
        '  onCopyLogs,',
        '  onExportLogs,',
        '}: LogViewerProps = {}) {',
        '  // Core state',
        '  const [logs, setLogs] = useState<LogEntry[]>(defaultLogs)',
      ],
      [
        'export function LogViewer() {',
        '  // Core state',
        '  const [logs, setLogs] = useState<LogEntry[]>([]);',
        '  const [isLoading, setIsLoading] = useState(true);',
      ],
    ],
    [
      'host action state and injected live entries',
      [
        '  const [liveTail, setLiveTail] = useState(false)',
        '  const [follow, setFollow] = useState(true)',
        '',
        '  // Host action state',
        '  const [pendingMessage, setPendingMessage] = useState<string | null>(null)',
        "  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)",
        '',
        '  // Live tail interval ref',
        '  const liveTailRef = useRef<ReturnType<typeof setInterval> | null>(null)',
        '',
        '  // Follow tail viewport ref',
        '  const viewport = useRef<HTMLDivElement>(null)',
        '',
        '  const runAction = useCallback(',
        '    async (',
        '      busyMessage: string,',
        '      successMessage: string,',
        '      errorMessage: string,',
        '      perform: () => Promise<void> | void,',
        '    ) => {',
        '      setPendingMessage(busyMessage)',
        '      setStatus(null)',
        '      try {',
        '        await perform()',
        "        setStatus({ tone: 'success', message: successMessage })",
        '      } catch {',
        "        setStatus({ tone: 'error', message: errorMessage })",
        '      } finally {',
        '        setPendingMessage(null)',
        '      }',
        '    },',
        '    [],',
        '  )',
        '',
        '  const appendLiveEntry = useCallback(async () => {',
        '    if (!onNextLiveEntry) return',
        '    try {',
        '      const newEntry = await onNextLiveEntry()',
        '      setLogs((prev) => [newEntry, ...prev])',
        '    } catch {',
        "      setStatus({ tone: 'error', message: 'Could not append the next log entry.' })",
        '    }',
        '  }, [onNextLiveEntry])',
        '',
        '  // Live tail effect',
        '  useEffect(() => {',
        '    if (liveTail) {',
        '      liveTailRef.current = setInterval(() => {',
        '        void appendLiveEntry()',
        '      }, 2500)',
      ],
      [
        '  const [sidebarOpen, setSidebarOpen] = useState(false);',
        '  const [liveTail, setLiveTail] = useState(false);',
        '',
        '  // Dialog state',
        '  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);',
        '  const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);',
        '',
        '  // Live tail interval ref',
        '  const liveTailRef = useRef<ReturnType<typeof setInterval> | null>(null);',
        '',
        '  // Generate mock data on mount',
        '  useEffect(() => {',
        '    const data = generateMockLogs(600);',
        '    setLogs(data);',
        '    setIsLoading(false);',
        '  }, []);',
        '',
        '  // Live tail effect',
        '  useEffect(() => {',
        '    if (liveTail) {',
        '      liveTailRef.current = setInterval(() => {',
        '        const newEntry = generateLiveTailEntry();',
        '        setLogs((prev) => [newEntry, ...prev]);',
        '      }, 2500);',
      ],
    ],
    ['live tail effect dependencies', ['  }, [liveTail, appendLiveEntry])'], ['  }, [liveTail]);']],
    [
      'selection without the sidebar inspector',
      ['    setSelectedEntry((prev) => (prev?.id === entry.id ? null : entry))', '  }, [])'],
      [
        '    setSelectedEntry((prev) => (prev?.id === entry.id ? null : entry));',
        '    setSidebarOpen(true);',
        '  }, []);',
      ],
    ],
    [
      'injected copy and export actions',
      [
        '  const getLogsText = useCallback(',
        '    () =>',
        '      filteredLogs',
        "        .map((e) => [e.timestamp.toISOString(), e.level, e.service, e.message].join('\\t'))",
        "        .join('\\n'),",
        '    [filteredLogs],',
        '  )',
        '',
        '  const handleCopy = useCallback(async () => {',
        '    await runAction(',
        "      'Copying logs…',",
        '      `Copied ${filteredLogs.length} log entries to the clipboard.`,',
        "      'Could not copy the visible logs.',",
        '      () => (onCopyLogs ? onCopyLogs(filteredLogs) : navigator.clipboard.writeText(getLogsText())),',
        '    )',
        '  }, [filteredLogs, getLogsText, onCopyLogs, runAction])',
        '',
        '  const handleExport = useCallback(async () => {',
        '    await runAction(',
        "      'Exporting logs…',",
        '      `Exported ${filteredLogs.length} log entries.`,',
        "      'Could not export the visible logs.',",
        '      () => {',
        '        if (onExportLogs) return onExportLogs(filteredLogs)',
        '        const json = exportLogsAsJson(filteredLogs)',
        "        const blob = new Blob([json], { type: 'application/json' })",
        '        const url = URL.createObjectURL(blob)',
        "        const a = document.createElement('a')",
        '        a.href = url',
        '        a.download = `logpilot-export-${new Date().toISOString().slice(0, 19)}.json`',
        '        a.click()',
        '        URL.revokeObjectURL(url)',
        '      },',
        '    )',
        '  }, [filteredLogs, onExportLogs, runAction])',
      ],
      [
        '  const handleExport = useCallback(() => {',
        '    const json = exportLogsAsJson(filteredLogs);',
        '    const blob = new Blob([json], { type: "application/json" });',
        '    const url = URL.createObjectURL(blob);',
        '    const a = document.createElement("a");',
        '    a.href = url;',
        '    a.download = `logpilot-export-${new Date().toISOString().slice(0, 19)}.json`;',
        '    a.click();',
        '    URL.revokeObjectURL(url);',
        '  }, [filteredLogs]);',
        '',
        '  const handleImport = useCallback((entries: LogEntry[]) => {',
        '    setLogs((prev) => {',
        '      const merged = [...entries, ...prev];',
        '      merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());',
        '      return merged;',
        '    });',
        '  }, []);',
        '',
        '  const handleApplyFilter = useCallback((filter: SavedFilter) => {',
        '    setActiveLevels(new Set(filter.levels));',
        '    setActiveServices(new Set(filter.services));',
        '    setTimeRange(filter.timeRange);',
        '    setSearchQuery(filter.searchQuery);',
        '  }, []);',
        '',
        '  const handleToggleSidebar = useCallback(() => {',
        '    setSidebarOpen((prev) => !prev);',
        '  }, []);',
      ],
    ],
    [
      'value-free status projection',
      [
        '  const handleToggleLiveTail = useCallback(() => {',
        '    setLiveTail((prev) => !prev)',
        '  }, [])',
        '',
        "  const statusMessage = status === null ? '' : status.message",
        "  const statusToneClass = status?.tone === 'error' ? 'text-red-400' : 'text-zinc-400'",
      ],
      [
        '  const handleToggleLiveTail = useCallback(() => {',
        '    setLiveTail((prev) => !prev);',
        '  }, []);',
        '',
        '  const handleCloseSidebar = useCallback(() => {',
        '    setSidebarOpen(false);',
        '    setSelectedEntry(null);',
        '  }, []);',
      ],
    ],
    [
      'top bar host wiring',
      [
        '        onToggleLiveTail={handleToggleLiveTail}',
        '        follow={follow}',
        '        onFollowChange={setFollow}',
        '        isEmpty={filteredLogs.length === 0}',
        '        onClearFilters={handleClearFilters}',
        '        onCopy={() => void handleCopy()}',
        '        onExport={() => void handleExport()}',
      ],
      [
        '        onToggleLiveTail={handleToggleLiveTail}',
        '        sidebarOpen={sidebarOpen}',
        '        onToggleSidebar={handleToggleSidebar}',
        '        onClearFilters={handleClearFilters}',
        '        onExport={handleExport}',
        '        onOpenPaste={() => setPasteDialogOpen(true)}',
        '        onOpenSavedFilters={() => setSavedFiltersOpen(true)}',
      ],
    ],
    [
      'log list viewport wiring',
      [
        '          onSelect={handleSelect}',
        '          viewportRef={viewport}',
        '          onViewportScroll={handleViewportScroll}',
        '        />',
        '      </div>',
        '    </div>',
        '  )',
        '}',
      ],
      [
        '          onSelect={handleSelect}',
        '        />',
        '',
        '        {/* Sidebar */}',
        '        {sidebarOpen && (',
        '          <div className="w-80 xl:w-96 border-l border-zinc-800 bg-zinc-950/90 shrink-0 hidden md:block">',
        '            <SidebarInspector',
        '              selectedEntry={selectedEntry}',
        '              allLogs={filteredLogs}',
        '              onClose={handleCloseSidebar}',
        '            />',
        '          </div>',
        '        )}',
        '      </div>',
        '',
        '      {/* Heatmap */}',
        '      <Heatmap logs={logs} />',
        '',
        '      {/* Dialogs */}',
        '      <PasteDialog',
        '        open={pasteDialogOpen}',
        '        onOpenChange={setPasteDialogOpen}',
        '        onImport={handleImport}',
        '      />',
        '',
        '      <SavedFiltersDialog',
        '        open={savedFiltersOpen}',
        '        onOpenChange={setSavedFiltersOpen}',
        '        currentLevels={activeLevels}',
        '        currentServices={activeServices}',
        '        currentTimeRange={timeRange}',
        '        currentSearch={searchQuery}',
        '        onApplyFilter={handleApplyFilter}',
        '      />',
        '    </div>',
        '  );',
        '}',
      ],
    ],
  ],
}

test('the Logpilot log viewer has only the declared Astrale adaptation', async () => {
  assert.equal(logViewerProvenance.adaptation, 'astrale-revision')
  const providerRoot =
    'tooling/upstream/providers/logpilot/a0ac783c7dc6c579714f960731a2392043185dc6/log-viewer'
  assert.equal(
    digest(await readFile(`${providerRoot}/LICENSE`, 'utf8')),
    logViewerProvenance.licenseDigest,
  )
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-log-viewer-fidelity-'))
  try {
    for (const [filename, file] of Object.entries(logViewerProvenance.files)) {
      if (!file.implementation) continue
      const source = await readFile(file.source, 'utf8')
      assert.equal(digest(source), file.sourceDigest)
      const replaceDeclared = (value, from, to, label) => {
        assert.equal(value.split(from).length - 1, 1, `${filename} ${label} is not exact`)
        return value.replace(from, to)
      }
      const removeDeclaredRegion = (value, start, end, label) => {
        assert.equal(value.split(start).length - 1, 1, `${filename} ${label} start is not exact`)
        assert.equal(value.split(end).length - 1, 1, `${filename} ${label} end is not exact`)
        return value.slice(0, value.indexOf(start)) + value.slice(value.indexOf(end))
      }
      let implementation = await readFile(file.implementation, 'utf8')
      for (const [label, start, end] of declaredLogViewerRegions[filename] ?? []) {
        implementation = removeDeclaredRegion(
          implementation,
          start.join('\n'),
          end.join('\n'),
          label,
        )
      }
      for (const [label, adapted, upstream] of declaredLogViewerEdits[filename] ?? []) {
        implementation = replaceDeclared(
          implementation,
          adapted.join('\n'),
          upstream.join('\n'),
          label,
        )
      }
      assert.equal(
        implementation.split("'@astrale-os/ui/").length - 1,
        0,
        `${filename} keeps an undeclared routed runtime import`,
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
    for (const [filename, file] of Object.entries(logViewerProvenance.files)) {
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

test('the supporting Rivet log behaviors are vendored and reproduced verbatim', async () => {
  const providerRoot =
    'tooling/upstream/providers/rivet/b5cac54a50103c0739b618f519ce32778119c3b4/log-viewer'
  assert.equal(logViewerSupportProvenance.license, 'Apache-2.0')
  assert.equal(
    digest(await readFile(`${providerRoot}/LICENSE`, 'utf8')),
    logViewerSupportProvenance.licenseDigest,
  )
  for (const file of Object.values(logViewerSupportProvenance.files)) {
    assert.equal(digest(await readFile(file.source, 'utf8')), file.sourceDigest)
  }
  const logsView = await readFile(`${providerRoot}/logs-view.tsx`, 'utf8')
  const deploymentLogs = await readFile(`${providerRoot}/deployment-logs.tsx`, 'utf8')
  const topBar = await readFile('registry/blocks/observability/log-viewer/top-bar.tsx', 'utf8')
  const composition = await readFile(
    'registry/blocks/observability/log-viewer/log-viewer.tsx',
    'utf8',
  )
  for (const fragment of ['aria-label="Toggle follow logs"', 'Follow logs']) {
    assert.ok(logsView.includes(fragment), `upstream follow authority lost ${fragment}`)
    assert.ok(topBar.includes(fragment), `adapted follow control lost ${fragment}`)
  }
  const banner =
    'flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive-foreground text-xs border-b border-destructive/40 shrink-0'
  assert.ok(deploymentLogs.includes(banner))
  assert.ok(composition.includes(banner))
  assert.ok(deploymentLogs.includes('Stream error: {streamError}'))
  assert.ok(composition.includes('Stream error: {streamError}'))
  assert.ok(deploymentLogs.includes('navigator.clipboard.writeText'))
  assert.ok(composition.includes('navigator.clipboard.writeText'))
})
