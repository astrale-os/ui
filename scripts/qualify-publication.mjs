import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

const registry = 'https://registry.npmjs.org'
export const consumerManagers = Object.freeze(['pnpm', 'npm'])

export function releaseTag(version) {
  assert.match(version, /^\d+\.\d+\.\d+-beta\.\d+$/u, 'only beta releases are admitted')
  return 'beta'
}

export function parseDistTags(output) {
  return Object.fromEntries(
    output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(': ')
        assert.ok(separator > 0, `invalid npm dist-tag line: ${line}`)
        return [line.slice(0, separator), line.slice(separator + 2)]
      }),
  )
}

export function admitPublication(metadata, expected) {
  assert.equal(metadata.name, expected.name)
  assert.equal(metadata.version, expected.version)
  assert.equal(metadata.license, expected.license)
  assert.equal(metadata.dist?.integrity, expected.integrity)
  assert.equal(metadata.dist?.tarball, `${registry}/@astrale-os/ui/-/ui-${expected.version}.tgz`)
  assert.equal(
    metadata.dist?.attestations?.provenance?.predicateType,
    'https://slsa.dev/provenance/v1',
  )
  const repositoryValue =
    typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url
  const repository = new URL((repositoryValue ?? '').replace(/^git\+/u, ''))
  assert.equal(repository.protocol, 'https:')
  assert.equal(repository.hostname, 'github.com')
  assert.equal(repository.pathname.replace(/\.git$/u, ''), '/astrale-os/ui')
}

export function cleanRegistryEnvironment(environment, userConfig, cache) {
  const admitted = {}
  for (const [name, value] of Object.entries(environment)) {
    if (/^(?:npm_config_|NPM_|PNPM_|NODE_AUTH_TOKEN$|COREPACK_NPM_TOKEN$)/iu.test(name)) continue
    admitted[name] = value
  }
  return {
    ...admitted,
    NPM_CONFIG_USERCONFIG: userConfig,
    NPM_CONFIG_CACHE: cache,
    NPM_CONFIG_REGISTRY: `${registry}/`,
  }
}

export function consumerInstallCommand(manager, specifier, storeDirectory) {
  const dependencies = [specifier, 'react@19.2.8', 'react-dom@19.2.8']
  if (manager === 'npm') {
    return {
      file: 'npm',
      args: [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--save-exact',
        `--registry=${registry}`,
        ...dependencies,
      ],
    }
  }
  assert.equal(manager, 'pnpm')
  return {
    file: 'pnpm',
    args: [
      'add',
      '--ignore-scripts',
      '--save-exact',
      `--registry=${registry}`,
      '--store-dir',
      storeDirectory,
      ...dependencies,
    ],
  }
}

export function admitNpmLock(lock, expected) {
  const entry = lock.packages?.['node_modules/@astrale-os/ui']
  assert.ok(entry, 'npm lock is missing @astrale-os/ui')
  assert.equal(entry.version, expected.version)
  assert.equal(entry.integrity, expected.integrity)
  assert.equal(entry.resolved, `${registry}/@astrale-os/ui/-/ui-${expected.version}.tgz`)
}

export function admitPnpmLock(lock, expected) {
  const marker = `  '@astrale-os/ui@${expected.version}':`
  const start = lock.indexOf(marker)
  assert.notEqual(start, -1, 'pnpm lock is missing the exact UI package key')
  const remainder = lock.slice(start + marker.length)
  const nextEntry = remainder.search(/\n  '[^']+':/u)
  const entry = nextEntry === -1 ? remainder : remainder.slice(0, nextEntry)
  assert.ok(
    entry.includes(`integrity: ${expected.integrity}`),
    'pnpm UI lock integrity is not exact',
  )
  assert.doesNotMatch(entry, /(?:tarball:|file:|link:|workspace:|npm\.pkg\.github\.com)/u)
}

