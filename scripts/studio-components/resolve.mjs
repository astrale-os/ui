import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const inventory = JSON.parse(await readFile('.history/studio-components-v1/inventory.json', 'utf8'))
const arguments_ = process.argv.slice(2)
const familyIndex = arguments_.indexOf('--family')
const requestedFamily = familyIndex >= 0 ? arguments_[familyIndex + 1] : undefined
const all = arguments_.includes('--all')
assert.ok(all || requestedFamily, 'usage: pnpm studio:resolve -- --family Accordion | --all')
assert.ok(!(all && requestedFamily), 'choose --family or --all')

const selected = requestedFamily
  ? inventory.filter((item) => item.family.toLowerCase() === requestedFamily.toLowerCase())
  : inventory
assert.ok(selected.length > 0, `unknown family: ${requestedFamily}`)

const hasEmail = Boolean(process.env.EMAIL)
const hasLicenseKey = Boolean(process.env.LICENSE_KEY)
assert.equal(hasEmail, hasLicenseKey, 'configure both EMAIL and LICENSE_KEY or neither')
const internal = '.internal/shadcn-studio'
const stage = path.join(internal, 'stage')
const resolvedRoot = path.join(internal, 'resolved/base-nova')
await mkdir(path.join(stage, 'src'), { recursive: true })
await mkdir(resolvedRoot, { recursive: true })
await writeFile(
  path.join(stage, 'package.json'),
  `${JSON.stringify(
    {
      name: 'astrale-studio-resolution-stage',
      private: true,
      type: 'module',
      dependencies: { react: '19.2.8', 'react-dom': '19.2.8', tailwindcss: '4.3.3' },
    },
    null,
    2,
  )}\n`,
)
await writeFile(
  path.join(stage, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: { baseUrl: '.', jsx: 'react-jsx', paths: { '@/*': ['./src/*'] } },
      include: ['src'],
    },
    null,
    2,
  )}\n`,
)
await writeFile(
  path.join(stage, 'components.json'),
  `${JSON.stringify(
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
      iconLibrary: 'lucide',
      rtl: false,
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
      registries: {
        '@ss-components': hasEmail
          ? {
              url: 'https://shadcnstudio.com/r/components/{style}/{name}.json',
              params: { email: '${EMAIL}', license_key: '${LICENSE_KEY}' },
            }
          : 'https://shadcnstudio.com/r/components/{style}/{name}.json',
      },
    },
    null,
    2,
  )}\n`,
)
await writeFile(path.join(stage, 'src/index.css'), '@import "tailwindcss";\n')

function digest(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

const families = [...Map.groupBy(selected, (item) => item.family)]
const records = []
for (const [family, items] of families) {
  process.stderr.write(`Resolving ${family} (${items.length})\n`)
  await execute(
    'pnpm',
    [
      'dlx',
      'shadcn@4.18.0',
      'add',
      ...items.map((item) => item.upstreamAddress),
      '--yes',
      '--overwrite',
      '--silent',
    ],
    { cwd: stage, maxBuffer: 16 * 1024 * 1024, env: process.env },
  )

  for (const expected of items) {
    const upstream = JSON.parse(
      await readFile(
        path.join(internal, 'upstream/base-nova', `${expected.upstreamId}.json`),
        'utf8',
      ),
    )
    const files = []
    for (const source of upstream.files) {
      const emittedPath = path.join(stage, 'src', source.target)
      const content = await readFile(emittedPath, 'utf8')
      const snapshotPath = path.join(resolvedRoot, expected.upstreamId, source.target)
      await mkdir(path.dirname(snapshotPath), { recursive: true })
      await writeFile(snapshotPath, content)
      files.push({
        upstreamPath: source.path,
        target: source.target,
        type: source.type,
        resolvedSnapshot: snapshotPath,
        resolvedDigest: digest(content),
      })
    }
    records.push({
      upstreamId: expected.upstreamId,
      canonicalAddress: expected.canonicalAddress,
      files,
    })
  }
}

records.sort((left, right) => left.upstreamId.localeCompare(right.upstreamId))
const reportPath = path.join(
  internal,
  requestedFamily ? `resolve-${selected[0].familySlug}.json` : 'resolve-all.json',
)
await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      profile: { cli: '4.18.0', style: 'base-nova', base: 'base', iconLibrary: 'lucide' },
      expected: selected.length,
      resolved: records.length,
      items: records,
    },
    null,
    2,
  )}\n`,
)
console.log(`PASS Studio resolution (${records.length}/${selected.length}; ${reportPath})`)
