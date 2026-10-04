/**
 * The namespace deploy fixture's process: `astrale-domain deploy` of the ui Domain against a fake
 * Cloudflare account, run in this process under Bun with the copied Project as working directory
 * (namespace-deploy.test.ts starts it). `fetch` is the fake account's for the whole process, so
 * no deploy step can reach a real host. It deploys production, rotates a secret value and deploys
 * the same release again, then deploys development, and writes what each run printed and what the
 * fake account holds to the report file the test names.
 */

import { run } from '@astrale-os/sdk/cli'
import { compile } from '@astrale-os/sdk/deployment/build'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { application } from '../../../application.js'
import project from '../../../astrale.config.js'
import runtime from '../../../runtime.js'
import { FakeCloudflare } from './fake-cloudflare.js'

/** The platform namespace the ui Domain's configuration names. */
const NAMESPACE = 'astrale-platform'
const ROUTING_DOMAIN = 'platform.astrale.ai'

const report = process.env.UI_NAMESPACE_DEPLOY_REPORT
if (report === undefined) throw new Error('UI_NAMESPACE_DEPLOY_REPORT names no report file.')
// Only the namespace mode deploys through `fetch` alone: the legacy direct mode would run wrangler,
// which this process cannot fake. Refuse it before any deploy.
for (const [name, { deployment }] of Object.entries(project.environments)) {
  if (deployment.parameters.namespace?.name !== NAMESPACE) {
    throw new Error(`Environment ${name} does not deploy into the ${NAMESPACE} namespace.`)
  }
}

const fake = new FakeCloudflare({
  namespace: NAMESPACE,
  routingDomain: ROUTING_DOMAIN,
  routingKvTitle: routingKvTitle(NAMESPACE),
  build: compile(application),
  runtime,
})
globalThis.fetch = Object.assign(fake.fetch, { preconnect: () => {} }) as typeof fetch

const runs = [
  await deploy(['deploy', 'production', '--json']),
  await deploy(['deploy', 'production', '--json'], () =>
    writeSecrets('.env.prod', 'production-token-rotated'),
  ),
  await deploy(['deploy', 'development', '--json']),
]

writeFileSync(
  report,
  JSON.stringify({
    runs,
    requests: fake.requests,
    routing: Object.fromEntries(fake.routing),
    scripts: [...fake.scripts].map(([name, script]) => ({ name, ...script })),
  }),
)

/** Run `astrale-domain <argv>` in this process, after `before`, and keep what it wrote to stdout. */
async function deploy(argv: readonly string[], before?: () => void) {
  before?.()
  const chunks: string[] = []
  const write = process.stdout.write.bind(process.stdout)
  process.stdout.write = ((chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk))
    return true
  }) as typeof process.stdout.write
  try {
    const exitCode = await run(argv)
    return { argv, exitCode, stdout: chunks.join('') }
  } catch (cause) {
    return { argv, exitCode: -1, stdout: chunks.join(''), error: String(cause) }
  } finally {
    process.stdout.write = write
  }
}

function writeSecrets(file: string, token: string): void {
  writeFileSync(
    join(process.cwd(), file),
    `GITHUB_TOKEN=${token}\nGITHUB_OWNER=astrale-os\nGITHUB_REPOSITORY=ui\nGITHUB_ACTOR=ui-fixture\n`,
  )
}

/** The routing KV title the platform provisioning derives from the namespace name (AM-131). */
function routingKvTitle(name: string): string {
  const digest = createHash('sha256').update(name, 'utf8').digest('hex').slice(0, 32)
  return `astrale-deployment-routing-${digest}`
}
