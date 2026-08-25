import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

const root = process.cwd()
const packageRoot = path.join(root, 'packages/ui')
const artifactDirectory = path.join(root, 'artifacts/package')
const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-ui-package-'))

function run(file, args, cwd = root) {
  const result = spawnSync(file, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, NPM_CONFIG_CACHE: path.join(temporary, 'npm-cache') },
  })
  if (result.status !== 0) {
    throw new Error(`${file} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout.trim()
}

async function size(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name)
        return entry.isDirectory() ? size(target) : (await stat(target)).size
      }),
    )
  ).reduce((total, value) => total + value, 0)
}

async function fileSizes(directory, relativeTo = directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name)
        if (entry.isDirectory()) return fileSizes(target, relativeTo)
        return [{ file: path.relative(relativeTo, target), bytes: (await stat(target)).size }]
      }),
    )
  ).flat()
}

function dependencyPaths(file, args, cwd) {
  const output = run(file, args, cwd)
  return output ? output.split('\n').filter(Boolean).slice(1).length : 0
}

async function gzipSize(value) {
  let bytes = 0
  await pipeline(
    Readable.from(value),
    createGzip(),
    new Writable({
      write(chunk, _encoding, callback) {
        bytes += chunk.length
        callback()
      },
    }),
  )
  return bytes
}

try {
  await rm(artifactDirectory, { recursive: true, force: true })
  await mkdir(artifactDirectory, { recursive: true })
  run('pnpm', ['--filter', '@astrale-os/ui', 'pack', '--pack-destination', artifactDirectory])
  const tarballName = (await readdir(artifactDirectory)).find((name) => name.endsWith('.tgz'))
  assert.ok(tarballName, 'pnpm pack must emit one tarball')
  const tarball = path.join(artifactDirectory, tarballName)
  const tarballContent = await readFile(tarball)
  const repeatPackDirectory = path.join(temporary, 'repeat-pack')
  await mkdir(repeatPackDirectory)
  run('pnpm', ['--filter', '@astrale-os/ui', 'pack', '--pack-destination', repeatPackDirectory])
  const repeatTarballName = (await readdir(repeatPackDirectory)).find((name) =>
    name.endsWith('.tgz'),
  )
  assert.ok(repeatTarballName, 'repeat pnpm pack must emit one tarball')
  const repeatTarballContent = await readFile(path.join(repeatPackDirectory, repeatTarballName))
  const tarballSha256 = createHash('sha256').update(tarballContent).digest('hex')
  const repeatPackSha256 = createHash('sha256').update(repeatTarballContent).digest('hex')
  assert.equal(repeatPackSha256, tarballSha256, 'repeated package packs must be byte-identical')
  const entries = run('tar', ['-tzf', tarball]).split('\n')
  assert.ok(entries.includes('package/package.json'))
  assert.ok(entries.includes('package/dist/index.js'))
  assert.ok(entries.includes('package/dist/feedback/toast/index.js'))
  assert.equal(
    entries.some((entry) => entry.includes('/src/')),
    false,
  )
  assert.equal(
    entries.some((entry) => entry.endsWith('.map')),
    false,
  )
  await writeFile(path.join(artifactDirectory, 'pack-files.txt'), entries.join('\n') + '\n')
  const npmPackDryRun = JSON.parse(
    run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], packageRoot),
  )
  assert.equal(npmPackDryRun.length, 1)
  const dryRunFiles = npmPackDryRun[0].files.map(({ path: file }) => file).toSorted()
  const archiveFiles = entries
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//u, ''))
    .toSorted()
  assert.deepEqual(dryRunFiles, archiveFiles)
  await writeFile(
    path.join(artifactDirectory, 'npm-pack-dry-run.json'),
    JSON.stringify(npmPackDryRun, null, 2) + '\n',
  )

  const extracted = path.join(temporary, 'extracted')
  await mkdir(extracted)
  run('tar', ['-xzf', tarball, '-C', extracted])
  const packedManifest = JSON.parse(
    await readFile(path.join(extracted, 'package/package.json'), 'utf8'),
  )
  const exportTargets = Object.values(packedManifest.exports).flatMap((value) =>
    typeof value === 'string' ? [value] : Object.values(value),
  )
  for (const target of new Set(exportTargets)) {
    assert.ok(entries.includes('package/' + target.replace(/^\.\//u, '')), target)
  }

  const consumer = path.join(temporary, 'pnpm-consumer')
  await mkdir(consumer)
  await writeFile(
    path.join(consumer, 'package.json'),
    JSON.stringify({ name: 'astrale-ui-clean-consumer', private: true, type: 'module' }),
  )
  await writeFile(
    path.join(consumer, '.npmrc'),
    'registry=https://registry.npmjs.org/\n@astrale-os:registry=https://registry.npmjs.org/\n',
  )
  const pnpmInstallStarted = performance.now()
  run(
    'pnpm',
    [
      'add',
      '--prefer-offline',
      tarball,
      'react@19.2.8',
      'react-dom@19.2.8',
      'vite@8.1.1',
      'typescript@7.0.2',
      '@types/react@19.2.18',
      '@types/react-dom@19.2.3',
    ],
    consumer,
  )
  const pnpmInstallMilliseconds = Math.round(performance.now() - pnpmInstallStarted)
  await writeFile(
    path.join(consumer, 'index.html'),
    '<main id="app"></main><script type="module" src="/main.js"></script>\n',
  )
  await writeFile(
    path.join(consumer, 'main.js'),
    "import { Button } from '@astrale-os/ui'\ndocument.querySelector('#app').dataset.component = Button.name\n",
  )
  const moduleSpecifiers = Object.keys(packedManifest.exports)
    .filter((subpath) => !subpath.endsWith('.css') && subpath !== './package.json')
    .map((subpath) => (subpath === '.' ? '@astrale-os/ui' : '@astrale-os/ui/' + subpath.slice(2)))
  await writeFile(
    path.join(consumer, 'imports.ts'),
    moduleSpecifiers.map((specifier) => `import '${specifier}'`).join('\n') + '\n',
  )
  run(
    'pnpm',
    [
      'exec',
      'tsc',
      '--strict',
      '--noEmit',
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      'imports.ts',
    ],
    consumer,
  )
  run('pnpm', ['exec', 'vite', 'build'], consumer)
  run(
    'node',
    [
      '--input-type=module',
      '--eval',
      `for (const specifier of ${JSON.stringify(moduleSpecifiers)}) await import(specifier)`,
    ],
    consumer,
  )

  const ssrSource = [
    "import { createElement } from 'react'",
    "import { renderToString } from 'react-dom/server'",
    "import { Button } from '@astrale-os/ui'",
    "export const html = renderToString(createElement(Button, null, 'SSR'))",
    "if (!html.includes('SSR')) throw new Error('SSR output missing')",
  ].join('\n')
  await writeFile(path.join(consumer, 'ssr.mjs'), ssrSource + '\n')
  run('pnpm', ['exec', 'vite', 'build', '--ssr', 'ssr.mjs', '--outDir', 'dist-ssr'], consumer)
  run('node', ['dist-ssr/ssr.js'], consumer)

  const dialogConsumer = path.join(consumer, 'dialog')
  await mkdir(dialogConsumer)
  await writeFile(
    path.join(dialogConsumer, 'index.html'),
    '<main id="app"></main><script type="module" src="/main.js"></script>\n',
  )
  await writeFile(
    path.join(dialogConsumer, 'main.js'),
    [
      "import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@astrale-os/ui'",
      "document.querySelector('#app').dataset.components = [Dialog, DialogContent, DialogDescription, DialogTitle].map((value) => value.name).join(',')",
    ].join('\n') + '\n',
  )
  run('pnpm', ['exec', 'vite', 'build', 'dialog'], consumer)

  const bundleName = (await readdir(path.join(consumer, 'dist/assets'))).find((name) =>
    name.endsWith('.js'),
  )
  assert.ok(bundleName)
  const bundle = await readFile(path.join(consumer, 'dist/assets', bundleName))
  const bundleSource = bundle.toString('utf8')
  for (const unrelatedSlot of [
    'alert-dialog',
    'dialog-content',
    'toast-viewport',
    'resizable-panel',
    'select-positioner',
  ]) {
    assert.equal(bundleSource.includes(unrelatedSlot), false, `${unrelatedSlot} leaked into Button`)
  }

  const dialogBundleName = (await readdir(path.join(dialogConsumer, 'dist/assets'))).find((name) =>
    name.endsWith('.js'),
  )
  assert.ok(dialogBundleName)
  const dialogBundle = await readFile(path.join(dialogConsumer, 'dist/assets', dialogBundleName))
  const dialogBundleSource = dialogBundle.toString('utf8')
  for (const unrelatedSlot of ['toast-viewport', 'resizable-panel', 'select-positioner']) {
    assert.equal(
      dialogBundleSource.includes(unrelatedSlot),
      false,
      `${unrelatedSlot} leaked into Dialog`,
    )
  }

  const npmConsumer = path.join(temporary, 'npm-consumer')
  await mkdir(npmConsumer)
  await writeFile(
    path.join(npmConsumer, 'package.json'),
    JSON.stringify({ name: 'astrale-ui-npm-consumer', private: true, type: 'module' }),
  )
  await writeFile(
    path.join(npmConsumer, '.npmrc'),
    'registry=https://registry.npmjs.org/\n@astrale-os:registry=https://registry.npmjs.org/\n',
  )
  const npmInstallStarted = performance.now()
  run(
    'npm',
    [
      'install',
      '--prefer-offline',
      '--no-audit',
      '--no-fund',
      tarball,
      'react@19.2.8',
      'react-dom@19.2.8',
    ],
    npmConsumer,
  )
  const npmInstallMilliseconds = Math.round(performance.now() - npmInstallStarted)
  run(
    'node',
    [
      '--input-type=module',
      '--eval',
      "const ui = await import('@astrale-os/ui/button'); if (!ui.Button) throw new Error('Button missing')",
    ],
    npmConsumer,
  )

  const packedFiles = await fileSizes(path.join(extracted, 'package'))
  const largestFiles = packedFiles.toSorted((left, right) => right.bytes - left.bytes).slice(0, 10)
  const report = {
    package: '@astrale-os/ui',
    version: packedManifest.version,
    tarballSha256,
    repeatPackSha256,
    tarballIntegrity: 'sha512-' + createHash('sha512').update(tarballContent).digest('base64'),
    tarballBytes: (await stat(tarball)).size,
    unpackedBytes: await size(path.join(extracted, 'package')),
    themeCssBytes: (await stat(path.join(extracted, 'package/dist/theme.css'))).size,
    resetCssBytes: (await stat(path.join(extracted, 'package/dist/reset.css'))).size,
    rootButtonBundleBytes: bundle.length,
    rootButtonBundleGzipBytes: await gzipSize(bundle),
    dialogBundleBytes: dialogBundle.length,
    dialogBundleGzipBytes: await gzipSize(dialogBundle),
    pnpmInstallMilliseconds,
    pnpmDependencyPaths: dependencyPaths(
      'pnpm',
      ['list', '--prod', '--depth', 'Infinity', '--parseable'],
      consumer,
    ),
    npmInstallMilliseconds,
    npmDependencyPaths: dependencyPaths('npm', ['ls', '--all', '--parseable'], npmConsumer),
    files: entries.length,
    largestFiles,
  }
  assert.ok(report.tarballBytes < 500_000, 'packed UI must remain below 500 kB')
  assert.ok(report.rootButtonBundleGzipBytes < 50_000, 'root Button import must tree-shake')
  assert.ok(report.dialogBundleGzipBytes < 60_000, 'root Dialog import must tree-shake')
  await writeFile(
    path.join(artifactDirectory, 'qualification.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
} finally {
  await rm(temporary, { recursive: true, force: true })
}
