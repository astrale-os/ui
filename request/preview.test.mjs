import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createPreviewPlan } from './preview-plan.mjs'

const previews = [
  'packages/ui/previews/button/button.preview.tsx',
  'packages/ui/previews/button/button.loading.preview.tsx',
  'registry/patterns/message/thread.preview.tsx',
  'registry/variants/source/components/card/card-01/card-01.preview.tsx',
]

test('maps changed UI owners to exact deduplicated preview identities', () => {
  assert.deepEqual(
    createPreviewPlan(
      [
        'packages/ui/src/actions/button/index.tsx',
        'packages/ui/previews/button/button.loading.preview.tsx',
        'registry/variants/source/components/card/card-01/card-01.tsx',
      ],
      previews,
    ),
    {
      version: 1,
      previews: [
        {
          id: 'component/button#default',
          address: 'component/button',
          scene: 'default',
          screenshot: 'screenshots/component-button-default-ab3fd98299e3.png',
        },
        {
          id: 'component/button#loading',
          address: 'component/button',
          scene: 'loading',
          screenshot: 'screenshots/component-button-loading-7ec7aa7060fe.png',
        },
        {
          id: 'component/card/card-01#default',
          address: 'component/card/card-01',
          scene: 'default',
          screenshot: 'screenshots/component-card-card-01-default-909ef299115f.png',
        },
      ],
    },
  )
})

test('requires visual evidence for every request proposal', () => {
  assert.throws(
    () => createPreviewPlan(['request/README.md'], previews),
    /must affect at least one canonical preview/u,
  )
})

test('expands shared render changes instead of under-reporting one mapped owner', () => {
  const plan = createPreviewPlan(
    ['packages/ui/src/class-name.ts', 'packages/ui/src/actions/button/index.tsx'],
    previews,
  )
  assert.deepEqual(
    plan.previews.map((preview) => preview.id),
    [
      'component/button#default',
      'component/button#loading',
      'component/card/card-01#default',
      'pattern/message/thread#default',
    ],
  )
})

test('assigns collision-free screenshot paths to distinct preview identities', () => {
  const plan = createPreviewPlan(
    [
      'packages/ui/previews/foo-bar/foo-bar.loading.preview.tsx',
      'registry/variants/source/components/foo/bar/bar.loading.preview.tsx',
    ],
    [
      'packages/ui/previews/foo-bar/foo-bar.loading.preview.tsx',
      'registry/variants/source/components/foo/bar/bar.loading.preview.tsx',
    ],
  )
  assert.equal(plan.previews.length, 2)
  assert.equal(new Set(plan.previews.map((preview) => preview.screenshot)).size, 2)
})

function previewArtifact(root) {
  mkdirSync(path.join(root, 'site'), { recursive: true })
  mkdirSync(path.join(root, 'screenshots'), { recursive: true })
  writeFileSync(
    path.join(root, 'site', 'index.html'),
    '<!doctype html><html><head><title>Preview</title></head><body></body></html>',
  )
  writeFileSync(path.join(root, 'screenshots', 'component-button-default-ab3fd98299e3.png'), 'png')
  writeFileSync(
    path.join(root, 'manifest.json'),
    JSON.stringify({
      version: 1,
      previews: [
        {
          id: 'component/button#default',
          address: 'component/button',
          scene: 'default',
          screenshot: 'screenshots/component-button-default-ab3fd98299e3.png',
        },
      ],
    }),
  )
}

function publish(root, output) {
  return spawnSync(
    process.execPath,
    [
      'request/preview-publisher.mjs',
      '--root',
      root,
      '--origin',
      'https://astrale-os.github.io/ui/pr-123',
      '--pull-request',
      'https://github.com/astrale-os/ui/pull/123',
      '--revision',
      'a'.repeat(40),
      '--run-url',
      'https://github.com/astrale-os/ui/actions/runs/456',
      '--output',
      output,
    ],
    { cwd: path.resolve('.'), encoding: 'utf8' },
  )
}

test('admits bounded static bytes and renders one exact revision evidence comment', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ui-request-preview-'))
  const output = path.join(root, 'comment.md')
  try {
    previewArtifact(root)
    const result = publish(root, output)
    assert.equal(result.status, 0, result.stderr)
    const comment = readFileSync(output, 'utf8')
    assert.match(comment, /<!-- astrale-ui-request-preview:v1 -->/u)
    assert.match(comment, /component%2Fbutton%23default/u)
    assert.match(comment, /revision=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/u)
    assert.match(comment, /ui\/pr-123\/_evidence\/component-button-default-ab3fd98299e3\.png/u)
    assert.match(comment, /revision=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/u)
    assert.ok(comment.includes(`Revision: [\`${'a'.repeat(12)}\`]`))
    assert.match(comment, /apply `ui:ready` to this PR/u)
    assert.match(
      readFileSync(path.join(root, 'site', 'index.html'), 'utf8'),
      /<meta name="astrale-ui-request-revision" content="a{40}">/u,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('publisher rejects symlinks before rendering or transferring candidate bytes', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ui-request-preview-'))
  const output = path.join(root, 'comment.md')
  try {
    previewArtifact(root)
    symlinkSync('/etc/passwd', path.join(root, 'site', 'escape'))
    const result = publish(root, output)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /contains a symlink/u)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('publisher rejects nested Git metadata before Pages publication', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ui-request-preview-'))
  const output = path.join(root, 'comment.md')
  try {
    previewArtifact(root)
    mkdirSync(path.join(root, 'site', '.git'), { recursive: true })
    writeFileSync(path.join(root, 'site', '.git', 'config'), 'untrusted')
    const result = publish(root, output)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /contains Git metadata/u)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('publisher rejects two identities bound to one screenshot path', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ui-request-preview-'))
  const output = path.join(root, 'comment.md')
  try {
    previewArtifact(root)
    const manifestPath = path.join(root, 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.previews.push({
      id: 'component/card#default',
      address: 'component/card',
      scene: 'default',
      screenshot: manifest.previews[0].screenshot,
    })
    writeFileSync(manifestPath, JSON.stringify(manifest))
    const result = publish(root, output)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /duplicate screenshot paths/u)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
