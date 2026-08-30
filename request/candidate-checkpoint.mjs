#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const shaPattern = /^[0-9a-f]{40}$/u
const digestPattern = /^[0-9a-f]{64}$/u
const maximumPatchBytes = 16 * 1024 * 1024

function exactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).toSorted().join(',') === [...keys].toSorted().join(',')
  )
}

function admittedDigest(value) {
  return (
    exactKeys(value, ['path', 'sha256', 'bytes']) &&
    typeof value.path === 'string' &&
    value.path.length > 0 &&
    value.path.length <= 255 &&
    digestPattern.test(value.sha256) &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes > 0 &&
    value.bytes <= maximumPatchBytes
  )
}

function admittedCheckpoint(value) {
  const topKeys = [
    'version',
    'request',
    'issue',
    'attempt',
    'objectiveSha256',
    'baseSha',
    'patch',
    'sourceEvidence',
    'worker',
    'qualification',
    'timestamps',
  ]
  const qualificationKeys = [
    'state',
    'plan',
    ...(value?.qualification?.diagnostic === undefined ? [] : ['diagnostic']),
  ]
  return (
    exactKeys(value, topKeys) &&
    value.version === 1 &&
    /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/[1-9][0-9]*$/u.test(value.request) &&
    Number.isSafeInteger(value.issue) &&
    value.issue > 0 &&
    Number(value.request.slice(value.request.lastIndexOf('/') + 1)) === value.issue &&
    typeof value.attempt === 'string' &&
    value.attempt.length > 0 &&
    value.attempt.length <= 255 &&
    digestPattern.test(value.objectiveSha256) &&
    shaPattern.test(value.baseSha) &&
    admittedDigest(value.patch) &&
    (value.sourceEvidence === null || admittedDigest(value.sourceEvidence)) &&
    exactKeys(value.worker, ['provider', 'model', 'reasoningEffort', 'escalation']) &&
    typeof value.worker.provider === 'string' &&
    value.worker.provider.length > 0 &&
    typeof value.worker.model === 'string' &&
    value.worker.model.length > 0 &&
    ['none', 'low', 'medium', 'high', 'xhigh', 'max'].includes(value.worker.reasoningEffort) &&
    [0, 1].includes(value.worker.escalation) &&
    exactKeys(value.qualification, qualificationKeys) &&
    ['pending', 'passed', 'failed'].includes(value.qualification.state) &&
    ['docs-only', 'request-tooling', 'family-scoped', 'global-ui'].includes(
      value.qualification.plan,
    ) &&
    (value.qualification.diagnostic === undefined ||
      (typeof value.qualification.diagnostic === 'string' &&
        value.qualification.diagnostic.length <= 8192)) &&
    exactKeys(value.timestamps, ['createdAt', 'updatedAt', 'expiresAt']) &&
    ['createdAt', 'updatedAt', 'expiresAt'].every(
      (key) =>
        typeof value.timestamps[key] === 'string' &&
        Number.isFinite(Date.parse(value.timestamps[key])),
    )
  )
}

function argument(argv, name, fallback) {
  const index = argv.indexOf(name)
  if (index === -1) return fallback
  if (argv.indexOf(name, index + 1) !== -1) throw new Error(`${name} may appear only once`)
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function required(argv, name) {
  const value = argument(argv, name)
  if (!value) throw new Error(`${name} is required`)
  return value
}

function safeRelativeFile(value, name) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.includes('\\') ||
    value.split('/').some((part) => part === '' || part === '.' || part === '..')
  ) {
    throw new Error(`${name} must be a safe relative file path`)
  }
  return value
}

async function digestFile(root, relative, maximum = maximumPatchBytes) {
  const admitted = safeRelativeFile(relative, 'checkpoint file')
  const absolute = path.resolve(root, admitted)
  const rootPrefix = `${path.resolve(root)}${path.sep}`
  if (!absolute.startsWith(rootPrefix)) throw new Error('checkpoint file escapes its root')
  const details = await stat(absolute)
  if (!details.isFile() || details.size < 1 || details.size > maximum) {
    throw new Error('checkpoint file size is outside the admitted boundary')
  }
  const bytes = await readFile(absolute)
  return {
    path: admitted,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.byteLength,
  }
}

