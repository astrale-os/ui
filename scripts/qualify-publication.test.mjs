import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  admitNpmLock,
  admitPnpmLock,
  admitProvenance,
  admitPublication,
  cleanRegistryEnvironment,
  consumerInstallCommand,
  consumerManagers,
  main,
  parseDistTags,
  releaseTag,
} from './qualify-publication.mjs'

const version = '0.3.0-beta.1'
const integrity = 'sha512-qualified'
const sha = 'a'.repeat(40)
const expected = {
  name: '@astrale-os/ui',
  version,
  license: 'MIT',
  integrity,
  sha,
}

function metadata(overrides = {}) {
  return {
    name: expected.name,
    version,
    license: expected.license,
    repository: { type: 'git', url: 'git+https://github.com/astrale-os/ui.git' },
    dist: {
      integrity,
      tarball: `https://registry.npmjs.org/@astrale-os/ui/-/ui-${version}.tgz`,
      attestations: { provenance: { predicateType: 'https://slsa.dev/provenance/v1' } },
    },
    ...overrides,
  }
}

function provenanceAudit(overrides = {}) {
  const statement = {
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            repository: 'https://github.com/astrale-os/ui',
            path: '.github/workflows/publish.yml',
            ref: `refs/tags/v${version}`,
          },
        },
        resolvedDependencies: [{ digest: { gitCommit: sha } }],
      },
    },
  }
  return {
    invalid: [],
    missing: [],
    verified: [
      {
        name: expected.name,
        version,
        registry: 'https://registry.npmjs.org/',
        attestations: { provenance: { predicateType: 'https://slsa.dev/provenance/v1' } },
        attestationBundles: [
          {
            predicateType: 'https://slsa.dev/provenance/v1',
            bundle: {
              dsseEnvelope: { payload: Buffer.from(JSON.stringify(statement)).toString('base64') },
            },
          },
        ],
        ...overrides,
      },
    ],
  }
}

test('admits only the locked beta release channel', () => {
  assert.equal(releaseTag('0.3.0-beta.4'), 'beta')
  for (const rejected of ['1.0.0-rc.2', '1.0.0-preview.1', '1.0.0-1', '1.0.0', 'beta.1']) {
    assert.throws(() => releaseTag(rejected), /only beta releases are admitted/u)
  }
})

test('admits exact npm identity, tarball origin, and provenance metadata', () => {
  admitPublication(metadata(), expected)
  for (const rejected of [
    metadata({ repository: 'https://evilgithub.com/astrale-os/ui' }),
    metadata({ repository: 'https://github.com/astrale-os/other' }),
    metadata({ dist: { ...metadata().dist, integrity: 'sha512-other' } }),
    metadata({
      dist: {
        ...metadata().dist,
        tarball: `https://npm.pkg.github.com/download/@astrale-os/ui/${version}/archive`,
      },
    }),
    metadata({ dist: { ...metadata().dist, attestations: undefined } }),
  ]) {
    assert.throws(() => admitPublication(rejected, expected))
  }
})

test('scrubs registry credentials and constructs both anonymous public installers', () => {
  assert.deepEqual(consumerManagers, ['pnpm', 'npm'])
  const environment = cleanRegistryEnvironment(
    {
      PATH: '/bin',
      NPM_TOKEN: 'secret',
      NODE_AUTH_TOKEN: 'secret',
      npm_config_registry: 'https://private.example',
      PNPM_HOME: '/private/store',
    },
    '/tmp/npmrc',
    '/tmp/cache',
  )
  assert.deepEqual(environment, {
    PATH: '/bin',
    NPM_CONFIG_USERCONFIG: '/tmp/npmrc',
    NPM_CONFIG_CACHE: '/tmp/cache',
    NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/',
  })
  const specifier = `${expected.name}@${version}`
  const npm = consumerInstallCommand('npm', specifier, '/tmp/store')
  const pnpm = consumerInstallCommand('pnpm', specifier, '/tmp/store')
  assert.equal(npm.file, 'npm')
  assert.ok(npm.args.includes('--registry=https://registry.npmjs.org'))
  assert.ok(npm.args.includes(specifier))
  assert.equal(pnpm.file, 'pnpm')
  assert.deepEqual(
    pnpm.args.slice(pnpm.args.indexOf('--store-dir'), pnpm.args.indexOf('--store-dir') + 2),
    ['--store-dir', '/tmp/store'],
  )
  assert.ok(pnpm.args.includes('--registry=https://registry.npmjs.org'))
  assert.ok(pnpm.args.includes(specifier))
})

