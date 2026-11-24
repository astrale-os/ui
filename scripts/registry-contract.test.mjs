import { parse } from '@babel/parser'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { lowercaseElements } from './jsx-elements.mjs'

const sourcePath = 'registry/registry.source.json'
const rootPath = 'registry/registry.json'
const publicRootPath = 'registry.json'
const provenance = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', 'utf8'),
)
const provenanceByAddress = new Map(
  provenance.components.map((component) => [component.address, component]),
)
const coreCatalog = JSON.parse(await readFile('registry/core-catalog.json', 'utf8'))
const upstreamLedger = JSON.parse(await readFile('tooling/upstream/ledger.json', 'utf8'))
const externalProvenances = await Promise.all(
  (await readdir('tooling/upstream/providers', { recursive: true }))
    .filter((entry) => entry.endsWith('/provenance.json'))
    .map(async (entry) => ({
      path: path.join('tooling/upstream/providers', entry),
      value: JSON.parse(await readFile(path.join('tooling/upstream/providers', entry), 'utf8')),
    })),
)
const registryPackage = JSON.parse(await readFile('registry/package.json', 'utf8'))
const runtimePackage = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const removedCanonicalAddresses = [
  'block/application-shell/compact-command',
  'block/application-shell/responsive-workspace',
  'block/application-shell/sidebar-header',
  'block/communication/composer',
  'block/communication/conversation',
  'block/communication/inbox',
  'block/data-management/collection-browser',
  'block/data-management/details-panel',
  'block/data-management/editor',
  'block/onboarding/empty-first-value',
  'block/onboarding/multi-step',
  'block/onboarding/welcome',
  'block/settings/appearance',
  'block/settings/notifications',
  'block/settings/profile',
  'block/settings/team',
  'pattern/chart/bar-basic',
  'pattern/chart/line-basic',
  'pattern/data-table/basic',
  'pattern/data-table/server-controlled',
  'pattern/form/native',
  'pattern/questionnaire/multi-step',
  'pattern/questionnaire/single-page',
  'pattern/sidebar/application',
  'pattern/sidebar/mobile-controlled',
  'pattern/typography/article',
  'pattern/typography/dense-data',
]

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const current = path.join(root, entry.name)
        return entry.isDirectory() ? filesUnder(current) : [current]
      }),
    )
  ).flat()
}

function packageName(specifier) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0]
}

function componentDependencies(specifiers, styling = []) {
  return [
    '@astrale-os/ui@^0.3.0-beta.0',
    ...new Set(
      [...specifiers, ...styling]
        .filter(
          (specifier) =>
            specifier !== 'react' &&
            !specifier.startsWith('.') &&
            !specifier.startsWith('@astrale-os/ui'),
        )
        .map(packageName),
    ),
  ]
    .map((name) => {
      if (name.startsWith('@astrale-os/ui@')) return name
      assert.ok(registryPackage.dependencies[name], `undeclared registry dependency ${name}`)
      return `${name}@${registryPackage.dependencies[name]}`
    })
    .toSorted((a, b) => {
      if (a.startsWith('@astrale-os/ui@')) return -1
      if (b.startsWith('@astrale-os/ui@')) return 1
      return a.localeCompare(b)
    })
}

const moduleSourceOwners = new Set([
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration',
  'ImportExpression',
  'TSImportType',
])

// The modules a TypeScript file names, read from its syntax tree: imports and type-only imports,
// re-exports, `import()` expressions and types, and `import x = require()`. A module named inside a
// string, such as a code sample, is not a reference. `binds` is false for a side-effect import,
// which binds no declaration. Any other file (CSS) names no module.
function moduleReferences(source, file) {
  if (!/\.tsx?$/u.test(file)) return []
  const references = []
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child)
      return
    }
    if (typeof node?.type !== 'string') return
    const named =
      node.type === 'TSExternalModuleReference'
        ? node.expression
        : moduleSourceOwners.has(node.type)
          ? node.source
          : undefined
    if (named?.type === 'StringLiteral') {
      references.push({
        specifier: named.value,
        binds: node.type !== 'ImportDeclaration' || node.specifiers.length > 0,
      })
    }
    for (const [key, child] of Object.entries(node)) {
      if (key !== 'loc' && child && typeof child === 'object') visit(child)
    }
  }
  visit(
    parse(source, {
      sourceType: 'module',
      plugins: file.endsWith('.tsx') ? ['typescript', 'jsx'] : ['typescript'],
    }).program,
  )
  return references
}

