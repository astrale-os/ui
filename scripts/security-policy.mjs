import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const require = createRequire(new URL('../packages/ui/package.json', import.meta.url))
const productionDependencies = [
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
]
const licenses = new Map()
for (const dependency of productionDependencies) {
  let directory = path.dirname(require.resolve(dependency))
  while (!existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory)
    assert.notEqual(parent, directory, `could not locate ${dependency} package manifest`)
    directory = parent
  }
  const dependencyManifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
  assert.ok(
    dependencyManifest.license === 'MIT' || dependencyManifest.license === 'Apache-2.0',
    `${dependency}@${dependencyManifest.version} has unapproved license ${dependencyManifest.license}`,
  )
  licenses.set(dependency, dependencyManifest.license)
}

const tracked = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
assert.equal(tracked.status, 0, tracked.stderr)
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/u,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/u,
  /\bnpm_[A-Za-z0-9]{30,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
]
const findings = []
for (const file of tracked.stdout.split('\0').filter(Boolean)) {
  const source = await readFile(file, 'utf8').catch(() => undefined)
  if (source === undefined || source.includes('\0')) continue
  for (const pattern of secretPatterns) {
    if (pattern.test(source)) findings.push(`${file}: ${pattern.source}`)
  }
}
assert.deepEqual(findings, [], 'tracked source contains a credential-shaped value')

process.stdout.write(
  `PASS security policy (${licenses.size} direct production packages, ${tracked.stdout.split('\0').filter(Boolean).length} tracked files)\n`,
)
