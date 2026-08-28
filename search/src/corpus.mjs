import { parse } from '@babel/parser'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { limits } from './config.mjs'

export const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))

const nonvisualExports = new Set([
  '.',
  './class-name',
  './package.json',
  './reset.css',
  './theme.css',
  './presets/astrale.css',
  './presets/compact.css',
  './presets/expressive.css',
])

const stopwords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'my',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])

const sourceStopwords = new Set([
  'const',
  'default',
  'else',
  'export',
  'false',
  'function',
  'if',
  'import',
  'let',
  'new',
  'null',
  'react',
  'return',
  'true',
  'undefined',
  'use',
  'var',
])

const excludedIdentifiers = new Set([
  'absolute',
  'bg',
  'border',
  'children',
  'classname',
  'cn',
  'data',
  'dark',
  'demo',
  'duration',
  'ease',
  'fixed',
  'flex',
  'focus',
  'gap',
  'grid',
  'hover',
  'inset',
  'mx',
  'my',
  'opacity',
  'preview',
  'props',
  'px',
  'py',
  'react',
  'ref',
  'relative',
  'ring',
  'rotate',
  'rounded',
  'scale',
  'shadow',
  'shadcn',
  'source',
  'state',
  'sticky',
  'style',
  'transition',
  'translate',
])

const semanticAttributes = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'description',
  'label',
  'name',
  'placeholder',
  'title',
])

const excludedValueOwners = new Set([
  'class',
  'classname',
  'data-slot',
  'href',
  'id',
  'key',
  'slot',
  'src',
  'style',
])

export function tokenize(value, { keepNumeric = true, source = false } = {}) {
  const expanded = String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .replace(/[_/.-]+/gu, ' ')
    .toLowerCase()
  return (expanded.match(/[a-z0-9]+/gu) ?? []).filter(
    (term) =>
      !stopwords.has(term) &&
      (!source || !sourceStopwords.has(term)) &&
      (keepNumeric || !/^\d+$/u.test(term)) &&
      term.length > 1,
  )
}

export function repositoryFile(relative) {
  assert.equal(typeof relative, 'string', 'Repository path must be a string')
  assert.ok(relative.length > 0, 'Repository path must not be empty')
  assert.ok(!path.isAbsolute(relative), `Repository path must be relative: ${relative}`)
  assert.ok(!relative.includes('\\'), `Repository path must use POSIX separators: ${relative}`)
  assert.ok(!relative.split('/').includes('..'), `Repository path escapes root: ${relative}`)
  const absolute = path.resolve(repositoryRoot, relative)
  const fromRoot = path.relative(repositoryRoot, absolute)
  assert.ok(
    fromRoot.length > 0 && fromRoot !== '..' && !fromRoot.startsWith(`..${path.sep}`),
    `Repository path escapes root: ${relative}`,
  )
  return absolute
}

function label(value) {
  return value
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function packageName(specifier) {
  const scoped = /^(@[^/]+\/[^@]+)@/u.exec(specifier)
  if (scoped) return scoped[1]
  return specifier.replace(/@(?:[~^<>=0-9A-Za-z.* -]+|https?:\/\/.*)$/u, '')
}

function looksVisualBoilerplate(value) {
  if (/^(?:https?:\/\/|data:)/u.test(value) || /\S+@\S+\.\S+/u.test(value)) return true
  const parts = value.trim().split(/\s+/u)
  if (
    parts.length === 1 &&
    /^(?:[a-z-]+:)*(?:bg|text|border|rounded|shadow|ring|p[trblxy]?|m[trblxy]?|w|h|min-w|max-w|min-h|max-h|gap|grid|flex|items|justify|font|leading|tracking|opacity|overflow|translate|scale|rotate|absolute|relative|fixed|sticky|inset|top|right|bottom|left|z)-/u.test(
      parts[0],
    )
  ) {
    return true
  }
  if (parts.length < 4) return false
  const classLike = parts.filter(
    (part) => /(?:^|:)[a-z][a-z0-9-]*(?:-|\[|\/)[^\s]*/u.test(part) || part.includes('data-['),
  ).length
  return classLike / parts.length >= 0.45
}

function nodeName(node) {
  if (!node || typeof node !== 'object') return undefined
  if (node.type === 'JSXIdentifier' || node.type === 'Identifier') return node.name
  if (node.type === 'StringLiteral') return node.value
  return undefined
}

function literalValue(node) {
  if (!node || typeof node !== 'object') return undefined
  if (node.type === 'StringLiteral') return node.value
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join('')
  }
  if (node.type === 'JSXExpressionContainer') return literalValue(node.expression)
  return undefined
}

export function extractBehaviorTerms(source, file) {
  if (!/\.[cm]?[jt]sx?$/u.test(file)) return []
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })
  const ranked = new Map()
  const admit = (value, priority) => {
    if (!value || looksVisualBoilerplate(value)) return
    for (const term of tokenize(value, { keepNumeric: false, source: true })) {
      if (excludedIdentifiers.has(term)) continue
      ranked.set(term, Math.max(priority, ranked.get(term) ?? 0))
    }
  }

  const visit = (node, owner) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const child of node) visit(child, owner)
      return
    }
    if (node.type === 'JSXText') admit(node.value, 4)
    if (node.type === 'JSXAttribute') {
      const name = nodeName(node.name)?.toLowerCase()
      if (name && semanticAttributes.has(name)) admit(literalValue(node.value), 4)
      if (name && excludedValueOwners.has(name)) return
    }
    if (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') {
      const name = nodeName(node.key)?.toLowerCase()
      if (name && semanticAttributes.has(name)) admit(literalValue(node.value), 4)
      if (name && excludedValueOwners.has(name)) return
    }
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') admit(node.name, 2)
    if (node.type === 'StringLiteral' && !excludedValueOwners.has(owner ?? '')) admit(node.value, 1)

    for (const [key, child] of Object.entries(node)) {
      if (
        key === 'type' ||
        key === 'loc' ||
        key === 'start' ||
        key === 'end' ||
        key === 'extra' ||
        key === 'comments' ||
        key === 'errors'
      ) {
        continue
      }
      const nextOwner =
        node.type === 'JSXAttribute' || node.type === 'ObjectProperty'
          ? nodeName(node.name ?? node.key)?.toLowerCase()
          : owner
      visit(child, nextOwner)
    }
  }
  visit(ast, undefined)

  return [...ranked]
    .sort(
      ([left, leftRank], [right, rightRank]) => rightRank - leftRank || left.localeCompare(right),
    )
    .slice(0, limits.behaviorTermsPerDocument)
    .map(([term]) => term)
}