function importSpecifiers(source, file) {
  return moduleReferences(source, file).map((reference) => reference.specifier)
}

async function itemImportSpecifiers(item) {
  return (
    await Promise.all(
      item.declaredPaths.map(async (declaredPath) =>
        importSpecifiers(await readFile(declaredPath, 'utf8'), declaredPath),
      ),
    )
  ).flat()
}

// A registry package requirement: an npm name and a version range, never a URL, path, or alias.
const packageRequirement =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*@[~^<>=|0-9A-Za-z.* -]+$/u

function requirementName(requirement) {
  return requirement.slice(0, requirement.lastIndexOf('@'))
}

// The DefinitelyTyped package that declares an untyped npm package.
function declarationPackage(name) {
  return `@types/${name.startsWith('@') ? name.slice(1).replace('/', '__') : name}`
}

// TypeScript decides whether a module is typed. One import of each specifier is compiled as a strict
// Vite consumer compiles it, in a project whose node_modules holds only `packages`, linked from the
// registry workspace that pins the ranges items declare. Returns the specifiers TypeScript resolves
// to JavaScript without a declaration (TS7016); any other diagnostic fails.
async function untypedModules(specifiers, packages) {
  const project = await mkdtemp(path.join(tmpdir(), 'astrale-registry-types-'))
  try {
    for (const name of packages) {
      const link = path.join(project, 'node_modules', name)
      await mkdir(path.dirname(link), { recursive: true })
      await symlink(await realpath(path.join('registry/node_modules', name)), link, 'junction')
    }
    await writeFile(
      path.join(project, 'probe.ts'),
      specifiers
        .map((specifier, index) => `export * as m${index} from ${JSON.stringify(specifier)}\n`)
        .join(''),
    )
    await writeFile(
      path.join(project, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          types: [],
        },
        files: ['probe.ts'],
      }),
    )
    const result = spawnSync(
      process.execPath,
      [path.resolve('node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--pretty', 'false'],
      { cwd: project, encoding: 'utf8' },
    )
    assert.ifError(result.error)
    const diagnostics = result.stdout.split('\n').filter((line) => /\berror TS\d+:/u.test(line))
    const untyped = new Set()
    for (const diagnostic of diagnostics) {
      const match = /^probe\.ts\((\d+),\d+\): error TS7016:/u.exec(diagnostic)
      assert.ok(match, diagnostic)
      untyped.add(specifiers[Number(match[1]) - 1])
    }
    assert.equal(result.status === 0, diagnostics.length === 0, result.stdout + result.stderr)
    return untyped
  } finally {
    await rm(project, { recursive: true, force: true })
  }
}

function assertSafeRelative(target) {
  assert.equal(path.isAbsolute(target), false)
  assert.equal(target.includes('\\'), false)
  assert.equal(target.split('/').includes('..'), false)
}

