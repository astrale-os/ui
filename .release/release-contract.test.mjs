import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { access, readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { parse as parseYaml } from 'yaml'

const configSha = '8e2e2abd0320be0c2f64033916519ab3b66c7dd7'

test('keeps CI and release qualification on the supported contract', async () => {
  const [ci, release, publish, mergeReady] = await Promise.all(
    ['ci', 'release', 'publish', 'merge-ready'].map((name) =>
      readFile(`.github/workflows/${name}.yml`, 'utf8'),
    ),
  )
  assert.match(ci, /matrix:\s*\n\s+node-version:\s*\[24, 26\]/u)
  assert.match(ci, /frozen-lockfile: 'true'/u)
  assert.match(ci, /pnpm package:qualify/u)
  assert.match(ci, /pnpm search:benchmark/u)
  assert.match(ci, /pnpm registry:qualify/u)
  assert.match(ci, /pnpm test:registry-behavior/u)
  assert.match(ci, /pnpm test:playground-unit/u)
  assert.match(mergeReady, /playwright test --shard=\$\{\{ matrix\.shard \}\}\/4/u)
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
    /dependency-review:\s*\n\s+needs: plan\s*\n\s+if: github\.event_name == 'pull_request' && github\.event\.repository\.private == false/u,
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

test('publishes only the runtime while the control-plane Domain stays private', async () => {
  const [release, publish] = await Promise.all([
    readFile('.github/workflows/release.yml', 'utf8'),
    readFile('.github/workflows/publish.yml', 'utf8'),
  ])
  const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
  const domainManifest = JSON.parse(await readFile('domain/package.json', 'utf8'))
  const rootManifest = JSON.parse(await readFile('package.json', 'utf8'))
  const releaseConfig = JSON.parse(await readFile('.release-please-config.json', 'utf8'))
  const releaseManifest = JSON.parse(await readFile('.release-please-manifest.json', 'utf8'))
  const releaseDocument = parseYaml(release)
  const publishDocument = parseYaml(publish)
  const workflowFiles = (await readdir('.github/workflows'))
    .filter((file) => /\.ya?ml$/u.test(file))
    .toSorted()
  const workflowEntries = await Promise.all(
    workflowFiles.map(async (file) => {
      const source = await readFile(`.github/workflows/${file}`, 'utf8')
      return { file, source, document: parseYaml(source) }
    }),
  )
  const workflowCorpus = workflowEntries
    .map(({ file, source }) => `# ${file}\n${source}`)
    .join('\n')
  const workflowSteps = workflowEntries.flatMap(({ file, document }) =>
    Object.entries(document.jobs ?? {}).flatMap(([job, definition]) =>
      (definition.steps ?? []).map((step) => ({ file, job, step })),
    ),
  )
  assert.deepEqual(
    workflowEntries.flatMap(({ file, document }) =>
      Object.entries(document.jobs ?? {}).flatMap(([job, definition]) =>
        definition.uses ? [{ file, job, uses: definition.uses }] : [],
      ),
    ),
    [
      {
        file: 'ui-request-codex.yml',
        job: 'worker',
        uses: './.github/workflows/ui-request-claude-code.yml',
      },
    ],
  )
  for (const { file, document } of workflowEntries) {
    assert.notEqual(document.permissions, 'write-all', file)
    if (document.permissions && typeof document.permissions === 'object') {
      assert.notEqual(document.permissions['id-token'], 'write', file)
      assert.notEqual(document.permissions.packages, 'write', file)
      assert.notEqual(document.permissions.contents, 'write', file)
    }
    for (const [job, definition] of Object.entries(document.jobs ?? {})) {
      assert.notEqual(definition.permissions, 'write-all', `${file}:${job}`)
    }
  }
  assert.deepEqual(
    [...new Set(workflowSteps.flatMap(({ step }) => (step.uses ? [step.uses] : [])))].toSorted(),
    [
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
      'actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294',
      'actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c',
      'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
      'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
      `astrale-os/config/.github/actions/publish/mirror-npm-to-github@${configSha}`,
      `astrale-os/config/.github/actions/publish/packages@${configSha}`,
      `astrale-os/config/.github/actions/release@${configSha}`,
      `astrale-os/config/.github/actions/setup@${configSha}`,
      'github/codeql-action/analyze@db488ddef3bf6cb639b32c2e9a7c0a7ea8271d28',
      'github/codeql-action/init@db488ddef3bf6cb639b32c2e9a7c0a7ea8271d28',
      'oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6',
      'pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86',
    ],
  )
  assert.doesNotMatch(workflowCorpus, /NPM_TOKEN|NODE_AUTH_TOKEN/u)
  assert.deepEqual(
    workflowEntries.flatMap(({ file, document }) =>
      Object.entries(document.jobs ?? {}).flatMap(([job, definition]) => {
        const contents = definition.permissions?.contents
        const idToken = definition.permissions?.['id-token']
        const packages = definition.permissions?.packages
        return contents === 'write' || idToken === 'write' || packages === 'write'
          ? [{ file, job, contents, idToken, packages }]
          : []
      }),
    ),
    [
      {
        file: 'publish.yml',
        job: 'publish',
        contents: 'read',
        idToken: 'write',
        packages: undefined,
      },
      {
        file: 'publish.yml',
        job: 'mirror',
        contents: 'read',
        idToken: undefined,
        packages: 'write',
      },
      {
        file: 'release.yml',
        job: 'release',
        contents: 'write',
        idToken: undefined,
        packages: undefined,
      },
    ],
  )
  assert.doesNotMatch(workflowCorpus, /@astrale-domains\/ui|domain-v|publish-domain/u)
  assert.deepEqual(
    workflowSteps
      .filter(({ step }) => step.uses?.includes('/actions/release@'))
      .map(({ file, job, step }) => ({ file, job, uses: step.uses, with: step.with })),
    [
      {
        file: 'release.yml',
        job: 'release',
        uses: `astrale-os/config/.github/actions/release@${configSha}`,
        with: { token: '${{ github.token }}' },
      },
    ],
  )
  assert.deepEqual(
    workflowSteps
      .filter(({ step }) => step.uses?.includes('/publish/'))
      .map(({ file, job, step }) => ({
        file,
        job,
        uses: step.uses,
        dirs: step.with?.dirs,
        repository: step.with?.repository,
        mirrorPublicPackages: step.with?.['mirror-public-packages'],
      })),
    [
      {
        file: 'publish.yml',
        job: 'publish',
        uses: `astrale-os/config/.github/actions/publish/packages@${configSha}`,
        dirs: 'packages/ui',
        repository: undefined,
        mirrorPublicPackages: 'false',
      },
      {
        file: 'publish.yml',
        job: 'mirror',
        uses: `astrale-os/config/.github/actions/publish/mirror-npm-to-github@${configSha}`,
        dirs: 'packages/ui',
        repository: 'astrale-os/ui',
        mirrorPublicPackages: undefined,
      },
    ],
  )
  for (const { file, job, step } of workflowSteps) {
    if (typeof step.run !== 'string') continue
    assert.doesNotMatch(
      step.run,
      /\b(?:npm|pnpm|yarn)\b[\s\S]{0,200}\bpublish\b/u,
      `${file}:${job}`,
    )
    assert.doesNotMatch(
      step.run,
      /\b(?:npm|pnpm|yarn)\b[^\n]*(?:\bpkg\b[^\n]*\bprivate\b|\bprivate\b[^\n]*\bpkg\b)/u,
      `${file}:${job}`,
    )
  }

  assert.match(release, /search-contract:[\s\S]*?ref:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(
    release,
    /Admit the exact released UI through the current CLI consumer[\s\S]*?qualification:ui-search/u,
  )
  assert.match(release, /ref:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(release, /PUBLISH_SHA:\s*\$\{\{ github\.sha \}\}/u)
  assert.match(release, /publish_tag="v\$\{publish_version\}"/u)
  assert.match(release, /gh workflow run publish\.yml/u)
  assert.match(release, /-f expected-sha="\$PUBLISH_SHA"/u)
  assert.match(release, /-f expected-version="\$publish_version"/u)
  assert.match(release, /--ref "\$publish_tag"/u)
  assert.match(release, /gh run watch "\$run_id"/u)
  assert.match(
    publish,
    /test "\$\(jq -r \.path <<< "\$run"\)" = '\.github\/workflows\/rebind-qualification-receipt\.yml'/u,
  )
  assert.match(publish, /test "\$\(jq -r \.conclusion <<< "\$run"\)" = success/u)
  assert.match(
    workflowCorpus,
    /rebind-qualification-receipt\.yml[\s\S]*?test "\$\(jq -r \.path <<< "\$run"\)" = '\.github\/workflows\/merge-ready\.yml'/u,
  )
  assert.deepEqual(Object.keys(releaseConfig.packages), ['.'])
  assert.deepEqual(Object.keys(releaseManifest), ['.'])
  assert.equal(releaseConfig['include-component-in-tag'], false)
  assert.equal(releaseConfig.packages['.'].component, 'ui')
  assert.equal(releaseConfig.packages['.']['package-name'], '@astrale-os/ui')
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
  assert.deepEqual(releaseDocument.jobs.release.outputs, {
    created: '${{ steps.release.outputs.releases_created }}',
    releases_created: '${{ steps.release.outputs.releases_created }}',
    prs_created: '${{ steps.release.outputs.prs_created }}',
    release_prs: '${{ steps.release.outputs.prs }}',
  })
  assert.deepEqual(releaseDocument.permissions, { contents: 'read' })
  assert.deepEqual(releaseDocument.jobs.release.permissions, {
    actions: 'write',
    contents: 'write',
    'pull-requests': 'write',
  })
  assert.deepEqual(
    releaseDocument.jobs.release.steps.map((step) => ({
      id: step.id,
      uses: step.uses,
      with: step.with,
    })),
    [
      {
        id: undefined,
        uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
        with: undefined,
      },
      {
        id: 'release',
        uses: `astrale-os/config/.github/actions/release@${configSha}`,
        with: { token: '${{ github.token }}' },
      },
    ],
  )
  assert.equal(releaseDocument.jobs['search-contract'].needs, 'release')
  assert.equal(
    releaseDocument.jobs['search-contract'].if,
    "needs.release.outputs.created == 'true'",
  )
  assert.deepEqual(releaseDocument.jobs.publish.needs, ['release', 'search-contract'])
  assert.equal(releaseDocument.jobs.publish.if, "needs.release.outputs.created == 'true'")
  assert.deepEqual(releaseDocument.jobs.publish.permissions, {
    actions: 'write',
    contents: 'read',
  })
  assert.deepEqual(Object.keys(publishDocument.on), ['workflow_dispatch'])
  assert.deepEqual(Object.keys(publishDocument.on.workflow_dispatch.inputs).toSorted(), [
    'expected-sha',
    'expected-version',
  ])
  for (const input of Object.values(publishDocument.on.workflow_dispatch.inputs)) {
    assert.equal(input.required, true)
    assert.equal(input.type, 'string')
  }
  assert.deepEqual(publishDocument.jobs.publish.permissions, {
    actions: 'read',
    contents: 'read',
    'id-token': 'write',
  })
  assert.deepEqual(publishDocument.jobs.mirror.permissions, {
    contents: 'read',
    packages: 'write',
  })
  const publishSteps = publishDocument.jobs.publish.steps
  const mirrorSteps = publishDocument.jobs.mirror.steps
  const publishPackageStep = publishSteps.find((step) => step.uses?.includes('/publish/packages@'))
  const publicQualificationStep = publishSteps.find(
    (step) => step.name === 'Qualify exact public npm publication',
  )
  const publicationArtifactStep = publishSteps.find(
    (step) => step.with?.name === 'public-npm-publication',
  )
  assert.ok(publishPackageStep)
  assert.ok(publicQualificationStep)
  assert.ok(publicationArtifactStep)
  assert.deepEqual(publishSteps[0].with, {
    ref: '${{ inputs.expected-sha }}',
    'fetch-depth': 0,
    'persist-credentials': 'false',
  })
  assert.deepEqual(publishSteps[1].env, {
    EXPECTED_SHA: '${{ inputs.expected-sha }}',
    EXPECTED_VERSION: '${{ inputs.expected-version }}',
    GH_TOKEN: '${{ github.token }}',
  })
  assert.equal(
    publishSteps[1].run,
    `[[ "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$EXPECTED_VERSION" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+-beta\\.[0-9]+$ ]]
test "$(git rev-parse HEAD)" = "$EXPECTED_SHA"
test "$(node -p "require('./packages/ui/package.json').version")" = "$EXPECTED_VERSION"
test "$(git rev-parse "refs/tags/v\${EXPECTED_VERSION}^{commit}")" = "$EXPECTED_SHA"
git merge-base --is-ancestor "$EXPECTED_SHA" origin/main
test "$(gh api "repos/\${GITHUB_REPOSITORY}/releases/tags/v\${EXPECTED_VERSION}" --jq .tag_name)" = "v\${EXPECTED_VERSION}"
`,
  )
  assert.deepEqual(publishPackageStep.with, {
    dirs: 'packages/ui',
    'mirror-public-packages': 'false',
    'install-command': 'pnpm install --frozen-lockfile',
    'build-command':
      "pnpm build && pnpm registry:build && pnpm package:qualify && node request/qualification-receipt.mjs verify --receipt qualification-receipt.json --commit ${{ inputs.expected-sha }} --tree $(git rev-parse '${{ inputs.expected-sha }}^{tree}') --package $(find artifacts/package -type f -name '*.tgz' -print -quit) --registry registry/registry.json --catalog registry/core-catalog.json",
    'prerelease-tag': 'auto',
  })
  assert.deepEqual(publicQualificationStep.env, { EXPECTED_SHA: '${{ inputs.expected-sha }}' })
  assert.equal(publicQualificationStep.run, 'pnpm qualify:publication')
  assert.equal(publicationArtifactStep.if, 'always()')
  assert.deepEqual(publicationArtifactStep.with, {
    name: 'public-npm-publication',
    path: 'artifacts/publication/**',
  })
  assert.equal(publishDocument.jobs.mirror.needs, 'publish')
  assert.deepEqual(
    mirrorSteps.map((step) => step.uses),
    [
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
      `astrale-os/config/.github/actions/publish/mirror-npm-to-github@${configSha}`,
    ],
  )
  assert.deepEqual(mirrorSteps[0].with, {
    ref: '${{ inputs.expected-sha }}',
    'persist-credentials': 'false',
  })
  assert.deepEqual(mirrorSteps[1].with, {
    dirs: 'packages/ui',
    'github-token': '${{ github.token }}',
    repository: 'astrale-os/ui',
  })
  assert.match(manifest.version, /^\d+\.\d+\.\d+-beta\.\d+$/u)
  assert.equal(rootManifest.version, manifest.version)
  assert.equal(releaseManifest['.'], manifest.version)
  assert.equal(rootManifest.scripts['qualify:publication'], 'node scripts/qualify-publication.mjs')
  assert.equal(manifest.name, '@astrale-os/ui')
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org')
  assert.equal(manifest.publishConfig.access, 'public')
  assert.equal(domainManifest.name, '@astrale-domains/ui')
  assert.equal(domainManifest.private, true)
  assert.equal(domainManifest.repository.url, 'git+https://github.com/astrale-os/ui.git')
  assert.equal(domainManifest.repository.directory, 'domain')
  assert.deepEqual(Object.keys(domainManifest.publishConfig).toSorted(), [
    'exports',
    'imports',
    'main',
    'types',
  ])
  assert.equal(domainManifest.scripts.prepack, undefined)
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