async function sourceEvidence(files) {
  const ranked = new Map()
  for (const relative of files) {
    if (!/\.(?:[cm]?[jt]sx?|css)$/u.test(relative)) continue
    const source = await readFile(repositoryFile(relative), 'utf8')
    for (const [position, term] of extractBehaviorTerms(source, relative).entries()) {
      const rank = limits.behaviorTermsPerDocument - position
      ranked.set(term, Math.max(rank, ranked.get(term) ?? 0))
    }
  }
  return [...ranked]
    .sort(
      ([left, leftRank], [right, rightRank]) => rightRank - leftRank || left.localeCompare(right),
    )
    .slice(0, limits.behaviorTermsPerDocument)
    .map(([term]) => term)
}

function codeLanguage(file) {
  return file.endsWith('.css') ? 'css' : 'tsx'
}

function registryDocument(item) {
  const address = item.meta?.canonicalAddress
  assert.equal(typeof address, 'string', `Registry item ${item.name} has no canonical address`)
  const files = item.files.map((file) => file.path)
  assert.ok(files.length > 0, `Registry item ${address} has no files`)
  for (const file of files) repositoryFile(file)
  const segments = address.split('/')
  const subject = segments.at(-1)
  const primaryCandidates = files.filter(
    (file) =>
      /\.(?:tsx?|css)$/u.test(file) &&
      !file.includes('/support/') &&
      path.basename(file).replace(/\.(?:tsx?|css)$/u, '') === subject,
  )
  assert.equal(
    primaryCandidates.length,
    1,
    `Registry item ${address} must have exactly one canonical source owner`,
  )
  const [primary] = primaryCandidates
  const family = segments[0] === 'theme' ? 'theme' : `${segments[0]}/${segments[1]}`
  return {
    address,
    title: item.title ?? label(subject),
    description: item.description ?? '',
    dependencies: [...new Set((item.dependencies ?? []).map(packageName))].sort(),
    code: { language: codeLanguage(primary), path: primary },
    command: `astrale ui add ${address}`,
    family,
    identity: tokenize([address, item.title, segments[1]].filter(Boolean).join(' ')),
    files,
  }
}

function runtimeDocument(entrypoint) {
  const subject = entrypoint.slice(2)
  const packageImport = `@astrale-os/ui/${subject}`
  const preview = `packages/ui/previews/${subject}/${subject}.preview.tsx`
  repositoryFile(preview)
  return {
    address: packageImport,
    title: label(subject),
    description: `Runtime component exported from ${packageImport}.`,
    dependencies: [],
    code: { language: 'tsx', path: preview },
    packageImport,
    family: `component/${subject}`,
    identity: tokenize(`${packageImport} ${subject} ${label(subject)}`),
    files: [preview],
  }
}

function canonicalPreview(address) {
  const segments = address.split('/')
  if (segments[0] === 'component' && segments.length === 2) {
    return `registry/components/${segments[1]}/${segments[1]}.preview.tsx`
  }
  if ((segments[0] === 'pattern' || segments[0] === 'block') && segments.length === 3) {
    const owner = segments[0] === 'pattern' ? 'patterns' : 'blocks'
    return `registry/${owner}/${segments[1]}/${segments[2]}.preview.tsx`
  }
  return undefined
}

async function selectDemoCode(document) {
  if (document.command && !document.code.path.startsWith('registry/variants/')) {
    const preview = canonicalPreview(document.address)
    if (preview) {
      await access(repositoryFile(preview))
      document.code = { language: 'tsx', path: preview }
      document.files.push(preview)
    }
  }
  const source = await readFile(repositoryFile(document.code.path))
  assert.ok(source.byteLength <= limits.maxCodeBytes, `${document.address} demo exceeds code bound`)
  document.code.bytes = source.byteLength
  document.code.sha256 = createHash('sha256').update(source).digest('hex')
}

export async function buildSearchDocuments() {
  const [registry, packageDocument] = await Promise.all([
    readFile(repositoryFile('registry/registry.json'), 'utf8').then(JSON.parse),
    readFile(repositoryFile('packages/ui/package.json'), 'utf8').then(JSON.parse),
  ])
  const registryDocuments = registry.items.map(registryDocument)
  const runtimeDocuments = Object.keys(packageDocument.exports)
    .filter((entrypoint) => !nonvisualExports.has(entrypoint))
    .map(runtimeDocument)
  const documents = [...registryDocuments, ...runtimeDocuments].sort((left, right) =>
    left.address.localeCompare(right.address),
  )
  assert.equal(new Set(documents.map((document) => document.address)).size, documents.length)

  for (const document of documents) {
    await selectDemoCode(document)
    document.behavior = await sourceEvidence(document.files)
    delete document.files
  }
  return {
    documents,
    counts: {
      registry: registryDocuments.length,
      runtime: runtimeDocuments.length,
      total: documents.length,
    },
  }
}
