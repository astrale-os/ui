#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const commitPattern = /^[0-9a-f]{40}$/u
const digestPattern = /^[0-9a-f]{64}$/u

function exactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).toSorted().join(',') === [...keys].toSorted().join(',')
  )
}

function admittedArtifact(value) {
  return (
    exactKeys(value, ['sha256', 'bytes']) &&
    digestPattern.test(value.sha256) &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes > 0
  )
}

function admittedReceipt(value) {
  return (
    exactKeys(value, [
      'version',
      'commitSha',
      'treeSha',
      'package',
      'registry',
      'catalog',
      'browserShards',
      'toolchain',
      'qualifiedAt',
    ]) &&
    value.version === 1 &&
    commitPattern.test(value.commitSha) &&
    commitPattern.test(value.treeSha) &&
    admittedArtifact(value.package) &&
    admittedArtifact(value.registry) &&
    admittedArtifact(value.catalog) &&
    Array.isArray(value.browserShards) &&
    value.browserShards.length === 4 &&
    value.browserShards.every(
      (shard) =>
        exactKeys(shard, ['index', 'total', 'state']) &&
        Number.isSafeInteger(shard.index) &&
        shard.index >= 1 &&
        shard.index <= 4 &&
        shard.total === 4 &&
        shard.state === 'passed',
    ) &&
    exactKeys(value.toolchain, ['node', 'pnpm', 'playwright']) &&
    ['node', 'pnpm', 'playwright'].every(
      (key) => typeof value.toolchain[key] === 'string' && value.toolchain[key].length > 0,
    ) &&
    typeof value.qualifiedAt === 'string' &&
    Number.isFinite(Date.parse(value.qualifiedAt))
  )
}

async function digest(file) {
  const details = await stat(file)
  if (!details.isFile() || details.size < 1) throw new Error(`receipt input is not a file: ${file}`)
  return {
    sha256: createHash('sha256')
      .update(await readFile(file))
      .digest('hex'),
    bytes: details.size,
  }
}

function canonicalTimestamp(value) {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error('qualifiedAt must be a canonical UTC timestamp')
  }
  return value
}

export async function createQualificationReceipt(options) {
  if (!commitPattern.test(options.commitSha) || !commitPattern.test(options.treeSha)) {
    throw new Error('receipt commit and tree must be exact Git object identities')
  }
  if (!Array.isArray(options.browserShards) || options.browserShards.length !== 4) {
    throw new Error('receipt requires exactly four browser shards')
  }
  const indexes = options.browserShards.map((shard) => shard.index).sort((a, b) => a - b)
  if (
    indexes.join(',') !== '1,2,3,4' ||
    options.browserShards.some((shard) => shard.total !== 4 || shard.state !== 'passed')
  ) {
    throw new Error('receipt browser shards are incomplete')
  }
  return {
    version: 1,
    commitSha: options.commitSha,
    treeSha: options.treeSha,
    package: await digest(options.packageFile),
    registry: await digest(options.registryFile),
    catalog: await digest(options.catalogFile),
    browserShards: options.browserShards.sort((left, right) => left.index - right.index),
    toolchain: options.toolchain,
    qualifiedAt: canonicalTimestamp(options.qualifiedAt),
  }
}

export async function verifyQualificationReceiptEnvelope(options) {
  const receipt = JSON.parse(await readFile(options.receipt, 'utf8'))
  if (!admittedReceipt(receipt)) throw new Error('qualification receipt schema admission failed')
  const shardIndexes = receipt.browserShards.map((shard) => shard.index).sort((a, b) => a - b)
  if (shardIndexes.join(',') !== '1,2,3,4') {
    throw new Error('qualification receipt browser shards are incomplete')
  }
  if (receipt.commitSha !== options.commitSha || receipt.treeSha !== options.treeSha) {
    throw new Error('qualification receipt does not match the exact revision')
  }
  return receipt
}

export async function verifyQualificationReceipt(options) {
  const receipt = await verifyQualificationReceiptEnvelope(options)
  for (const [name, file] of [
    ['package', options.packageFile],
    ['registry', options.registryFile],
    ['catalog', options.catalogFile],
  ]) {
    const observed = await digest(file)
    if (observed.sha256 !== receipt[name]?.sha256 || observed.bytes !== receipt[name]?.bytes) {
      throw new Error(`qualification receipt ${name} digest mismatch`)
    }
  }
  return receipt
}

function argument(argv, name) {
  const index = argv.indexOf(name)
  if (index === -1 || !argv[index + 1] || argv[index + 1].startsWith('--')) {
    throw new Error(`${name} is required`)
  }
  return argv[index + 1]
}

async function main(argv) {
  const command = argv[0]
  if (command === 'verify-envelope') {
    const receipt = await verifyQualificationReceiptEnvelope({
      receipt: argument(argv, '--receipt'),
      commitSha: argument(argv, '--commit'),
      treeSha: argument(argv, '--tree'),
    })
    process.stdout.write(`${JSON.stringify(receipt)}\n`)
    return
  }
  const common = {
    commitSha: argument(argv, '--commit'),
    treeSha: argument(argv, '--tree'),
    packageFile: argument(argv, '--package'),
    registryFile: argument(argv, '--registry'),
    catalogFile: argument(argv, '--catalog'),
  }
  if (command === 'create') {
    const receipt = await createQualificationReceipt({
      ...common,
      browserShards: [1, 2, 3, 4].map((index) => ({ index, total: 4, state: 'passed' })),
      toolchain: {
        node: argument(argv, '--node'),
        pnpm: argument(argv, '--pnpm'),
        playwright: argument(argv, '--playwright'),
      },
      qualifiedAt: argument(argv, '--qualified-at'),
    })
    await writeFile(argument(argv, '--output'), `${JSON.stringify(receipt, null, 2)}\n`)
    return
  }
  if (command === 'verify') {
    const receipt = await verifyQualificationReceipt({
      ...common,
      receipt: argument(argv, '--receipt'),
    })
    process.stdout.write(`${JSON.stringify(receipt)}\n`)
    return
  }
  throw new Error('usage: qualification-receipt.mjs create|verify ...')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'receipt failed'}\n`)
    process.exitCode = 1
  })
}
