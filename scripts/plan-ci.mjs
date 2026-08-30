#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const documentation =
  /(?:^|\/)(?:README|CHANGELOG|CONTRIBUTING|SECURITY|LICENSE)(?:\.[^/]*)?$|\.(?:md|mdx|txt)$/iu
const requestTooling = /^(?:request\/|\.github\/(?:ISSUE_TEMPLATE\/|workflows\/ui-request))/u
const familyPath = /^registry\/(components|patterns|blocks)\/([^/]+)\//u
const globalUi =
  /^(?:packages\/ui\/|playground\/|registry\/variants\/|registry\/registry\.json$|registry\/core-catalog\.json$|themes\/|search\/|scripts\/(?:build|sync|refresh|intake|normalize|registry|catalog|upstream|verify))/u

export function planCi(files) {
  const normalized = [...new Set(files.map((file) => file.trim()).filter(Boolean))].sort()
  if (normalized.length === 0) return { plan: 'docs-only', families: [], files: [] }
  if (normalized.every((file) => documentation.test(file))) {
    return { plan: 'docs-only', families: [], files: normalized }
  }
  if (normalized.every((file) => requestTooling.test(file) || documentation.test(file))) {
    return { plan: 'request-tooling', families: [], files: normalized }
  }
  const families = normalized
    .map((file) => familyPath.exec(file))
    .filter(Boolean)
    .map(
      (match) => `${match[1] === 'components' ? 'component' : match[1].slice(0, -1)}/${match[2]}`,
    )
  const familyScoped = normalized.every(
    (file) => familyPath.test(file) || requestTooling.test(file) || documentation.test(file),
  )
  if (familyScoped && families.length > 0) {
    return { plan: 'family-scoped', families: [...new Set(families)].sort(), files: normalized }
  }
  return {
    plan: globalUi.test(normalized.join('\n')) ? 'global-ui' : 'global-ui',
    families: [],
    files: normalized,
  }
}

function argument(argv, name, fallback) {
  const index = argv.indexOf(name)
  if (index === -1) return fallback
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

async function main(argv) {
  const base = argument(argv, '--base')
  const head = argument(argv, '--head', 'HEAD')
  const explicitFiles = argument(argv, '--files')
  const files = explicitFiles
    ? explicitFiles.split('\n')
    : execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRD', `${base}...${head}`], {
        encoding: 'utf8',
      }).split('\n')
  const plan = planCi(files)
  const serialized = `${JSON.stringify(plan, null, 2)}\n`
  const output = argument(argv, '--output')
  if (output) await writeFile(output, serialized)
  process.stdout.write(serialized)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'CI planning failed'}\n`)
    process.exitCode = 1
  })
}