test('admits exact public npm and pnpm locks and rejects alternate sources', () => {
  admitNpmLock(
    {
      packages: {
        'node_modules/@astrale-os/ui': {
          version,
          integrity,
          resolved: `https://registry.npmjs.org/@astrale-os/ui/-/ui-${version}.tgz`,
        },
      },
    },
    expected,
  )
  assert.throws(
    () =>
      admitNpmLock(
        { packages: { 'node_modules/@astrale-os/ui': { version, integrity, resolved: 'file:x' } } },
        expected,
      ),
    /file:x/u,
  )
  admitPnpmLock(
    `packages:\n  '@astrale-os/ui@${version}':\n    resolution: {integrity: ${integrity}}\n`,
    expected,
  )
  assert.throws(
    () =>
      admitPnpmLock(
        `packages:\n  '@astrale-os/ui@${version}':\n    resolution: {tarball: file:x}\n`,
        expected,
      ),
    /integrity/u,
  )
  assert.throws(
    () =>
      admitPnpmLock(
        `packages:\n  '@astrale-os/ui@${version}':\n    resolution: {integrity: ${integrity}, tarball: https://npm.pkg.github.com/x}\n`,
        expected,
      ),
    /tarball/u,
  )
  assert.throws(
    () =>
      admitPnpmLock(
        `packages:\n  '@astrale-os/ui@${version}':\n    resolution: {tarball: https://evil.example/ui.tgz}\n  'other@1.0.0':\n    resolution: {integrity: ${integrity}}\n`,
        expected,
      ),
    /UI lock integrity/u,
  )
})

test('admits a verified SLSA bundle bound to the UI tag, workflow, and commit', () => {
  assert.deepEqual(admitProvenance(provenanceAudit(), expected), {
    predicateType: 'https://slsa.dev/provenance/v1',
    repository: 'https://github.com/astrale-os/ui',
    workflow: '.github/workflows/publish.yml',
    ref: `refs/tags/v${version}`,
  })
  assert.throws(
    () => admitProvenance(provenanceAudit({ registry: 'https://npm.pkg.github.com/' }), expected),
    /npm\.pkg\.github/u,
  )
  const wrongSha = provenanceAudit()
  const payload = JSON.parse(
    Buffer.from(wrongSha.verified[0].attestationBundles[0].bundle.dsseEnvelope.payload, 'base64'),
  )
  payload.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'b'.repeat(40)
  wrongSha.verified[0].attestationBundles[0].bundle.dsseEnvelope.payload = Buffer.from(
    JSON.stringify(payload),
  ).toString('base64')
  assert.throws(() => admitProvenance(wrongSha, expected), /released commit/u)
})

test('parses exact npm dist-tag observations', () => {
  assert.deepEqual(parseDistTags('beta: 0.3.0-beta.1\nlatest: 0.2.1\n'), {
    beta: '0.3.0-beta.1',
    latest: '0.2.1',
  })
  assert.throws(() => parseDistTags('not-a-tag-line'), /invalid npm dist-tag line/u)
})