async function readFamilyItems() {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  return (
    await Promise.all(
      source.includes.map(async (include) => {
        const manifestPath = path.join('registry', include.replace(/^\.\//u, ''))
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
        const singleton =
          new Set(['./patterns/form/registry.json', './themes/registry.json']).has(include) ||
          (manifest.items.length === 1 &&
            manifest.items[0]?.meta?.provider &&
            manifest.items[0].meta.provider !== '@astrale-os/ui')
        assert.ok(
          manifest.items.length >= (singleton ? 1 : 2),
          `${include} must expose owned items`,
        )
        return manifest.items.map((item) => ({
          ...item,
          declaredPath: path.join(path.dirname(manifestPath), item.files[0].path),
          declaredPaths: item.files.map((file) => path.join(path.dirname(manifestPath), file.path)),
        }))
      }),
    )
  ).flat()
}

test('registry aggregation explicitly owns every family and exact item once', async () => {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const publicRoot = JSON.parse(await readFile(publicRootPath, 'utf8'))
  assert.equal(source.shadcn, '4.18.0')
  assert.ok(source.includes.length >= 1)
  assert.equal(new Set(source.includes).size, source.includes.length)
  assert.equal(publicRoot.include.length, source.includes.length + 1)
  assert.equal(publicRoot.include[0], 'registry/base/registry.json')
  assert.deepEqual(
    publicRoot.include.slice(1).sort(),
    source.includes.map((include) => `registry/${include.replace(/^\.\//u, '')}`).sort(),
  )

  const familyItems = await readFamilyItems()
  assert.equal(root.items.length, familyItems.length)
  assert.deepEqual(
    root.items.map((item) => item.name).sort(),
    familyItems.map((item) => item.name).sort(),
  )
  assert.equal(new Set(root.items.map((item) => item.name)).size, root.items.length)
  assert.equal(
    new Set(root.items.map((item) => item.meta.canonicalAddress)).size,
    root.items.length,
  )
  const targetSources = new Map()
  for (const item of familyItems) {
    for (let index = 0; index < item.files.length; index += 1) {
      const file = item.files[index]
      const sources = targetSources.get(file.target) ?? new Set()
      sources.add((await readFile(item.declaredPaths[index])).toString('hex'))
      targetSources.set(file.target, sources)
    }
  }
  for (const [target, sources] of targetSources) {
    assert.equal(sources.size, 1, `${target} must have one exact source across all owning items`)
  }
})

test('every registry item is independently bounded, controlled, and safe to install', async () => {
  const items = await readFamilyItems()
  const lockItems = JSON.parse(await readFile('schemas/ui-lock.schema.json', 'utf8')).properties
    .items
  const lockAddresses = [
    new RegExp(lockItems.propertyNames.pattern, 'u'),
    new RegExp(lockItems.additionalProperties.properties.address.pattern, 'u'),
  ]
  for (const item of items) {
    const isTheme = item.meta.canonicalAddress.startsWith('theme/')
    const isComponent = item.meta.canonicalAddress.startsWith('component/')
    const isVariant = item.meta.provider === '@astrale-os/ui'
    assert.equal(item.name, item.meta.canonicalAddress.replaceAll('/', '-'))
    assert.match(
      item.meta.canonicalAddress,
      /^(?:theme\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*|component(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){1,2}|(?:pattern|block)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){2,})$/u,
    )
    for (const pattern of lockAddresses) {
      assert.match(
        item.meta.canonicalAddress,
        pattern,
        `${item.meta.canonicalAddress} must be recordable in astrale-ui.lock.json`,
      )
    }
    assert.equal(
      item.type,
      isTheme ? 'registry:theme' : isComponent ? 'registry:component' : 'registry:block',
    )
    assert.ok(item.files.length >= 1)

    const file = item.files[0]
    assert.match(
      file.path,
      isTheme
        ? /^[a-z0-9-]+\.css$/u
        : isVariant
          ? /[a-z0-9-]+\.tsx?$/u
          : /^(?:[a-z0-9-]+\/)?[a-z0-9-]+\.tsx?$/u,
    )
    for (let index = 0; index < item.files.length; index += 1) {
      assertSafeRelative(item.files[index].path)
      assertSafeRelative(item.files[index].target)
      assert.match(
        item.files[index].target,
        isTheme
          ? /^components\/astrale\/theme\/[a-z0-9-]+\.css$/u
          : index === 0
            ? /^components\/astrale\/components\//u
            : /^components\/astrale\/(?!theme\/)/u,
        `${item.name} installs ${item.files[index].target} outside its consumer-owned folder`,
      )
      await stat(item.declaredPaths[index])
    }
    assert.equal(
      new Set(item.files.map((file) => file.target)).size,
      item.files.length,
      `${item.name} declares one target twice`,
    )
    assert.deepEqual(item.registryDependencies ?? [], [], `${item.name} fetches another item`)
    assert.equal(item.envVars, undefined, `${item.name} writes environment files`)
    for (const dependency of [...(item.dependencies ?? []), ...(item.devDependencies ?? [])]) {
      assert.match(dependency, packageRequirement, `${item.name} depends on ${dependency}`)
    }
    const ownedTargets = new Set(
      item.files.map((file) => file.target.replace(/\.(?:tsx?|css)$/u, '')),
    )
    for (const declaredPath of item.declaredPaths) {
      for (const specifier of importSpecifiers(
        await readFile(declaredPath, 'utf8'),
        declaredPath,
      )) {
        if (!specifier.startsWith('@/components/astrale/')) continue
        assert.ok(
          ownedTargets.has(specifier.slice(2)),
          `${item.name} imports ${specifier} without installing it`,
        )
      }
    }

    const itemSource = await readFile(item.declaredPath, 'utf8')
    if (isTheme) {
      assert.deepEqual(item.dependencies, ['@astrale-os/ui@^0.3.0-beta.0'])
      assert.match(itemSource, /Consumer-owned after installation/u)
      assert.match(
        itemSource,
        new RegExp(`\\[data-ui-theme=['"]${item.meta.canonicalAddress.slice(6)}['"]\\]`),
      )
      assert.match(itemSource, /--ui-primary:/u)
      assert.match(itemSource, /--ui-font-heading:/u)
      assert.match(itemSource, /--ui-motion-standard:/u)
      continue
    }
    if (isVariant) {
      assert.equal(item.meta.source, '@astrale-os/ui')
      assert.equal(item.meta.license, 'MIT')
      assert.deepEqual(Object.keys(item.meta).sort(), [
        'canonicalAddress',
        'license',
        'provider',
        'source',
      ])
      assert.ok(item.dependencies.includes('@astrale-os/ui@^0.3.0-beta.0'))
      continue
    }
    if (isComponent && item.meta.provider === '@shadcn') {
      const upstream = provenanceByAddress.get(item.meta.upstreamAddress)
      assert.ok(upstream, `${item.name} has no exact provenance owner`)
      assert.equal(item.meta.upstreamAddress, `@shadcn/${item.meta.canonicalAddress.slice(10)}`)
      assert.equal(item.meta.upstreamDigest, upstream.sourceDigest)
      assert.equal(item.meta.canonicalAddress, upstream.owner)
      assert.equal(item.declaredPath, upstream.implementation)
      assert.equal(item.meta.adaptation, upstream.adaptation)
      const styling = item.css
        ? Object.keys(item.css).flatMap((rule) => /["']([^"']+)["']/u.exec(rule)?.[1] ?? [])
        : []
      assert.deepEqual(
        item.dependencies,
        componentDependencies(await itemImportSpecifiers(item), styling),
      )
      continue
    }
    if (item.meta.provider && item.meta.provider !== '@astrale-os/ui') {
      const exactProofs = externalProvenances.filter(
        ({ value }) =>
          value.provider === item.meta.provider &&
          value.upstreamAddress === item.meta.upstreamAddress &&
          value.sourceDigest === item.meta.upstreamDigest,
      )
      assert.equal(exactProofs.length, 1, `${item.name} must have one exact provider proof`)
      const external = exactProofs[0].value
      const catalogOwner = coreCatalog.find(
        (entry) => entry.source === external.upstreamAddress,
      )?.address
      assert.equal(item.meta.canonicalAddress, external.owner ?? catalogOwner)
      assert.equal(item.meta.adaptation, external.adaptation ?? 'imports-only')
      const provenImplementations = externalProvenances
        .filter(({ value }) => value.owner === item.meta.canonicalAddress)
        .flatMap(({ value }) => Object.values(value.files ?? {}))
        .flatMap((file) =>
          file && typeof file === 'object' && typeof file.implementation === 'string'
            ? [file.implementation]
            : [],
        )
        .toSorted()
      if (provenImplementations.length > 0) {
        assert.deepEqual([...new Set(provenImplementations)], item.declaredPaths.toSorted())
      } else {
        assert.equal(item.files.length, Object.keys(external.files ?? {}).length)
      }
      const styling = item.css
        ? Object.keys(item.css).flatMap((rule) => /["']([^"']+)["']/u.exec(rule)?.[1] ?? [])
        : []
      assert.deepEqual(
        item.dependencies,
        componentDependencies(await itemImportSpecifiers(item), styling),
      )
      continue
    }
    assert.deepEqual(item.dependencies, ['@astrale-os/ui@^0.3.0-beta.0'])
    // Every file the item installs holds to the same bounds; a relative import must name another
    // file of the same item, installed beside it.
    for (let index = 0; index < item.files.length; index += 1) {
      const declaredPath = item.declaredPaths[index]
      const fileSource = await readFile(declaredPath, 'utf8')
      for (const specifier of importSpecifiers(fileSource, declaredPath)) {
        if (specifier.startsWith('.')) {
          const imported = path.join(path.dirname(declaredPath), specifier).replace(/\.js$/u, '')
          assert.ok(
            item.declaredPaths.some((candidate) => candidate.replace(/\.tsx?$/u, '') === imported),
            `${item.name} imports ${specifier}, which it does not install`,
          )
          continue
        }
        assert.ok(
          specifier === 'react' ||
            specifier === '@astrale-os/ui' ||
            specifier.startsWith('@astrale-os/ui/'),
          `${item.name} imports only public runtime owners, not ${specifier}`,
        )
      }
      assert.doesNotMatch(
        fileSource,
        /(?:\bfetch\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|document\.cookie|@astrale-os\/sdk|next\/router|react-router)/u,
      )
      for (const match of lowercaseElements(fileSource)) {
        const closing = fileSource.indexOf('>', match.index + match[0].length)
        assert.ok(closing >= 0)
        assert.match(
          fileSource.slice(match.index, closing),
          /\sdata-slot=["'][^"']+["']/u,
          `${declaredPath} exposes ${match[1]} as a host-addressable part`,
        )
      }
      assert.doesNotMatch(fileSource, /Object\.(?:freeze|seal)|as const satisfies Readonly/u)
    }
    assert.match(itemSource, /\bclassName\?: string/u)
    assert.match(itemSource, /\bstyle\?: React\.CSSProperties/u)
    assert.match(
      itemSource,
      new RegExp(`data-slot=["']${item.meta.canonicalAddress.replaceAll('/', '-')}["']`),
    )
    const presentationOnly = new Set(['pattern/message/bubble-basic'])
    if (!presentationOnly.has(item.meta.canonicalAddress)) {
      const declaredActions = [
        ...itemSource.matchAll(/\b(on[A-Z][A-Za-z]+)\??\s*\([^)]*\)\s*:/gu),
      ].map((match) => match[1])
      assert.ok(
        declaredActions.length > 0,
        `${item.name} must declare injected application actions`,
      )
      assert.ok(
        declaredActions.some(
          (action) => [...itemSource.matchAll(new RegExp(`\\b${action}\\b`, 'gu'))].length >= 3,
        ),
        `${item.name} must consume an injected application action`,
      )
    }
  }
})

