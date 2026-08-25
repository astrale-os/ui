import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const configSha = '2e1bc75459014f38323b57213949b9f9dd530054'

test('pins supported CI and release workflow dependencies', async () => {
  const [ci, release, publish] = await Promise.all(
    ['ci', 'release', 'publish'].map((name) => readFile(`.github/workflows/${name}.yml`, 'utf8')),
  )
  for (const workflow of [ci, release, publish]) {
    const actionReferences = [...workflow.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gmu)].map(
      (match) => match[1],
    )
    assert.ok(actionReferences.length > 0)
    for (const reference of actionReferences) {
      assert.match(reference, /^(?:\.\/|[^@\s]+@[0-9a-f]{40})$/u)
    }
    assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|secrets\.[A-Z_]*TOKEN/u)
  }
  const configRefs = [
    ...[ci, release, publish].join('\n').matchAll(/astrale-os\/config\/.+@([0-9a-f]{40})/gu),
  ]
  assert.ok(configRefs.length > 0)
  assert.deepEqual([...new Set(configRefs.map((match) => match[1]))], [configSha])
  assert.match(ci, /matrix:\s*\n\s+node-version:\s*\[24, 26\]/u)
  assert.match(ci, /frozen-lockfile: 'true'/u)
  assert.match(ci, /pnpm package:qualify/u)
  assert.match(ci, /pnpm catalog:test/u)
})

test('publishes exactly one public npm package from an admitted tag using OIDC', async () => {
  const publish = await readFile('.github/workflows/publish.yml', 'utf8')
  const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
  const releaseConfig = JSON.parse(await readFile('.release-please-config.json', 'utf8'))
  const releaseManifest = JSON.parse(await readFile('.release-please-manifest.json', 'utf8'))

  assert.match(publish, /tags:\s*\['v\*'\]/u)
  assert.doesNotMatch(publish, /workflow_dispatch/u)
  assert.match(publish, /id-token:\s*write/u)
  assert.match(publish, /environment:\s*npm/u)
  assert.match(publish, /git rev-parse/u)
  assert.match(publish, /tarball="artifacts\/package\/astrale-os-ui-/u)
  assert.match(publish, /npm publish "\$tarball" --access public --provenance/u)
  assert.doesNotMatch(publish, /working-directory:\s*packages\/ui/u)
  assert.deepEqual(Object.keys(releaseConfig.packages), ['packages/ui'])
  assert.deepEqual(Object.keys(releaseManifest), ['packages/ui'])
  assert.equal(manifest.name, '@astrale-os/ui')
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org')
  assert.equal(manifest.publishConfig.access, 'public')
})

test('removes all legacy publishable package manifests', async () => {
  for (const directory of ['constants', 'utils', 'styles', 'preset', 'components', 'ui']) {
    assert.equal(
      await access(`${directory}/package.json`).then(
        () => true,
        () => false,
      ),
      false,
    )
  }
})

test('tracks the strict lock policy and pinned repository toolchain', async () => {
  const [workspace, lock, root] = await Promise.all([
    readFile('pnpm-workspace.yaml', 'utf8'),
    readFile('pnpm-lock.yaml', 'utf8'),
    readFile('package.json', 'utf8').then(JSON.parse),
  ])
  assert.match(workspace, /^linkWorkspacePackages: true$/mu)
  assert.match(workspace, /^minimumReleaseAge: 10080$/mu)
  assert.match(workspace, /^minimumReleaseAgeStrict: true$/mu)
  assert.match(workspace, /^minimumReleaseAgeIgnoreMissingTime: false$/mu)
  assert.match(workspace, /^trustLockfile: false$/mu)
  assert.doesNotMatch(workspace, /^overrides:/mu)
  assert.match(lock, /^lockfileVersion:/mu)
  assert.equal(root.devDependencies.oxfmt, '0.63.0')
  assert.equal(root.devDependencies.oxlint, '1.78.0')
})
