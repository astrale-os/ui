import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  catalogProblems,
  checkCatalogPreviews,
  previewIdentity,
} from './check-catalog-previews.mjs'

test('generated component source authority matches the pinned provider provenance', async () => {
  const [{ componentSources }, provenance] = await Promise.all([
    import('../playground/src/catalog/inventory.ts'),
    import('../tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', {
      with: { type: 'json' },
    }).then((module) => module.default),
  ])
  const expected = Object.fromEntries(
    provenance.components
      .filter((component) =>
        ['owned-runtime', 'owned-registry-component'].includes(component.disposition),
      )
      .map((component) => [
        `component/${component.address.slice(component.address.indexOf('/') + 1)}`,
        component.address,
      ]),
  )
  assert.deepEqual(componentSources, expected)
})

test('the filesystem checker admits a closed catalog with named scenes and an excluded theme', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'astrale-ui-catalog-'))
  try {
    await Promise.all([
      mkdir(path.join(root, 'packages/ui/previews/button'), { recursive: true }),
      mkdir(path.join(root, 'registry/patterns/calendar'), { recursive: true }),
      mkdir(path.join(root, 'registry'), { recursive: true }),
    ])
    await Promise.all([
      writeFile(
        path.join(root, 'packages/ui/package.json'),
        JSON.stringify({ exports: { '.': {}, './button': {}, './theme.css': {} } }),
      ),
      writeFile(
        path.join(root, 'registry/registry.json'),
        JSON.stringify({
          items: [
            {
              name: 'pattern-calendar-single-basic',
              meta: { canonicalAddress: 'pattern/calendar/single-basic' },
              files: [],
            },
            { name: 'theme-astrale', meta: { canonicalAddress: 'theme/astrale' }, files: [] },
          ],
        }),
      ),
      writeFile(path.join(root, 'packages/ui/previews/button/button.preview.tsx'), ''),
      writeFile(path.join(root, 'packages/ui/previews/button/button.variants.preview.tsx'), ''),
      writeFile(path.join(root, 'registry/patterns/calendar/single-basic.preview.tsx'), ''),
    ])
    const result = await checkCatalogPreviews(root)
    assert.equal(result.expected, 2)
    assert.equal(result.identities.length, 3)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preview paths derive canonical item and named scene identity', () => {
  assert.deepEqual(previewIdentity('packages/ui/previews/button/button.preview.tsx'), {
    address: 'component/button',
    scene: 'default',
    canonical: true,
    file: 'packages/ui/previews/button/button.preview.tsx',
  })
  assert.deepEqual(previewIdentity('registry/patterns/calendar/single-basic.empty.preview.tsx'), {
    address: 'pattern/calendar/single-basic',
    scene: 'empty',
    canonical: false,
    file: 'registry/patterns/calendar/single-basic.empty.preview.tsx',
  })
  assert.deepEqual(previewIdentity('registry/blocks/dashboard/overview.preview.tsx'), {
    address: 'block/dashboard/overview',
    scene: 'default',
    canonical: true,
    file: 'registry/blocks/dashboard/overview.preview.tsx',
  })
})

test('preview paths reject mismatched, malformed, and ownerless files', () => {
  for (const file of [
    'packages/ui/previews/button/input.preview.tsx',
    'registry/components/chart/carousel.preview.tsx',
    'registry/patterns/calendar/single-basic.bad_scene.preview.tsx',
    'registry/patterns/calendar/nested/single-basic.preview.tsx',
    'registry/patterns/calendar/single-basic.default.preview.tsx',
    'playground/src/button.preview.tsx',
  ]) {
    assert.throws(() => previewIdentity(file), { name: 'AssertionError' })
  }
})

test('catalog closure aggregates malformed paths with all other contract failures', () => {
  const result = catalogProblems({
    packageDocument: { exports: { '.': {}, './button': {} } },
    registry: { items: [] },
    previews: [
      'packages/ui/previews/button/button.default.preview.tsx',
      'registry/patterns/calendar/nested/single-basic.preview.tsx',
    ],
  })
  assert.equal(result.identities.length, 0)
  assert.deepEqual(result.problems, [
    'Do not spell the canonical scene: packages/ui/previews/button/button.default.preview.tsx',
    'Preview is outside an admitted owner: registry/patterns/calendar/nested/single-basic.preview.tsx',
    'Missing canonical preview: component/button',
  ])
})

test('catalog closure reports missing, duplicate, orphaned, and distributed previews together', () => {
  const packageDocument = {
    exports: {
      '.': {},
      './button': {},
      './class-name': {},
      './theme.css': {},
      './package.json': {},
    },
  }
  const registry = {
    items: [
      {
        name: 'pattern-calendar-single-basic',
        meta: { canonicalAddress: 'pattern/calendar/single-basic' },
        files: [{ path: 'single-basic.preview.tsx' }],
      },
    ],
  }
  const result = catalogProblems({
    packageDocument,
    registry,
    previews: [
      'packages/ui/previews/button/button.preview.tsx',
      'registry/patterns/calendar/single-basic.empty.preview.tsx',
      'registry/blocks/dashboard/overview.preview.tsx',
      'registry/blocks/dashboard/overview.preview.tsx',
    ],
  })
  assert.equal(result.expected, 2)
  assert.deepEqual(result.problems, [
    'Orphan preview block/dashboard/overview#default: registry/blocks/dashboard/overview.preview.tsx',
    'Duplicate preview block/dashboard/overview#default: registry/blocks/dashboard/overview.preview.tsx and registry/blocks/dashboard/overview.preview.tsx',
    'Orphan preview block/dashboard/overview#default: registry/blocks/dashboard/overview.preview.tsx',
    'Missing canonical preview: pattern/calendar/single-basic',
    'Registry item pattern-calendar-single-basic distributes private catalog file single-basic.preview.tsx',
  ])
})