// An item type-checks in a strict TypeScript consumer with only what it installs. Every npm module
// its TypeScript binds is a dependency of the item, and a module whose package ships no declarations
// brings the matching `@types/*` package in the item's devDependencies, at the range the registry
// workspace pins. Three references carry no such obligation, each for its reason:
// - Host packages. `@astrale-os/ui` requires its host to provide its peer dependencies, and
//   `astrale ui init` admits only a React project that declares them. A TypeScript host owns their
//   declaration packages with them, so an item never re-declares those types.
// - `@astrale-os/ui` itself, whose manifest declares types for every subpath an item imports.
// - Side-effect imports and CSS references (`css` rules, `.css` files), which bind no declaration.
test('every npm module an item binds from TypeScript is installed and typed by the item', async () => {
  const items = await readFamilyItems()
  const hostPackages = new Set(Object.keys(runtimePackage.peerDependencies))
  const itemModules = new Map()
  const packages = new Set()
  for (const item of items) {
    const modules = new Set()
    for (const declaredPath of item.declaredPaths) {
      const source = await readFile(declaredPath, 'utf8')
      for (const { specifier, binds } of moduleReferences(source, declaredPath)) {
        if (!binds || specifier.startsWith('.') || specifier.startsWith('@/')) continue
        const name = packageName(specifier)
        if (hostPackages.has(name)) continue
        if (name === '@astrale-os/ui') {
          const subpath = `.${specifier.slice(name.length)}`
          assert.equal(
            typeof runtimePackage.exports[subpath]?.types,
            'string',
            `${item.name} imports ${specifier}, which ${name} does not export with declarations`,
          )
          continue
        }
        assert.ok(
          (item.dependencies ?? []).some((requirement) => requirementName(requirement) === name),
          `${item.name} imports ${specifier} without depending on ${name}`,
        )
        assert.ok(
          registryPackage.dependencies[name],
          `registry/package.json must pin ${name}, which ${item.name} imports`,
        )
        modules.add(specifier)
        packages.add(name)
      }
    }
    itemModules.set(item, modules)
  }

  const allModules = [...new Set([...itemModules.values()].flatMap((modules) => [...modules]))]
  const untyped = await untypedModules(allModules.toSorted(), [...packages])
  const typePackages = new Set()
  for (const [item, modules] of itemModules) {
    const expected = [
      ...new Set(
        [...modules]
          .filter((specifier) => untyped.has(specifier))
          .map((specifier) => declarationPackage(packageName(specifier))),
      ),
    ]
      .toSorted()
      .map((name) => {
        assert.ok(
          registryPackage.devDependencies[name],
          `registry/package.json must pin ${name}, which ${item.name} needs`,
        )
        typePackages.add(name)
        return `${name}@${registryPackage.devDependencies[name]}`
      })
    assert.deepEqual(
      item.devDependencies ?? [],
      expected,
      `${item.name} must declare exactly the declaration packages of the untyped modules it imports`,
    )
  }
  if (untyped.size > 0) {
    assert.deepEqual(
      [...(await untypedModules([...untyped], [...packages, ...typePackages]))],
      [],
      'a declared @types package must type every module of its package that an item imports',
    )
  }
})

