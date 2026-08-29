import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const configSha = '8e2e2abd0320be0c2f64033916519ab3b66c7dd7'

function parseStableVersion(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.exec(value)
  assert.ok(match, `expected canonical stable version, received ${value}`)
  return match.slice(1).map(Number)
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function workflowJob(workflow, name) {
  const marker = `  ${name}:\n`
  const start = workflow.indexOf(marker)
  assert.notEqual(start, -1, `expected ${name} workflow job`)
  const remainder = workflow.slice(start + marker.length)
  const next = remainder.search(/^  [a-zA-Z0-9_-]+:\n/mu)
  return next === -1 ? workflow.slice(start) : workflow.slice(start, start + marker.length + next)
}

test('pins supported CI and release workflow dependencies', async () => {
  const [ci, release, publish, publishDomain] = await Promise.all(
    ['ci', 'release', 'publish', 'publish-domain'].map((name) =>
      readFile(`.github/workflows/${name}.yml`, 'utf8'),
    ),
  )
  for (const workflow of [ci, release, publish, publishDomain]) {
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
    ...[ci, release, publish, publishDomain]
      .join('\n')
      .matchAll(/astrale-os\/config\/.+@([0-9a-f]{40})/gu),
  ]
  assert.ok(configRefs.length > 0)
  assert.deepEqual([...new Set(configRefs.map((match) => match[1]))], [configSha])
  assert.match(ci, /matrix:\s*\n\s+node-version:\s*\[24, 26\]/u)
  assert.match(ci, /frozen-lockfile: 'true'/u)
  assert.match(ci, /pnpm package:qualify/u)
  assert.match(ci, /pnpm search:benchmark/u)
  assert.match(ci, /pnpm registry:qualify/u)
  assert.match(ci, /pnpm test:registry-behavior/u)
  assert.match(ci, /pnpm playground:test/u)
  assert.match(ci, /pnpm test:security/u)
  assert.match(ci, /pnpm audit --prod --audit-level high/u)
  assert.match(ci, /pnpm --dir domain install --frozen-lockfile/u)
  assert.match(ci, /pnpm --dir domain package/u)
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
  assert.match(release, /repository: astrale-os\/cli/u)
  assert.match(release, /ref: main/u)
  assert.equal(
    [
      ...release.matchAll(
        /uses: pnpm\/action-setup@[0-9a-f]{40}[^\n]*\n\s+with:\s*\n\s+version: 12\.0\.0/gu,
      ),
    ].length,
    2,
  )
  assert.match(
    release,
    /pnpm --dir cli-consumer qualification:ui-search "\$GITHUB_WORKSPACE\/ui-release"/u,
  )
})

test('publishes the runtime and Domain from their exact independent Release Please commits', async () => {
  const [release, publish, publishDomain] = await Promise.all([
    readFile('.github/workflows/release.yml', 'utf8'),
    readFile('.github/workflows/publish.yml', 'utf8'),
    readFile('.github/workflows/publish-domain.yml', 'utf8'),
  ])
  const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
  const domainManifest = JSON.parse(await readFile('domain/package.json', 'utf8'))
  const rootManifest = JSON.parse(await readFile('package.json', 'utf8'))
  const releaseConfig = JSON.parse(await readFile('.release-please-config.json', 'utf8'))
  const releaseManifest = JSON.parse(await readFile('.release-please-manifest.json', 'utf8'))
  const publishJob = workflowJob(release, 'publish')
  const publishDomainJob = workflowJob(release, 'publish-domain')

  assert.match(release, /needs\.release\.outputs\.created == 'true'/u)
  assert.match(release, /paths_released: \$\{\{ steps\.release\.outputs\.paths_released \}\}/u)
  assert.match(release, /contains\(fromJSON\(needs\.release\.outputs\.paths_released\), '\.'\)/u)
  assert.match(
    release,
    /contains\(fromJSON\(needs\.release\.outputs\.paths_released\), 'domain'\)/u,
  )
  assert.match(release, /search-contract:\s*\n\s+needs: release/u)
  assert.match(release, /search-contract:[\s\S]*?ref:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(
    release,
    /Admit the exact released UI through the current CLI consumer[\s\S]*?qualification:ui-search/u,
  )
  assert.match(publishJob, /needs: \[release, search-contract\]/u)
  assert.match(publishJob, /ref:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(publishJob, /PUBLISH_SHA:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(
    publishJob,
    /publish_version="\$\(node -p "require\('\.\/packages\/ui\/package\.json'\)\.version"\)"/u,
  )
  assert.match(publishJob, /publish_tag="v\$\{publish_version\}"/u)
  assert.match(publishJob, /gh workflow run publish\.yml/u)
  assert.match(publishJob, /-f expected-sha="\$PUBLISH_SHA"/u)
  assert.match(publishJob, /-f expected-version="\$publish_version"/u)
  assert.match(publishJob, /--ref "\$publish_tag"/u)
  assert.match(publishJob, /gh run watch "\$run_id"/u)
  assert.match(publishDomainJob, /needs: release/u)
  assert.match(publishDomainJob, /ref:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(publishDomainJob, /PUBLISH_SHA:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(
    publishDomainJob,
    /publish_version="\$\(node -p "require\('\.\/domain\/package\.json'\)\.version"\)"/u,
  )
  assert.match(publishDomainJob, /publish_tag="domain-v\$\{publish_version\}"/u)
  assert.match(publishDomainJob, /gh workflow run publish-domain\.yml/u)
  assert.match(publishDomainJob, /-f expected-sha="\$PUBLISH_SHA"/u)
  assert.match(publishDomainJob, /-f expected-version="\$publish_version"/u)
  assert.match(publishDomainJob, /--ref "\$publish_tag"/u)
  assert.match(publishDomainJob, /gh run watch "\$run_id"/u)
  assert.match(publish, /workflow_dispatch/u)
  assert.doesNotMatch(publish, /push:\s*\n\s+tags:/u)
  assert.match(publish, /id-token:\s*write/u)
  assert.match(publish, /permissions:\s*\n\s+contents:\s*read\s*\n\s+id-token:\s*write/u)
  assert.doesNotMatch(publish, /npm-token:/u)
  assert.match(publish, /environment:\s*npm/u)
  assert.match(publish, /ref:\s*\$\{\{ inputs\.expected-sha \}\}/u)
  assert.match(publish, /fetch-depth:\s*0/u)
  assert.match(publish, /persist-credentials:\s*'false'/u)
  assert.match(publish, /test "\$\(git rev-parse HEAD\)" = "\$EXPECTED_SHA"/u)
  assert.match(
    publish,
    /test "\$\(node -p "require\('\.\/packages\/ui\/package\.json'\)\.version"\)" = "\$EXPECTED_VERSION"/u,
  )
  assert.match(
    publish,
    /test "\$\(git rev-parse "refs\/tags\/v\$\{EXPECTED_VERSION\}\^\{commit\}"\)" = "\$EXPECTED_SHA"/u,
  )
  assert.match(publish, /git merge-base --is-ancestor "\$EXPECTED_SHA" origin\/main/u)
  assert.match(
    publish,
    /test "\$\(gh api "repos\/\$\{GITHUB_REPOSITORY\}\/releases\/tags\/v\$\{EXPECTED_VERSION\}" --jq \.tag_name\)" = "v\$\{EXPECTED_VERSION\}"/u,
  )
  assert.match(publish, /publish\/packages@8e2e2abd0320be0c2f64033916519ab3b66c7dd7/u)
  assert.match(publish, /dirs:\s*packages\/ui/u)
  assert.match(publish, /mirror-public-packages:\s*'false'/u)
  assert.match(
    publish,
    /build-command:\s*pnpm --filter @astrale-os\/ui-playground exec playwright install --with-deps chromium && pnpm qualify/u,
  )
  assert.match(publish, /prerelease-tag:\s*auto/u)
  assert.match(publish, /run:\s*pnpm qualify:publication/u)
  assert.match(publish, /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/u)
  assert.match(publish, /mirror:\s*\n\s+needs:\s*publish/u)
  assert.match(publish, /packages:\s*write/u)
  assert.match(publish, /publish\/mirror-npm-to-github@8e2e2abd0320be0c2f64033916519ab3b66c7dd7/u)
  assert.match(publish, /repository:\s*astrale-os\/ui/u)
  assert.match(publishDomain, /workflow_dispatch/u)
  assert.match(publishDomain, /id-token:\s*write/u)
  assert.doesNotMatch(publishDomain, /(?:npm-token:|NPM_TOKEN|NODE_AUTH_TOKEN|secrets\.)/u)
  assert.match(publishDomain, /environment:\s*npm/u)
  assert.match(publishDomain, /ref:\s*\$\{\{ inputs\.expected-sha \}\}/u)
  assert.match(publishDomain, /test "\$\(git rev-parse HEAD\)" = "\$EXPECTED_SHA"/u)
  assert.match(
    publishDomain,
    /test "\$\(node -p "require\('\.\/domain\/package\.json'\)\.version"\)" = "\$EXPECTED_VERSION"/u,
  )
  assert.match(
    publishDomain,
    /test "\$\(git rev-parse "refs\/tags\/domain-v\$\{EXPECTED_VERSION\}\^\{commit\}"\)" = "\$EXPECTED_SHA"/u,
  )
  assert.match(publishDomain, /git merge-base --is-ancestor "\$EXPECTED_SHA" origin\/main/u)
  assert.match(
    publishDomain,
    /test "\$\(gh api "repos\/\$\{GITHUB_REPOSITORY\}\/releases\/tags\/domain-v\$\{EXPECTED_VERSION\}" --jq \.tag_name\)" = "domain-v\$\{EXPECTED_VERSION\}"/u,
  )
  assert.match(publishDomain, /publish\/packages@8e2e2abd0320be0c2f64033916519ab3b66c7dd7/u)
  assert.match(publishDomain, /dirs:\s*domain/u)
  assert.match(publishDomain, /mirror-public-packages:\s*'false'/u)
  assert.match(publishDomain, /pnpm --dir domain install --frozen-lockfile/u)
  assert.match(publishDomain, /npm dist-tag ls @astrale-domains\/ui/u)
  assert.match(publishDomain, /await import\('@astrale-domains\/ui'\)/u)
  assert.deepEqual(Object.keys(releaseConfig.packages), ['.', 'domain'])
  assert.deepEqual(Object.keys(releaseManifest), ['.', 'domain'])
  assert.equal(releaseConfig.packages['.']['changelog-path'], 'packages/ui/CHANGELOG.md')
  assert.deepEqual(releaseConfig.packages['.']['exclude-paths'], ['.history', '.release', 'domain'])
  assert.deepEqual(releaseConfig.packages['.']['extra-files'], [
    {
      type: 'json',
      path: 'packages/ui/package.json',
      jsonpath: '$.version',
    },
  ])
  assert.equal(releaseConfig.versioning, 'prerelease')
  assert.equal(releaseConfig.prerelease, true)
  assert.equal(releaseConfig['prerelease-type'], 'beta')
  assert.equal(releaseConfig['always-update'], true)
  assert.deepEqual(releaseConfig.packages.domain, {
    component: 'domain',
    'package-name': '@astrale-domains/ui',
    versioning: 'default',
    prerelease: false,
    'include-component-in-tag': true,
    'initial-version': '0.1.0',
  })
  assert.match(manifest.version, /^\d+\.\d+\.\d+-beta\.\d+$/u)
  assert.equal(rootManifest.version, manifest.version)
  assert.equal(releaseManifest['.'], manifest.version)
  assert.equal(releaseManifest.domain, domainManifest.version)
  assert.equal(rootManifest.scripts['qualify:publication'], 'node scripts/qualify-publication.mjs')
  assert.equal(manifest.name, '@astrale-os/ui')
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org')
  assert.equal(manifest.publishConfig.access, 'public')
  assert.equal(domainManifest.name, '@astrale-domains/ui')
  const domainVersion = parseStableVersion(domainManifest.version)
  const initialDomainVersion = parseStableVersion(releaseConfig.packages.domain['initial-version'])
  assert.ok(
    domainManifest.version === '0.0.0' || compareVersions(domainVersion, initialDomainVersion) >= 0,
  )
  assert.equal(domainManifest.repository.url, 'git+https://github.com/astrale-os/ui.git')
  assert.equal(domainManifest.repository.directory, 'domain')
  assert.equal(domainManifest.publishConfig.registry, 'https://registry.npmjs.org/')
  assert.equal(domainManifest.publishConfig.access, 'public')
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
  assert.equal(tarballs.length, 3)
  assert.deepEqual([...new Set(tarballs.map((value) => new URL(value).protocol))], ['https:'])
  assert.deepEqual([...new Set(tarballs.map((value) => new URL(value).hostname))].sort(), [
    'cdn.sheetjs.com',
    'npm.jsr.io',
  ])
  assert.equal(
    tarballs.filter((value) => value === 'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz')
      .length,
    1,
  )
  assert.equal(root.devDependencies.oxfmt, '0.63.0')
  assert.equal(root.devDependencies.oxlint, '1.78.0')
})

test('uses TypeScript 7 with tsc throughout the rebuilt workspace', async () => {
  const manifests = await Promise.all(
    [
      'package.json',
      'packages/ui/package.json',
      'playground/package.json',
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

  const playground = manifests.find(([file]) => file === 'playground/package.json')[1]
  assert.equal(playground.devDependencies?.vite, '8.2.1')
  assert.equal(playground.devDependencies?.['@vitejs/plugin-react'], '6.0.5')
})
