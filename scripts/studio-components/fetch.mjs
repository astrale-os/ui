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
assert.ok(all || requestedFamily, 'usage: pnpm studio:fetch -- --family Accordion | --all')
assert.ok(!(all && requestedFamily), 'choose --family or --all')

const selected = requestedFamily
  ? inventory.filter((item) => item.family.toLowerCase() === requestedFamily.toLowerCase())
  : inventory
assert.ok(selected.length > 0, `unknown family: ${requestedFamily}`)

const internal = '.internal/shadcn-studio'
const profile = path.join(internal, 'profile')
const hasEmail = Boolean(process.env.EMAIL)
const hasLicenseKey = Boolean(process.env.LICENSE_KEY)
assert.equal(hasEmail, hasLicenseKey, 'configure both EMAIL and LICENSE_KEY or neither')
await mkdir(path.join(profile, 'src'), { recursive: true })
await mkdir(path.join(internal, 'upstream/base-nova'), { recursive: true })
await writeFile(
  path.join(profile, 'components.json'),
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
await writeFile(path.join(profile, 'src/index.css'), '@import "tailwindcss";\n')

function digest(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

// shadcn's `view` output is truncated at 64 KiB by its command transport. Keep
// batches below that bound and reject any remaining truncation as invalid JSON.
const chunkSize = 8
const chunks = Array.from({ length: Math.ceil(selected.length / chunkSize) }, (_, index) =>
  selected.slice(index * chunkSize, index * chunkSize + chunkSize),
)
const records = []
let fetchedCount = 0
async function view(chunk) {
  const addresses = chunk.map((item) => item.upstreamAddress)
  const { stdout } = await execute('pnpm', ['dlx', 'shadcn@4.18.0', 'view', ...addresses], {
    cwd: profile,
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  })
  try {
    return JSON.parse(stdout)
  } catch (error) {
    assert.ok(chunk.length > 1, `invalid registry JSON for ${addresses[0]}: ${error.message}`)
    const middle = Math.ceil(chunk.length / 2)
    return [...(await view(chunk.slice(0, middle))), ...(await view(chunk.slice(middle)))]
  }
}

for (const chunk of chunks) {
  process.stderr.write(
    `Fetching ${fetchedCount + 1}-${fetchedCount + chunk.length}/${selected.length}\n`,
  )
  const response = await view(chunk)
  assert.equal(response.length, chunk.length, 'registry response count mismatch')
  const byName = new Map(response.map((item) => [item.name, item]))
  assert.equal(byName.size, response.length, 'duplicate registry response name')
  for (const expected of chunk) {
    const item = byName.get(expected.upstreamId)
    assert.ok(item, `registry omitted ${expected.upstreamId}`)
    assert.equal(item.name, expected.upstreamId)
    const body = `${JSON.stringify(item, null, 2)}\n`
    await writeFile(path.join(internal, 'upstream/base-nova', `${item.name}.json`), body)
    records.push({
      upstreamId: item.name,
      upstreamAddress: expected.upstreamAddress,
      canonicalAddress: expected.canonicalAddress,
      responseDigest: digest(body),
      files: item.files.map((file) => ({
        path: file.path,
        type: file.type,
        target: file.target,
        sourceDigest: digest(file.content),
      })),
    })
  }
  fetchedCount += chunk.length
}

records.sort((left, right) => left.upstreamId.localeCompare(right.upstreamId))
const reportPath = path.join(
  internal,
  requestedFamily ? `fetch-${selected[0].familySlug}.json` : 'fetch-all.json',
)
await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      profile: { cli: '4.18.0', style: 'base-nova', base: 'base', iconLibrary: 'lucide' },
      expected: selected.length,
      fetched: records.length,
      items: records,
    },
    null,
    2,
  )}\n`,
)
console.log(`PASS Studio fetch (${records.length}/${selected.length}; ${reportPath})`)
