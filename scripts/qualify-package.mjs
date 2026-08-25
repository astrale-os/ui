import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

const root = process.cwd()
const artifactDirectory = path.join(root, 'artifacts/package')
const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-ui-package-'))

function run(file, args, cwd = root) {
  const result = spawnSync(file, args, { cwd, encoding: 'utf8', stdio: 'pipe' })
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

  const consumer = path.join(temporary, 'consumer')
  await mkdir(consumer)
  await writeFile(
    path.join(consumer, 'package.json'),
    JSON.stringify({ name: 'astrale-ui-clean-consumer', private: true, type: 'module' }),
  )
  await writeFile(
    path.join(consumer, '.npmrc'),
    'registry=https://registry.npmjs.org/\n@astrale-os:registry=https://registry.npmjs.org/\n',
  )
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
  const report = {
    package: '@astrale-os/ui',
    version: packedManifest.version,
    tarballBytes: (await stat(tarball)).size,
    unpackedBytes: await size(path.join(extracted, 'package')),
    rootButtonBundleBytes: bundle.length,
    rootButtonBundleGzipBytes: await gzipSize(bundle),
    files: entries.length,
  }
  assert.ok(report.tarballBytes < 500_000, 'packed UI must remain below 500 kB')
  assert.ok(report.rootButtonBundleGzipBytes < 50_000, 'root Button import must tree-shake')
  await writeFile(
    path.join(artifactDirectory, 'qualification.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
} finally {
  await rm(temporary, { recursive: true, force: true })
}
