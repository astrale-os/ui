import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const configSha = 'fa8b83b54565ee459f18e8711e006569a33995c2'

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
    assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|secrets\./u)
  }
  const configRefs = [
    ...[ci, release, publish].join('\n').matchAll(/astrale-os\/config\/.+@([0-9a-f]{40})/gu),
  ]
  assert.ok(configRefs.length > 0)
  assert.deepEqual([...new Set(configRefs.map((match) => match[1]))], [configSha])
  assert.match(ci, /matrix:\s*\n\s+node-version:\s*\[24, 26\]/u)
  assert.match(ci, /frozen-lockfile: 'true'/u)
  assert.match(ci, /pnpm package:qualify/u)
  assert.match(ci, /pnpm registry:qualify/u)
  assert.match(ci, /pnpm test:registry-behavior/u)
  assert.match(ci, /pnpm catalog:test/u)
  assert.match(ci, /pnpm test:security/u)
  assert.match(ci, /pnpm audit --prod --audit-level high/u)
  assert.match(
    ci,
    /security:\s*[\s\S]*?permissions:\s*\n\s+actions:\s*read\s*\n\s+contents:\s*read\s*\n\s+security-events:\s*write/u,
  )
  assert.match(
    ci,
    /dependency-review:\s*\n\s+if: github\.event_name == 'pull_request' && github\.event\.repository\.private == false/u,
  )
  assert.match(ci, /actions\/dependency-review-action@[0-9a-f]{40}/u)
  assert.match(ci, /github\/codeql-action\/(?:init|analyze)@[0-9a-f]{40}/u)
  assert.equal(
    [
      ...ci.matchAll(
        /uses: github\/codeql-action\/(?:init|analyze)@[0-9a-f]{40}[^\n]*\n\s+if: github\.event\.repository\.private == false/gu,
      ),
    ].length,
    2,
  )
})

