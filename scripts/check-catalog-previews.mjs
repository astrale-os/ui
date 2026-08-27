import assert from 'node:assert/strict'
import { glob, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const previewPattern = /^(?<subject>[a-z0-9-]+)(?:\.(?<scene>[a-z0-9-]+))?\.preview\.tsx$/u

export function previewIdentity(file) {
  const normalized = file.split(path.sep).join('/')
  const basename = path.posix.basename(normalized)
  const match = previewPattern.exec(basename)
  assert.ok(match?.groups, `Invalid preview filename: ${file}`)
  const { subject, scene = 'default' } = match.groups
  assert.notEqual(match.groups.scene, 'default', `Do not spell the canonical scene: ${file}`)

  let address
  const runtime = /^packages\/ui\/previews\/([^/]+)\/([^/]+)$/u.exec(normalized)
  if (runtime) {
    assert.equal(runtime[1], subject, `Runtime preview subject must match its directory: ${file}`)
    address = `component/${subject}`
  }

  const component = /^registry\/components\/([^/]+)\/([^/]+)$/u.exec(normalized)
  if (component) {
    assert.equal(component[1], subject, `Registry component preview subject mismatch: ${file}`)
    address = `component/${subject}`
  }

  const composition = /^registry\/(patterns|blocks)\/([^/]+)\/([^/]+)$/u.exec(normalized)
  if (composition) {
    const kind = composition[1] === 'patterns' ? 'pattern' : 'block'
    address = `${kind}/${composition[2]}/${subject}`
  }

  const variant =
    /^registry\/variants\/source\/(components|patterns|blocks)\/([^/]+)\/([^/]+)\/([^/]+)$/u.exec(
      normalized,
    )
  if (variant) {
    assert.equal(variant[3], subject, `Variant preview subject mismatch: ${file}`)
    const kind = variant[1] === 'components' ? 'component' : variant[1].slice(0, -1)
    address = `${kind}/${variant[2]}/${subject}`
  }

  assert.ok(address, `Preview is outside an admitted owner: ${file}`)
  return { address, scene, canonical: scene === 'default', file: normalized }
}

function visualRuntimeAddresses(packageDocument) {
  const nonvisual = new Set([
    '.',
    './class-name',
    './package.json',
    './reset.css',
    './theme.css',
    './presets/astrale.css',
    './presets/compact.css',
    './presets/expressive.css',
  ])
  return Object.keys(packageDocument.exports)
    .filter((entrypoint) => !nonvisual.has(entrypoint))
    .map((entrypoint) => `component/${entrypoint.slice(2)}`)
}

export function catalogProblems({ packageDocument, registry, previews }) {
  const visual = new Set([
    ...visualRuntimeAddresses(packageDocument),
    ...registry.items
      .map((item) => item.meta.canonicalAddress)
      .filter((address) => /^(?:component|pattern|block)\//u.test(address)),
  ])
  const problems = []
  const identities = []
  for (const preview of previews) {
    try {
      identities.push(previewIdentity(preview))
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error))
    }
  }
  const seen = new Map()
  const canonical = new Map()

  for (const identity of identities) {
    const key = `${identity.address}#${identity.scene}`
    if (seen.has(key)) {
      problems.push(`Duplicate preview ${key}: ${seen.get(key)} and ${identity.file}`)
    } else {
      seen.set(key, identity.file)
    }
    if (!visual.has(identity.address)) {
      problems.push(`Orphan preview ${key}: ${identity.file}`)
    }
    if (identity.canonical) canonical.set(identity.address, identity.file)
  }

  for (const address of [...visual].sort()) {
    if (!canonical.has(address)) problems.push(`Missing canonical preview: ${address}`)
  }

  for (const item of registry.items) {
    for (const file of item.files) {
      if (/\.(?:preview\.tsx|fixture\.ts)$/u.test(file.path)) {
        problems.push(`Registry item ${item.name} distributes private catalog file ${file.path}`)
      }
    }
  }

  return { problems, identities, expected: visual.size }
}

export async function checkCatalogPreviews(root = process.cwd()) {
  const [packageDocument, registry] = await Promise.all([
    readFile(path.join(root, 'packages/ui/package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(root, 'registry/registry.json'), 'utf8').then(JSON.parse),
  ])
  const previews = []
  for await (const file of glob(
    ['packages/ui/previews/**/*.preview.tsx', 'registry/**/*.preview.tsx'],
    { cwd: root },
  )) {
    previews.push(file)
  }
  const result = catalogProblems({ packageDocument, registry, previews })
  if (result.problems.length > 0) {
    throw new Error(`Catalog preview contract failed:\n- ${result.problems.join('\n- ')}`)
  }
  return result
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  try {
    const result = await checkCatalogPreviews()
    console.log(
      `PASS catalog previews (${result.expected} canonical items, ${result.identities.length} scenes)`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
