#!/usr/bin/env node

import { lstat, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const policy = Object.freeze({
  maxPreviewCount: 64,
  maxFiles: 8_192,
  maxBytes: 128 * 1024 * 1024,
  maxFileBytes: 16 * 1024 * 1024,
})

function argument(name) {
  const index = process.argv.indexOf(name)
  if (index === -1 || !process.argv[index + 1]) throw new TypeError(`${name} is required`)
  return process.argv[index + 1]
}

async function regularFiles(root) {
  const files = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name)
      const relative = path.relative(root, target).split(path.sep)
      if (relative.includes('.git')) throw new TypeError('Preview artifact contains Git metadata')
      const details = await lstat(target)
      if (details.isSymbolicLink()) throw new TypeError('Preview artifact contains a symlink')
      if (details.isDirectory()) await visit(target)
      else if (details.isFile()) files.push({ path: target, size: details.size })
      else throw new TypeError('Preview artifact contains a non-regular entry')
    }
  }
  await visit(root)
  return files
}

function acceptedPreview(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    Object.keys(value).some((key) => !['id', 'address', 'scene', 'screenshot'].includes(key)) ||
    typeof value.id !== 'string' ||
    value.id !== `${value.address}#${value.scene}` ||
    !/^(?:component|pattern|block)\/[a-z0-9/-]+#[a-z0-9-]+$/u.test(value.id) ||
    typeof value.screenshot !== 'string' ||
    !/^screenshots\/[a-z0-9-]+\.png$/u.test(value.screenshot)
  ) {
    throw new TypeError('Preview evidence entry is malformed')
  }
  return value
}

async function admit(root) {
  const files = await regularFiles(root)
  if (files.length === 0 || files.length > policy.maxFiles) {
    throw new TypeError('Preview artifact file count is outside the admitted bound')
  }
  if (files.some((file) => file.size > policy.maxFileBytes)) {
    throw new TypeError('Preview artifact contains an oversized file')
  }
  if (files.reduce((total, file) => total + file.size, 0) > policy.maxBytes) {
    throw new TypeError('Preview artifact exceeds the admitted byte bound')
  }
  const siteIndex = path.join(root, 'site', 'index.html')
  if (!(await stat(siteIndex)).isFile()) throw new TypeError('Preview artifact has no site index')
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'))
  if (
    manifest?.version !== 1 ||
    !Array.isArray(manifest.previews) ||
    manifest.previews.length === 0 ||
    manifest.previews.length > policy.maxPreviewCount
  ) {
    throw new TypeError('Preview evidence manifest is malformed')
  }
  const previews = manifest.previews.map(acceptedPreview)
  if (new Set(previews.map((preview) => preview.id)).size !== previews.length) {
    throw new TypeError('Preview evidence contains duplicate identities')
  }
  if (new Set(previews.map((preview) => preview.screenshot)).size !== previews.length) {
    throw new TypeError('Preview evidence contains duplicate screenshot paths')
  }
  for (const preview of previews) {
    if (!(await stat(path.join(root, preview.screenshot))).isFile()) {
      throw new TypeError(`Preview screenshot is missing for ${preview.id}`)
    }
  }
  return { version: 1, previews }
}

function acceptedUrl(value, expectedHost) {
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    url.host !== expectedHost ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError('Preview publication URL is malformed')
  }
  return url
}

const root = path.resolve(argument('--root'))
const origin = acceptedUrl(argument('--origin'), 'astrale-os.github.io')
const pullRequest = acceptedUrl(argument('--pull-request'), 'github.com')
const revision = argument('--revision')
const runUrl = acceptedUrl(argument('--run-url'), 'github.com')
const output = path.resolve(argument('--output'))
if (!/^[0-9a-f]{40}$/u.test(revision)) throw new TypeError('Preview revision is malformed')
const manifest = await admit(root)
const siteIndex = path.join(root, 'site', 'index.html')
const indexSource = await readFile(siteIndex, 'utf8')
const revisionMarker = `<meta name="astrale-ui-request-revision" content="${revision}">`
if (!indexSource.includes('</head>') || indexSource.includes('astrale-ui-request-revision')) {
  throw new TypeError('Preview site index cannot receive its trusted revision marker')
}
await writeFile(siteIndex, indexSource.replace('</head>', `${revisionMarker}</head>`))
const previewUrl = (preview) => {
  const url = new URL(`${origin.href.replace(/\/$/u, '')}/`)
  url.searchParams.set('preview', preview.id)
  url.searchParams.set('revision', revision)
  return url.href
}
const screenshotUrl = (preview) => {
  const url = new URL(
    `${origin.href.replace(/\/$/u, '')}/_evidence/${path.basename(preview.screenshot)}`,
  )
  url.searchParams.set('revision', revision)
  return url.href
}
const first = manifest.previews[0]
const rows = manifest.previews
  .map(
    (preview) =>
      `| \`${preview.id}\` | [Open preview](${previewUrl(preview)}) | [Screenshot](${screenshotUrl(preview)}) |`,
  )
  .join('\n')
const comment = `<!-- astrale-ui-request-preview:v1 -->
## Astrale UI proposal evidence

Revision: [\`${revision.slice(0, 12)}\`](https://github.com/astrale-os/ui/commit/${revision})  
Playground: [Open the changed preview](${previewUrl(first)})  
Qualification and complete artifacts: [workflow run](${runUrl.href})

| Preview | Live playground | Evidence |
| --- | --- | --- |
${rows}

![${first.id}](${screenshotUrl(first)})

Comment or review this pull request, then apply \`ui:ready\` to this PR to revise the same proposal. The next qualified revision replaces this deployment and evidence.

_This comment is maintained by trusted request automation for [${pullRequest.href}](${pullRequest.href})._
`
await writeFile(output, comment)
process.stdout.write(`${JSON.stringify(manifest)}\n`)
