import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const configSha = '2e1bc75459014f38323b57213949b9f9dd530054'
const packageDirectories = ['constants', 'utils', 'styles', 'preset', 'components', 'ui']

test('pins frozen CI and release workflows to the qualified Config revision', async () => {
  const [ci, release, publish] = await Promise.all(
    ['ci', 'release', 'publish'].map((name) => readFile(`.github/workflows/${name}.yml`, 'utf8')),
  )

  for (const workflow of [ci, release, publish]) {
    assert.doesNotMatch(workflow, /astrale-os\/config\/.+@main/u)
    const configRefs = [...workflow.matchAll(/astrale-os\/config\/.+@([0-9a-f]{40})/gu)]
    assert.ok(configRefs.length > 0)
    assert.deepEqual([...new Set(configRefs.map((match) => match[1]))], [configSha])
    assert.doesNotMatch(workflow, /NPM_TOKEN|secrets\.[A-Z_]*TOKEN/u)
  }

  assert.match(ci, /frozen-lockfile: 'true'/u)
  assert.match(ci, /^\s{2}workflow_dispatch:\s*$/mu)
  assert.match(ci, /matrix:\s*\n\s+node-version:\s*\[24, 26\]/u)
  assert.match(ci, /node-version:\s*\$\{\{ matrix\.node-version \}\}/u)
  assert.match(ci, /PR_TITLE: \$\{\{ github\.event\.pull_request\.title \}\}/u)
  assert.match(ci, /printf '%s\\n' "\$PR_TITLE" \| pnpm commitlint/u)
  assert.match(publish, /actions\/publish\/packages@/u)
  assert.doesNotMatch(publish, /actions\/publish\/npm@/u)
  assert.match(publish, /dirs: 'constants utils styles preset components ui'/u)
  assert.match(publish, /github-token: \$\{\{ github\.token \}\}/u)
  assert.match(publish, /build-command: pnpm build/u)
  assert.match(
    release,
    /id:\s*release\s*\n\s+uses:\s*astrale-os\/config\/\.github\/actions\/release@/u,
  )
  assert.match(release, /release_prs:\s*\$\{\{ steps\.release\.outputs\.prs \}\}/u)
  assert.match(release, /actions:\s*write/u)
  assert.match(release, /gh workflow run ci\.yml/u)
  assert.match(release, /gh run watch/u)
})

test('keeps every published package private to GitHub Packages and linked to this repository', async () => {
  for (const directory of packageDirectories) {
    const manifest = JSON.parse(await readFile(`${directory}/package.json`, 'utf8'))
    assert.equal(manifest.publishConfig?.registry, 'https://npm.pkg.github.com')
    assert.equal(manifest.repository?.url, 'https://github.com/astrale-os/ui.git')
    assert.equal(manifest.repository?.directory, directory)
  }
})

test('uses TypeScript 7 with tsc and no native-preview dependency', async () => {
  for (const directory of packageDirectories.filter((entry) => entry !== 'styles')) {
    const manifest = JSON.parse(await readFile(`${directory}/package.json`, 'utf8'))
    assert.equal(manifest.devDependencies?.typescript, '7.0.2')
    assert.equal(manifest.devDependencies?.['@typescript/native-preview'], undefined)
    const scripts = Object.values(manifest.scripts ?? {}).join('\n')
    assert.match(scripts, /\btsc\b/u)
    assert.doesNotMatch(scripts, /\btsgo\b/u)
  }
})

test('pins the qualified repository toolchain and icon dependency', async () => {
  const root = JSON.parse(await readFile('package.json', 'utf8'))
  const components = JSON.parse(await readFile('components/package.json', 'utf8'))

  assert.equal(root.devDependencies?.['@commitlint/cli'], '21.2.2')
  assert.equal(root.devDependencies?.['@commitlint/config-conventional'], '21.2.2')
  assert.equal(root.devDependencies?.['lint-staged'], '17.3.0')
  assert.equal(root.devDependencies?.oxfmt, '0.63.0')
  assert.equal(root.devDependencies?.oxlint, '1.78.0')
  assert.deepEqual(root['lint-staged']?.['*.{js,cjs,mjs}'], ['oxfmt --write'])
  assert.equal(components.dependencies?.['lucide-react'], '1.31.0')
})

test('tracks a strict seven-day lock and local workspace linking policy', async () => {
  const [workspace, lock] = await Promise.all([
    readFile('pnpm-workspace.yaml', 'utf8'),
    readFile('pnpm-lock.yaml', 'utf8'),
  ])

  assert.match(workspace, /^linkWorkspacePackages: true$/mu)
  assert.match(workspace, /^minimumReleaseAge: 10080$/mu)
  assert.match(workspace, /^minimumReleaseAgeStrict: true$/mu)
  assert.match(workspace, /^minimumReleaseAgeIgnoreMissingTime: false$/mu)
  assert.match(workspace, /^trustLockfile: false$/mu)
  assert.doesNotMatch(workspace, /^overrides:/mu)
  assert.match(lock, /^lockfileVersion:/mu)
})
