import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = process.cwd()
const registryRoot = path.join(root, 'registry')
const publicRoot = path.join(registryRoot, 'public/r')
const temporary = await mkdtemp(path.join(tmpdir(), 'astrale-ui-registry-'))
const artifactDirectory = path.join(root, 'artifacts/registry')

function run(file, args, cwd = root, environment = {}) {
  const result = spawnSync(file, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, CI: '1', ...environment },
  })
  if (result.status !== 0) {
    throw new Error(`${file} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout.trim()
}

async function runAsync(file, args, cwd = root, environment = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd,
      env: { ...process.env, CI: '1', ...environment },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => (stdout += chunk))
    child.stderr.setEncoding('utf8').on('data', (chunk) => (stderr += chunk))
    const timer = setTimeout(() => child.kill('SIGTERM'), 180_000)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else
        reject(
          new Error(`${file} ${args.join(' ')} failed (${signal ?? code})\n${stdout}\n${stderr}`),
        )
    })
  })
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

function withoutClientDirective(content) {
  return content.replace(/^['"]use client['"]\n\n/u, '')
}

async function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server.address()))
  })
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name)
        if (entry.name === 'node_modules') return []
        return entry.isDirectory() ? walk(target) : target
      }),
    )
  ).flat()
}

try {
  const manifest = JSON.parse(await readFile(path.join(root, 'packages/ui/package.json'), 'utf8'))
  const registry = JSON.parse(await readFile(path.join(registryRoot, 'registry.json'), 'utf8'))
  const tarballs = (await readdir(path.join(root, 'artifacts/package'))).filter((file) =>
    file.endsWith('.tgz'),
  )
  assert.equal(tarballs.length, 1, 'registry qualification requires the one qualified UI tarball')
  const tarball = path.join(root, 'artifacts/package', tarballs[0])

  const rebuilt = path.join(temporary, 'rebuilt')
  run('pnpm', ['dlx', 'shadcn@4.18.0', 'build', 'registry.json', '-o', rebuilt])
  const builtFiles = (await readdir(publicRoot)).filter((file) => file.endsWith('.json')).toSorted()
  const rebuiltFiles = (await readdir(rebuilt)).filter((file) => file.endsWith('.json')).toSorted()
  assert.deepEqual(
    rebuiltFiles,
    builtFiles,
    'registry rebuild changed the published file inventory',
  )
  for (const file of builtFiles) {
    assert.equal(
      await readFile(path.join(rebuilt, file), 'utf8'),
      await readFile(path.join(publicRoot, file), 'utf8'),
      `${file} is not a deterministic registry build`,
    )
  }

  const server = createServer(async (request, response) => {
    const name = path.basename(new URL(request.url ?? '/', 'http://localhost').pathname)
    if (!/^[a-z0-9-]+\.json$/u.test(name)) {
      response.writeHead(404).end()
      return
    }
    try {
      const document = JSON.parse(await readFile(path.join(publicRoot, name), 'utf8'))
      document.dependencies = (document.dependencies ?? []).filter(
        (dependency) => !dependency.startsWith('@astrale-os/ui@'),
      )
      const body = Buffer.from(JSON.stringify(document))
      response.writeHead(200, {
        'content-type': 'application/json',
        'content-length': String(body.length),
      })
      response.end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  const address = await listen(server)
  assert.ok(address && typeof address === 'object')

  try {
    const fixture = path.join(temporary, 'consumer with spaces')
    await mkdir(path.join(fixture, 'src'), { recursive: true })
    await writeFile(
      path.join(fixture, 'package.json'),
      JSON.stringify(
        {
          name: 'astrale-registry-consumer',
          private: true,
          type: 'module',
          dependencies: {
            '@astrale-os/ui': `file:${tarball}`,
            react: '19.2.8',
            'react-dom': '19.2.8',
          },
          devDependencies: {
            '@types/react': '19.2.18',
            '@types/react-dom': '19.2.3',
            tailwindcss: '4.3.3',
            typescript: '7.0.2',
          },
          packageManager: 'pnpm@12.0.0',
        },
        null,
        2,
      ) + '\n',
    )
    await writeFile(
      path.join(fixture, 'pnpm-workspace.yaml'),
      `packages: []\noverrides:\n  '@astrale-os/ui': 'file:${tarball}'\n`,
    )
    await writeFile(
      path.join(fixture, 'components.json'),
      JSON.stringify(
        {
          $schema: 'https://ui.shadcn.com/schema.json',
          style: 'base-nova',
          rsc: false,
          tsx: true,
          tailwind: {
            config: '',
            css: 'src/index.css',
            baseColor: 'neutral',
            cssVariables: true,
            prefix: '',
          },
          aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            ui: '@/components/ui',
            lib: '@/lib',
            hooks: '@/hooks',
          },
          iconLibrary: 'lucide',
        },
        null,
        2,
      ) + '\n',
    )
    await writeFile(
      path.join(fixture, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'react-jsx',
            strict: true,
            noEmit: true,
            paths: { '@/*': ['./src/*'] },
          },
          include: ['src/components/**/*.tsx'],
        },
        null,
        2,
      ) + '\n',
    )
    await writeFile(path.join(fixture, 'src/index.css'), "@import 'tailwindcss';\n")
    const userConfig = path.join(fixture, '.npmrc')
    await writeFile(
      userConfig,
      'registry=https://registry.npmjs.org/\n@astrale-os:registry=https://registry.npmjs.org/\n',
    )
    const isolatedRegistry = { NPM_CONFIG_USERCONFIG: userConfig }
    run('pnpm', ['install', '--ignore-scripts', '--prefer-offline'], fixture, isolatedRegistry)

    const urls = registry.items.map((item) => `http://127.0.0.1:${address.port}/${item.name}.json`)
    await runAsync(
      'pnpm',
      ['dlx', 'shadcn@4.18.0', 'add', ...urls, '--cwd', fixture, '--yes'],
      fixture,
      isolatedRegistry,
    )

    const materialized = (await walk(fixture)).map((file) => path.relative(fixture, file))
    let installedFiles = 0
    for (const item of registry.items) {
      const built = JSON.parse(await readFile(path.join(publicRoot, `${item.name}.json`), 'utf8'))
      for (const file of item.files) {
        assert.ok(file.target)
        const physicalTarget = path.join('src', file.target)
        const installed = path.join(fixture, physicalTarget)
        assert.ok(
          materialized.includes(physicalTarget),
          `${item.name} did not install ${file.target}; materialized: ${materialized
            .filter((candidate) => candidate.includes('astrale'))
            .join(', ')}`,
        )
        const expected = built.files.find((candidate) => candidate.target === file.target)
        assert.ok(expected, `${item.name} is missing ${file.target} from its built payload`)
        assert.equal(
          withoutClientDirective(await readFile(installed, 'utf8')),
          withoutClientDirective(expected.content),
          `${item.name} did not install its exact owned source`,
        )
        installedFiles += 1
      }
    }
    run('pnpm', ['exec', 'tsc'], fixture)

    await rm(artifactDirectory, { recursive: true, force: true })
    await mkdir(artifactDirectory, { recursive: true })
    const report = {
      package: `@astrale-os/ui@${manifest.version}`,
      shadcn: '4.18.0',
      profile: 'base-nova',
      items: registry.items.length,
      installedFiles,
      deterministicFiles: builtFiles.length,
      dependencyProof: 'qualified-tarball-plus-item-dependencies',
      registryDigest: digest(await readFile(path.join(registryRoot, 'registry.json'))),
      builtDigest: digest(
        Buffer.concat(
          await Promise.all(
            builtFiles.map(async (file) =>
              Buffer.concat([
                Buffer.from(file + '\0'),
                await readFile(path.join(publicRoot, file)),
              ]),
            ),
          ),
        ),
      ),
    }
    await writeFile(
      path.join(artifactDirectory, 'qualification.json'),
      JSON.stringify(report, null, 2) + '\n',
    )
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