function acceptTimestamp(value, name) {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${name} must be a canonical UTC timestamp`)
  }
  return value
}

export async function createCandidateCheckpoint(options) {
  if (!/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/[1-9][0-9]*$/u.test(options.request)) {
    throw new Error('request must be a canonical GitHub issue URL')
  }
  const issue = Number(options.request.slice(options.request.lastIndexOf('/') + 1))
  if (!Number.isSafeInteger(issue)) throw new Error('request issue is invalid')
  if (!digestPattern.test(options.objectiveSha256)) throw new Error('objective digest is invalid')
  if (!shaPattern.test(options.baseSha)) throw new Error('base SHA is invalid')
  if (!['none', 'low', 'medium', 'high', 'xhigh', 'max'].includes(options.reasoningEffort)) {
    throw new Error('reasoning effort is invalid')
  }
  if (![0, 1].includes(options.escalation)) throw new Error('escalation must be zero or one')
  if (!['pending', 'passed', 'failed'].includes(options.qualificationState)) {
    throw new Error('qualification state is invalid')
  }
  if (!['docs-only', 'request-tooling', 'family-scoped', 'global-ui'].includes(options.plan)) {
    throw new Error('qualification plan is invalid')
  }
  const createdAt = acceptTimestamp(options.createdAt, 'createdAt')
  const updatedAt = acceptTimestamp(options.updatedAt ?? createdAt, 'updatedAt')
  const expiresAt = acceptTimestamp(options.expiresAt, 'expiresAt')
  if (
    Date.parse(updatedAt) < Date.parse(createdAt) ||
    Date.parse(expiresAt) <= Date.parse(updatedAt)
  ) {
    throw new Error('checkpoint timestamps are not monotonic')
  }
  return {
    version: 1,
    request: options.request,
    issue,
    attempt: options.attempt,
    objectiveSha256: options.objectiveSha256,
    baseSha: options.baseSha,
    patch: await digestFile(options.root, options.patch),
    sourceEvidence: options.sourceEvidence
      ? await digestFile(options.root, options.sourceEvidence)
      : null,
    worker: {
      provider: options.provider,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      escalation: options.escalation,
    },
    qualification: {
      state: options.qualificationState,
      plan: options.plan,
      ...(options.diagnostic ? { diagnostic: options.diagnostic.slice(0, 8192) } : {}),
    },
    timestamps: { createdAt, updatedAt, expiresAt },
  }
}

export async function verifyCandidateCheckpoint(options) {
  const manifest = JSON.parse(await readFile(options.manifest, 'utf8'))
  if (!admittedCheckpoint(manifest)) throw new Error('checkpoint schema admission failed')
  if (options.request && manifest.request !== options.request) {
    throw new Error('checkpoint request does not match the admitted request')
  }
  if (options.objectiveSha256 && manifest.objectiveSha256 !== options.objectiveSha256) {
    throw new Error('checkpoint objective does not match the admitted request')
  }
  if (manifest.baseSha !== options.baseSha) throw new Error('checkpoint base does not match')
  if (Date.parse(manifest.timestamps?.expiresAt) <= options.now.getTime()) {
    throw new Error('checkpoint expired; operator input is required')
  }
  const patch = await digestFile(options.root, manifest.patch.path)
  if (patch.sha256 !== manifest.patch.sha256 || patch.bytes !== manifest.patch.bytes) {
    throw new Error('checkpoint patch digest mismatch')
  }
  if (manifest.sourceEvidence) {
    const source = await digestFile(options.root, manifest.sourceEvidence.path)
    if (
      source.sha256 !== manifest.sourceEvidence.sha256 ||
      source.bytes !== manifest.sourceEvidence.bytes
    ) {
      throw new Error('checkpoint source evidence digest mismatch')
    }
  }
  return manifest
}

async function main(argv) {
  const command = argv[0]
  if (command === 'create') {
    const root = path.resolve(required(argv, '--root'))
    const createdAt = required(argv, '--created-at')
    const checkpoint = await createCandidateCheckpoint({
      root,
      request: required(argv, '--request'),
      attempt: required(argv, '--attempt'),
      objectiveSha256: required(argv, '--objective-sha256'),
      baseSha: required(argv, '--base-sha'),
      patch: required(argv, '--patch'),
      sourceEvidence: argument(argv, '--source-evidence'),
      provider: required(argv, '--provider'),
      model: required(argv, '--model'),
      reasoningEffort: required(argv, '--reasoning-effort'),
      escalation: Number(argument(argv, '--escalation', '0')),
      qualificationState: argument(argv, '--qualification-state', 'pending'),
      plan: argument(argv, '--plan', 'global-ui'),
      diagnostic: argument(argv, '--diagnostic'),
      createdAt,
      updatedAt: argument(argv, '--updated-at', createdAt),
      expiresAt: required(argv, '--expires-at'),
    })
    await writeFile(required(argv, '--output'), `${JSON.stringify(checkpoint, null, 2)}\n`)
    return
  }
  if (command === 'verify') {
    const checkpoint = await verifyCandidateCheckpoint({
      manifest: required(argv, '--manifest'),
      root: required(argv, '--root'),
      request: required(argv, '--request'),
      objectiveSha256: argument(argv, '--objective-sha256'),
      baseSha: required(argv, '--base-sha'),
      now: new Date(argument(argv, '--now', new Date().toISOString())),
    })
    process.stdout.write(`${JSON.stringify(checkpoint)}\n`)
    return
  }
  throw new Error('usage: candidate-checkpoint.mjs create|verify ...')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'checkpoint failed'}\n`)
    process.exitCode = 1
  })
}