test('registry guards reject traversal and observe every executable import form', () => {
  for (const target of [
    '../escape.tsx',
    'components/astrale/components/../../escape.tsx',
    '/tmp/x',
    'C:\\x',
  ]) {
    assert.throws(() => assertSafeRelative(target))
  }
  assert.deepEqual(
    moduleReferences(
      [
        "import '@evil/side-effect'",
        "import value from '@astrale-os/ui/button'",
        "import type { Row } from '@evil/type-only'",
        "export * from '@evil/re-export'",
        "import legacy = require('@evil/require')",
        "type Lazy = typeof import('@evil/type-query')",
        "const lazy = import('@evil/dynamic')",
        "const sample = `import Papa from 'papaparse'`",
        'export const View = () => <pre>{sample}</pre>',
      ].join('\n'),
      'guard.tsx',
    ).toSorted((left, right) => left.specifier.localeCompare(right.specifier)),
    [
      { specifier: '@astrale-os/ui/button', binds: true },
      { specifier: '@evil/dynamic', binds: true },
      { specifier: '@evil/re-export', binds: true },
      { specifier: '@evil/require', binds: true },
      { specifier: '@evil/side-effect', binds: false },
      { specifier: '@evil/type-only', binds: true },
      { specifier: '@evil/type-query', binds: true },
    ],
  )
  assert.deepEqual(moduleReferences("@import 'tw-animate-css';\n", 'theme.css'), [])
})

