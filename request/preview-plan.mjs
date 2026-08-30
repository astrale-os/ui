#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { uiRequestLimits as limits } from './.spec/limits.ts'

const previewPattern = /^(?<subject>[a-z0-9-]+)(?:\.(?<scene>[a-z0-9-]+))?\.preview\.tsx$/u

export function previewIdentity(file) {
  const normalized = file.split(path.sep).join('/')
  const basename = path.posix.basename(normalized)
  const match = previewPattern.exec(basename)
  if (!match?.groups) throw new TypeError(`Invalid preview filename: ${file}`)
  const { subject, scene = 'default' } = match.groups
  let address
  const runtime = /^packages\/ui\/previews\/([^/]+)\/[^/]+$/u.exec(normalized)
  const component = /^registry\/components\/([^/]+)\/[^/]+$/u.exec(normalized)
  const composition = /^registry\/(patterns|blocks)\/([^/]+)\/[^/]+$/u.exec(normalized)
  const variant =
    /^registry\/variants\/source\/(components|patterns|blocks)\/([^/]+)\/([^/]+)\/[^/]+$/u.exec(
      normalized,
    )
  if (runtime) address = `component/${runtime[1]}`
  else if (component) address = `component/${component[1]}`
  else if (composition) {
    address = `${composition[1] === 'patterns' ? 'pattern' : 'block'}/${composition[2]}/${subject}`
  } else if (variant) {
    const kind = variant[1] === 'components' ? 'component' : variant[1].slice(0, -1)
    address = `${kind}/${variant[2]}/${variant[3]}`
  }
  if (!address) throw new TypeError(`Preview is outside an admitted owner: ${file}`)
  return { id: `${address}#${scene}`, address, scene, file: normalized }
}

function affectedOwner(file) {
  const normalized = file.split(path.sep).join('/')
  let match = /^packages\/ui\/src\/[^/]+\/([^/]+)\//u.exec(normalized)
  if (match) return { kind: 'family', value: `component/${match[1]}` }
  match = /^packages\/ui\/previews\/([^/]+)\//u.exec(normalized)
  if (match) return { kind: 'family', value: `component/${match[1]}` }
  match = /^registry\/components\/([^/]+)\//u.exec(normalized)
  if (match) return { kind: 'family', value: `component/${match[1]}` }
  match = /^registry\/(patterns|blocks)\/([^/]+)\//u.exec(normalized)
  if (match) {
    return {
      kind: 'family',
      value: `${match[1] === 'patterns' ? 'pattern' : 'block'}/${match[2]}`,
    }
  }
  match = /^registry\/variants\/source\/(components|patterns|blocks)\/([^/]+)\/([^/]+)\//u.exec(
    normalized,
  )
  if (match) {
    const kind = match[1] === 'components' ? 'component' : match[1].slice(0, -1)
    return { kind: 'address', value: `${kind}/${match[2]}/${match[3]}` }
  }
  if (
    normalized.startsWith('packages/ui/src/') ||
    normalized.startsWith('registry/variants/support/') ||
    normalized.startsWith('registry/themes/') ||
    normalized.startsWith('playground/src/')
  ) {
    return { kind: 'all', value: '' }
  }
  return undefined
}

function screenshotName(id) {
  const slug = id.replaceAll(/[^a-z0-9]+/gu, '-').replaceAll(/^-|-$/gu, '')
  const digest = createHash('sha256').update(id).digest('hex').slice(0, 12)
  return `${slug}-${digest}.png`
}

export function createPreviewPlan(changedFiles, previewFiles) {
  const identities = previewFiles.map(previewIdentity)
  const selected = new Map()
  for (const file of changedFiles) {
    if (file.endsWith('.preview.tsx')) {
      const identity = identities.find((entry) => entry.file === file)
      if (identity) selected.set(identity.id, identity)
      continue
    }
    const owner = affectedOwner(file)
    if (!owner) continue
    for (const identity of identities) {
      const matches =
        owner.kind === 'address'
          ? identity.address === owner.value
          : owner.kind === 'all' ||
            identity.address === owner.value ||
            identity.address.startsWith(`${owner.value}/`)
      if (matches) selected.set(identity.id, identity)
    }
  }
  const previews = [...selected.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(({ file: _file, ...identity }) => ({
      ...identity,
      screenshot: `screenshots/${screenshotName(identity.id)}`,
    }))
  if (previews.length === 0) {
    throw new TypeError('A UI request proposal must affect at least one canonical preview')
  }
  if (previews.length > limits.maxPreviewCount) {
    throw new TypeError(`Changed previews exceed the admitted count of ${limits.maxPreviewCount}`)
  }
  return { version: 1, previews }
}

function argument(argv, name) {
  const index = argv.indexOf(name)
  if (index === -1 || !argv[index + 1]) throw new TypeError(`${name} is required`)
  if (argv.indexOf(name, index + 1) !== -1) throw new TypeError(`${name} may appear only once`)
  return argv[index + 1]
}

export async function writePreviewPlan({ root = process.cwd(), base, output }) {
  const changedFiles = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', base, '--'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  )
    .trim()
    .split('\n')
    .filter(Boolean)
  const previewFiles = []
  for await (const file of glob(
    ['packages/ui/previews/**/*.preview.tsx', 'registry/**/*.preview.tsx'],
    { cwd: root },
  )) {
    previewFiles.push(file)
  }
  const plan = createPreviewPlan(changedFiles, previewFiles)
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`)
  return plan
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = argument(process.argv.slice(2), '--base')
  const output = path.resolve(argument(process.argv.slice(2), '--output'))
  await readFile(new URL('./.spec/limits.ts', import.meta.url))
  const plan = await writePreviewPlan({ base, output })
  process.stdout.write(`Planned ${plan.previews.length} changed preview(s).\n`)
}