test('publishes exactly one public npm package from the Release Please commit using OIDC', async () => {
  const [release, publish] = await Promise.all([
    readFile('.github/workflows/release.yml', 'utf8'),
    readFile('.github/workflows/publish.yml', 'utf8'),
  ])
  const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
  const rootManifest = JSON.parse(await readFile('package.json', 'utf8'))
  const releaseConfig = JSON.parse(await readFile('.release-please-config.json', 'utf8'))
  const releaseManifest = JSON.parse(await readFile('.release-please-manifest.json', 'utf8'))

  assert.match(release, /needs\.release\.outputs\.created == 'true'/u)
  assert.match(release, /ref:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(release, /PUBLISH_SHA:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(release, /publish_tag="v\$\{publish_version\}"/u)
  assert.match(release, /gh workflow run publish\.yml/u)
  assert.match(release, /-f expected-sha="\$PUBLISH_SHA"/u)
  assert.match(release, /-f expected-version="\$publish_version"/u)
  assert.match(release, /--ref "\$publish_tag"/u)
  assert.match(release, /gh run watch "\$run_id"/u)
  assert.match(publish, /workflow_dispatch/u)
  assert.doesNotMatch(publish, /push:\s*\n\s+tags:/u)
  assert.match(publish, /id-token:\s*write/u)
  assert.match(publish, /permissions:\s*\n\s+contents:\s*read\s*\n\s+id-token:\s*write/u)
  assert.doesNotMatch(publish, /npm-token:/u)
  assert.match(publish, /environment:\s*npm/u)
  assert.match(publish, /ref:\s*\$\{\{ inputs\.expected-sha \}\}/u)
  assert.match(publish, /fetch-depth:\s*0/u)
  assert.match(publish, /persist-credentials:\s*'false'/u)
  assert.match(publish, /git rev-parse/u)
  assert.match(publish, /refs\/tags\/v\$\{EXPECTED_VERSION\}/u)
  assert.match(publish, /git merge-base --is-ancestor/u)
  assert.match(
    publish,
    /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/releases\/tags\/v\$\{EXPECTED_VERSION\}"/u,
  )
  assert.match(publish, /publish\/packages@fa8b83b54565ee459f18e8711e006569a33995c2/u)
  assert.match(publish, /dirs:\s*packages\/ui/u)
  assert.match(publish, /mirror-public-packages:\s*'false'/u)
  assert.match(
    publish,
    /build-command:\s*pnpm --filter @astrale-os\/ui-catalog exec playwright install --with-deps chromium && pnpm qualify/u,
  )
  assert.match(publish, /prerelease-tag:\s*auto/u)
  assert.match(publish, /run:\s*pnpm qualify:publication/u)
  assert.match(publish, /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/u)
  assert.match(publish, /mirror:\s*\n\s+needs:\s*publish/u)
  assert.match(publish, /packages:\s*write/u)
  assert.match(publish, /publish\/mirror-npm-to-github@fa8b83b54565ee459f18e8711e006569a33995c2/u)
  assert.match(publish, /repository:\s*astrale-os\/ui/u)
  assert.deepEqual(Object.keys(releaseConfig.packages), ['packages/ui'])
  assert.deepEqual(Object.keys(releaseManifest), ['packages/ui'])
  assert.equal(releaseConfig.versioning, 'prerelease')
  assert.equal(releaseConfig.prerelease, true)
  assert.equal(releaseConfig['prerelease-type'], 'beta')
  assert.equal(releaseConfig['always-update'], true)
  assert.match(manifest.version, /^\d+\.\d+\.\d+-beta\.\d+$/u)
  assert.equal(rootManifest.scripts['qualify:publication'], 'node scripts/qualify-publication.mjs')
  assert.equal(manifest.name, '@astrale-os/ui')
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org')
  assert.equal(manifest.publishConfig.access, 'public')
})

test('declares one credential-free public registry policy for local package operations', async () => {
  const npmrc = await readFile('.npmrc', 'utf8')
  const configuration = npmrc
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
  assert.deepEqual(configuration, [
    '@jsr:registry=https://npm.jsr.io',
    'registry=https://registry.npmjs.org',
    '@astrale-os:registry=https://registry.npmjs.org',
  ])
  assert.doesNotMatch(npmrc, /(?:npm\.pkg\.github\.com|authToken|always-auth|\$\{)/iu)
  assert.deepEqual(
    execFileSync('git', ['ls-files', '.npmrc', '**/.npmrc'], { encoding: 'utf8' })
      .trim()
      .split('\n'),
    ['.npmrc'],
  )
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
  assert.match(workspace, /^strictPeerDependencies: true$/mu)
  assert.match(workspace, /^minimumReleaseAge: 10080$/mu)
  assert.match(workspace, /^minimumReleaseAgeStrict: true$/mu)
  assert.match(workspace, /^minimumReleaseAgeIgnoreMissingTime: false$/mu)
  assert.match(workspace, /^trustLockfile: false$/mu)
  assert.doesNotMatch(workspace, /^overrides:/mu)
  assert.match(lock, /^lockfileVersion:/mu)
  assert.doesNotMatch(lock, /npm\.pkg\.github\.com/u)
  const locatorValues = [...lock.matchAll(/^\s+(?:specifier|version|tarball):\s+([^\s]+)$/gmu)].map(
    (match) => match[1].replace(/^['"]|['"]$/gu, ''),
  )
  assert.deepEqual(
    locatorValues.filter((value) => value.startsWith('file:')),
    [],
  )
  assert.deepEqual(
    locatorValues.filter((value) => value.startsWith('link:')),
    ['link:../packages/ui', 'link:../packages/ui'],
  )
  const tarballs = [...lock.matchAll(/\btarball: ([^\s},]+)/gu)].map((match) => match[1])
  assert.equal(tarballs.length, 2)
  assert.deepEqual([...new Set(tarballs.map((value) => new URL(value).protocol))], ['https:'])
  assert.deepEqual([...new Set(tarballs.map((value) => new URL(value).hostname))], ['npm.jsr.io'])
  assert.equal(root.devDependencies.oxfmt, '0.63.0')
  assert.equal(root.devDependencies.oxlint, '1.78.0')
})

test('uses TypeScript 7 with tsc throughout the rebuilt workspace', async () => {
  const manifests = await Promise.all(
    [
      'package.json',
      'packages/ui/package.json',
      'catalog/package.json',
      'registry/package.json',
    ].map(async (file) => [file, JSON.parse(await readFile(file, 'utf8'))]),
  )

  for (const [file, manifest] of manifests) {
    assert.equal(manifest.devDependencies?.typescript, '7.0.2', `${file} TypeScript version`)
    assert.equal(
      manifest.devDependencies?.['@typescript/native-preview'],
      undefined,
      `${file} native preview`,
    )
  }

  for (const [file, manifest] of manifests.slice(1)) {
    assert.match(manifest.scripts?.typecheck ?? '', /\btsc\b/u, `${file} typecheck`)
    assert.doesNotMatch(manifest.scripts?.typecheck ?? '', /\btsgo\b/u, `${file} typecheck`)
  }

  const catalog = manifests.find(([file]) => file === 'catalog/package.json')[1]
  assert.equal(catalog.devDependencies?.vite, '8.2.1')
  assert.equal(catalog.devDependencies?.['@vitejs/plugin-react'], '6.0.5')
})