test('externally sourced compositions are exact admitted intake owners', async () => {
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const addresses = root.items.map((item) => item.meta.canonicalAddress)
  assert.deepEqual(
    addresses.filter((address) => address.startsWith('theme/')),
    ['theme/console', 'theme/desktop', 'theme/observatory', 'theme/spatial'],
  )
  const externalOwners = root.items
    .filter(
      (item) =>
        item.meta.provider &&
        item.meta.provider !== '@astrale-os/ui' &&
        /^(?:pattern|block)\//u.test(item.meta.canonicalAddress),
    )
    .map((item) => item.meta.canonicalAddress)
    .toSorted()
  const admittedOwners = upstreamLedger.entries
    .filter(
      (entry) =>
        entry.decision.status === 'admitted' && /^(?:pattern|block)\//u.test(entry.decision.owner),
    )
    .map((entry) => entry.decision.owner)
  assert.deepEqual(externalOwners, [...new Set(admittedOwners)].toSorted())
  for (const removed of removedCanonicalAddresses) assert.equal(addresses.includes(removed), false)
})

test('registry source tree is closed to included manifests and declared implementations', async () => {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  const includedCompositionManifests = source.includes
    .filter((include) => /^\.\/(?:blocks|patterns)\//u.test(include))
    .map((include) => path.join('registry', include.replace(/^\.\//u, '')))
    .sort()
  const compositionFiles = [
    ...(await filesUnder('registry/blocks')),
    ...(await filesUnder('registry/patterns')),
  ]
  assert.deepEqual(
    compositionFiles.filter((file) => file.endsWith('/registry.json')).sort(),
    includedCompositionManifests,
  )
  // A file several items install (a shared part) is one implementation.
  const declaredImplementations = [
    ...new Set(
      (await readFamilyItems())
        .filter((item) => /^(?:registry\/blocks|registry\/patterns)\//u.test(item.declaredPath))
        .flatMap((item) => item.declaredPaths),
    ),
  ].sort()
  assert.deepEqual(
    compositionFiles
      .filter(
        (file) =>
          /\.tsx?$/u.test(file) && !file.endsWith('.preview.tsx') && !file.endsWith('.fixture.ts'),
      )
      .sort(),
    declaredImplementations,
  )
  for (const removedRoot of [
    'registry/blocks/application-shell',
    'registry/blocks/communication',
    'registry/blocks/data-management',
    'registry/blocks/onboarding',
    'registry/blocks/settings',
    'registry/patterns/chart',
    'registry/patterns/data-table',
    'registry/patterns/questionnaire',
    'registry/patterns/sidebar',
    'registry/patterns/typography',
    'registry/patterns/form/native.tsx',
    'registry/patterns/form/native.preview.tsx',
  ]) {
    await assert.rejects(stat(removedRoot), { code: 'ENOENT' })
  }
})

test('every built install item is exact current source rather than stale generated output', async () => {
  for (const item of await readFamilyItems()) {
    const built = JSON.parse(await readFile(`registry/public/r/${item.name}.json`, 'utf8'))
    for (const field of ['name', 'type', 'title', 'description']) {
      assert.equal(built[field], item[field], `${item.name} stale ${field}`)
    }
    assert.deepEqual(built.dependencies, item.dependencies, `${item.name} stale dependencies`)
    assert.deepEqual(
      built.devDependencies,
      item.devDependencies,
      `${item.name} stale devDependencies`,
    )
    assert.deepEqual(built.registryDependencies, item.registryDependencies)
    assert.deepEqual(built.css, item.css)
    assert.deepEqual(built.meta, item.meta, `${item.name} stale metadata`)
    assert.equal(built.files.length, item.files.length)
    for (let index = 0; index < item.files.length; index += 1) {
      assert.equal(
        built.files[index].path,
        item.declaredPaths[index].split(path.sep).join('/'),
        `${item.name} built path must repeat the release-root path its index entry declares`,
      )
      assert.equal(built.files[index].type, item.files[index].type)
      assert.equal(built.files[index].target, item.files[index].target)
      assert.equal(built.files[index].content, await readFile(item.declaredPaths[index], 'utf8'))
    }
  }
})

test('public registry leaves are the exact built catalog with no removed endpoint', async () => {
  const root = JSON.parse(await readFile(rootPath, 'utf8'))
  const base = JSON.parse(await readFile('registry/base/registry.json', 'utf8'))
  const publicRegistry = JSON.parse(await readFile('registry/public/r/registry.json', 'utf8'))
  assert.deepEqual(publicRegistry, root)
  assert.deepEqual(
    (await readdir('registry/public/r')).filter((file) => file.endsWith('.json')).sort(),
    [
      ...base.items.map((item) => `${item.name}.json`),
      ...root.items.map((item) => `${item.name}.json`),
      'registry.json',
    ].sort(),
  )
  for (const address of removedCanonicalAddresses) {
    await assert.rejects(stat(`registry/public/r/${address.replaceAll('/', '-')}.json`), {
      code: 'ENOENT',
    })
  }
})