test('orchestrates exact metadata, tag, both consumers, provenance, and retained report', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-publication-test-'))
  const tarballContent = Buffer.from('qualified Astrale UI tarball')
  const exactIntegrity = 'sha512-' + createHash('sha512').update(tarballContent).digest('base64')
  const calls = []
  const admissionCalls = { publication: 0, npmLock: 0, pnpmLock: 0, provenance: 0 }
  const admissions = {
    publication(value, admittedExpected) {
      admissionCalls.publication += 1
      return admitPublication(value, admittedExpected)
    },
    npmLock(value, admittedExpected) {
      admissionCalls.npmLock += 1
      return admitNpmLock(value, admittedExpected)
    },
    pnpmLock(value, admittedExpected) {
      admissionCalls.pnpmLock += 1
      return admitPnpmLock(value, admittedExpected)
    },
    provenance(value, admittedExpected) {
      admissionCalls.provenance += 1
      return admitProvenance(value, admittedExpected)
    },
  }

  try {
    await mkdir(path.join(root, 'packages/ui'), { recursive: true })
    await mkdir(path.join(root, 'artifacts/package'), { recursive: true })
    await writeFile(
      path.join(root, 'packages/ui/package.json'),
      `${JSON.stringify({ name: expected.name, version, license: expected.license })}\n`,
    )
    await writeFile(
      path.join(root, `artifacts/package/astrale-os-ui-${version}.tgz`),
      tarballContent,
    )

    const runCommand = (file, args, cwd, userConfig) => {
      calls.push({ file, args, cwd, userConfig })
      if (file === 'npm' && args[0] === 'view') {
        return JSON.stringify(metadata({ dist: { ...metadata().dist, integrity: exactIntegrity } }))
      }
      if (file === 'npm' && args[0] === 'dist-tag') return `beta: ${version}`
      if ((file === 'npm' && args[0] === 'install') || (file === 'pnpm' && args[0] === 'add')) {
        const packageDirectory = path.join(cwd, 'node_modules/@astrale-os/ui')
        mkdirSync(packageDirectory, { recursive: true })
        writeFileSync(
          path.join(packageDirectory, 'package.json'),
          JSON.stringify({ name: expected.name, version }),
        )
        if (file === 'npm') {
          writeFileSync(
            path.join(cwd, 'package-lock.json'),
            JSON.stringify({
              packages: {
                'node_modules/@astrale-os/ui': {
                  version,
                  integrity: exactIntegrity,
                  resolved: `https://registry.npmjs.org/@astrale-os/ui/-/ui-${version}.tgz`,
                },
              },
            }),
          )
        } else {
          writeFileSync(
            path.join(cwd, 'pnpm-lock.yaml'),
            `packages:\n  '@astrale-os/ui@${version}':\n    resolution: {integrity: ${exactIntegrity}}\n`,
          )
        }
        return ''
      }
      if (file === 'node') return ''
      if (file === 'npm' && args[0] === 'audit') return JSON.stringify(provenanceAudit())
      throw new Error(`unexpected command: ${file} ${args.join(' ')}`)
    }

    await main({
      root,
      environment: { EXPECTED_SHA: sha },
      runCommand,
      reportOutput: () => {},
      admissions,
    })
    assert.equal(calls.filter(({ file, args }) => file === 'npm' && args[0] === 'view').length, 1)
    assert.equal(
      calls.filter(({ file, args }) => file === 'npm' && args[0] === 'dist-tag').length,
      1,
    )
    assert.equal(calls.filter(({ file, args }) => file === 'pnpm' && args[0] === 'add').length, 1)
    assert.equal(
      calls.filter(({ file, args }) => file === 'npm' && args[0] === 'install').length,
      1,
    )
    assert.equal(calls.filter(({ file, args }) => file === 'npm' && args[0] === 'audit').length, 1)
    const specifier = `${expected.name}@${version}`
    const npmInstall = calls.find(({ file, args }) => file === 'npm' && args[0] === 'install')
    const pnpmInstall = calls.find(({ file, args }) => file === 'pnpm' && args[0] === 'add')
    const temporaryRoot = path.dirname(npmInstall.cwd)
    assert.equal(path.basename(npmInstall.cwd), 'npm-consumer')
    assert.equal(pnpmInstall.cwd, path.join(temporaryRoot, 'pnpm-consumer'))
    assert.deepEqual(npmInstall.args, consumerInstallCommand('npm', specifier, '').args)
    const storeDirectory = pnpmInstall.args[pnpmInstall.args.indexOf('--store-dir') + 1]
    assert.equal(storeDirectory, path.join(temporaryRoot, 'pnpm-store'))
    assert.deepEqual(
      pnpmInstall.args,
      consumerInstallCommand('pnpm', specifier, storeDirectory).args,
    )
    assert.deepEqual(calls.find(({ file, args }) => file === 'npm' && args[0] === 'audit').args, [
      'audit',
      'signatures',
      '--json',
      '--include-attestations',
    ])
    const nodeCalls = calls.filter(({ file }) => file === 'node')
    assert.equal(nodeCalls.length, 2)
    for (const call of nodeCalls) {
      assert.deepEqual(call.args.slice(0, 2), ['--input-type=module', '--eval'])
      assert.match(call.args[2], /@astrale-os\/ui\/button/u)
      assert.match(call.args[2], /@astrale-os\/ui\/theme\.css/u)
      assert.match(call.args[2], /@astrale-os\/ui\/presets\/astrale\.css/u)
    }
    const userConfigs = new Set(calls.map(({ userConfig }) => userConfig))
    assert.equal(userConfigs.size, 1)
    assert.equal([...userConfigs][0], path.join(temporaryRoot, 'npmrc'))
    assert.deepEqual(admissionCalls, { publication: 1, npmLock: 1, pnpmLock: 1, provenance: 1 })
    const report = JSON.parse(
      await readFile(path.join(root, 'artifacts/publication/qualification.json'), 'utf8'),
    )
    assert.deepEqual(report.consumers, ['pnpm', 'npm'])
    assert.equal(report.sourceSha, sha)
    assert.equal(report.integrity, exactIntegrity)
    assert.equal(report.provenance.workflow, '.github/workflows/publish.yml')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