export function admitProvenance(audit, expected) {
  assert.deepEqual(audit.invalid, [])
  assert.deepEqual(audit.missing, [])
  const verified = audit.verified.find(
    (entry) => entry.name === expected.name && entry.version === expected.version,
  )
  assert.ok(verified, 'npm signature audit did not verify @astrale-os/ui')
  assert.equal(verified.registry, `${registry}/`)
  assert.equal(verified.attestations?.provenance?.predicateType, 'https://slsa.dev/provenance/v1')
  const provenance = verified.attestationBundles?.find(
    (entry) => entry.predicateType === 'https://slsa.dev/provenance/v1',
  )
  assert.ok(provenance, 'npm signature audit omitted the UI provenance bundle')
  const statement = JSON.parse(
    Buffer.from(provenance.bundle.dsseEnvelope.payload, 'base64').toString('utf8'),
  )
  const workflow = statement.predicate?.buildDefinition?.externalParameters?.workflow
  assert.equal(workflow?.repository, 'https://github.com/astrale-os/ui')
  const workflowPath = workflow?.path?.replace(/^\//u, '')
  assert.equal(workflowPath, '.github/workflows/publish.yml')
  assert.equal(workflow?.ref, `refs/tags/v${expected.version}`)
  assert.ok(
    statement.predicate?.buildDefinition?.resolvedDependencies?.some(
      (dependency) => dependency.digest?.gitCommit === expected.sha,
    ),
    'provenance does not bind the released commit',
  )
  return {
    predicateType: provenance.predicateType,
    repository: workflow.repository,
    workflow: workflowPath,
    ref: workflow.ref,
  }
}

function run(file, args, cwd, userConfig) {
  const result = spawnSync(file, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: cleanRegistryEnvironment(process.env, userConfig, path.join(cwd, '.npm-cache')),
  })
  if (result.status !== 0) {
    throw new Error(`${file} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout.trim()
}

export async function observe(label, operation) {
  const attempts = Number(process.env.PUBLICATION_VERIFY_ATTEMPTS ?? 60)
  const delayMilliseconds = Number(process.env.PUBLICATION_VERIFY_DELAY_MS ?? 5_000)
  let failure
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      failure = error
      if (attempt < attempts) await delay(delayMilliseconds)
    }
  }
  throw new Error(`${label} did not become observable`, { cause: failure })
}

async function qualifyConsumer(
  manager,
  directory,
  specifier,
  userConfig,
  expected,
  storeDirectory,
  runCommand,
  admissions,
) {
  await mkdir(directory)
  await writeFile(
    path.join(directory, 'package.json'),
    `${JSON.stringify({ name: `astrale-ui-public-${manager}`, private: true, type: 'module' }, null, 2)}\n`,
  )
  const install = consumerInstallCommand(manager, specifier, storeDirectory)
  runCommand(install.file, install.args, directory, userConfig)
  const installed = JSON.parse(
    await readFile(path.join(directory, 'node_modules/@astrale-os/ui/package.json'), 'utf8'),
  )
  assert.equal(installed.version, expected.version)
  if (manager === 'npm') {
    admissions.npmLock(
      JSON.parse(await readFile(path.join(directory, 'package-lock.json'), 'utf8')),
      expected,
    )
  } else {
    admissions.pnpmLock(await readFile(path.join(directory, 'pnpm-lock.yaml'), 'utf8'), expected)
  }
  runCommand(
    'node',
    [
      '--input-type=module',
      '--eval',
      [
        "const ui = await import('@astrale-os/ui/button')",
        "if (typeof ui.Button !== 'function') throw new Error('Button export missing')",
        "import.meta.resolve('@astrale-os/ui/theme.css')",
        "import.meta.resolve('@astrale-os/ui/presets/astrale.css')",
      ].join(';'),
    ],
    directory,
    userConfig,
  )

  if (manager === 'npm') {
    return observe('npm provenance audit', () => {
      const audit = JSON.parse(
        runCommand(
          'npm',
          ['audit', 'signatures', '--json', '--include-attestations'],
          directory,
          userConfig,
        ),
      )
      return admissions.provenance(audit, expected)
    })
  }
  return undefined
}

export async function main(options = {}) {
  const root = options.root ?? process.cwd()
  const environment = options.environment ?? process.env
  const runCommand = options.runCommand ?? run
  const reportOutput = options.reportOutput ?? ((value) => process.stdout.write(value))
  const admissions = {
    publication: admitPublication,
    npmLock: admitNpmLock,
    pnpmLock: admitPnpmLock,
    provenance: admitProvenance,
    ...options.admissions,
  }
  const manifest = JSON.parse(await readFile(path.join(root, 'packages/ui/package.json'), 'utf8'))
  const expectedSha = environment.EXPECTED_SHA
  assert.match(expectedSha ?? '', /^[0-9a-f]{40}$/u, 'EXPECTED_SHA must be an exact commit')
  const tarball = path.join(root, 'artifacts/package', `astrale-os-ui-${manifest.version}.tgz`)
  const integrity =
    'sha512-' +
    createHash('sha512')
      .update(await readFile(tarball))
      .digest('base64')
  const expected = {
    name: manifest.name,
    version: manifest.version,
    license: manifest.license,
    integrity,
    sha: expectedSha,
  }
  const specifier = `${manifest.name}@${manifest.version}`
  const tag = releaseTag(manifest.version)
  const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-ui-publication-'))
  const userConfig = path.join(temporary, 'npmrc')

  try {
    await writeFile(userConfig, `registry=${registry}/\n@astrale-os:registry=${registry}/\n`)
    const metadata = await observe('exact npm metadata', () => {
      const value = JSON.parse(
        runCommand(
          'npm',
          ['view', specifier, '--json', `--registry=${registry}`],
          temporary,
          userConfig,
        ),
      )
      admissions.publication(value, expected)
      return value
    })
    await observe('npm release-channel tag', () => {
      const tags = parseDistTags(
        runCommand(
          'npm',
          ['dist-tag', 'ls', manifest.name, `--registry=${registry}`],
          temporary,
          userConfig,
        ),
      )
      assert.equal(tags[tag], manifest.version)
      return tags
    })

    let provenance
    for (const manager of consumerManagers) {
      const consumerDirectory = path.join(temporary, `${manager}-consumer`)
      const observation = await observe(`${manager} consumer install`, async () => {
        await rm(consumerDirectory, { recursive: true, force: true })
        return qualifyConsumer(
          manager,
          consumerDirectory,
          specifier,
          userConfig,
          expected,
          path.join(temporary, 'pnpm-store'),
          runCommand,
          admissions,
        )
      })
      if (observation) provenance = observation
    }
    assert.ok(provenance, 'public npm provenance was not qualified')

    const report = {
      package: specifier,
      sourceSha: expectedSha,
      tag,
      integrity: metadata.dist.integrity,
      tarball: metadata.dist.tarball,
      provenance,
      registry,
      consumers: consumerManagers,
    }
    const artifactDirectory = path.join(root, 'artifacts/publication')
    await mkdir(artifactDirectory, { recursive: true })
    await writeFile(
      path.join(artifactDirectory, 'qualification.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    )
    reportOutput(`${JSON.stringify(report, null, 2)}\n`)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined
if (import.meta.url === invoked) await main()
