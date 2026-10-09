import { deploymentLine } from '@astrale-os/sdk/deployment/address'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import project from '../../astrale.config.js'
import manifest from '../../package.json' with { type: 'json' }
import { ORIGIN } from '../../schema/schema.js'

/** The platform dispatch namespace every platform Domain deploys into (D4). */
const PLATFORM_NAMESPACE = { name: 'astrale-platform', routingDomain: 'platform.astrale.ai' }
/**
 * Parameters outside the namespace deployment contract. The real namespace-deploy test exercises
 * the deployment adapter for both Environments.
 */
const UNSUPPORTED_PARAMETERS = [
  'route',
  'workerName',
  'identityIssuer',
  'addressing',
  'signingIdentity',
]
/** The secret names the request-submission Provider reads (`.env.example`). */
const SECRETS = ['GITHUB_ACTOR', 'GITHUB_OWNER', 'GITHUB_REPOSITORY', 'GITHUB_TOKEN']
/** The gitignored secrets file of each Environment. */
const SECRETS_FILES: Readonly<Record<string, string>> = {
  development: '.env.dev',
  production: '.env.prod',
}
const SIGNAL = new AbortController().signal
const projectDir = fileURLToPath(new URL('../..', import.meta.url))

const environments = Object.entries(project.environments)

describe('ui Domain deployment configuration', () => {
  it('deploys only to the development and production namespace Environments', () => {
    expect(Object.keys(project.environments).sort()).toEqual(['development', 'production'])
  })

  it.each(environments)(
    'selects the canonical namespace mode for %s (CT33)',
    (environment, { deployment }) => {
      const parameters: Readonly<Record<string, unknown>> = Object.fromEntries(
        Object.entries(deployment.parameters),
      )
      expect(deployment.adapter.name).toBe('cloudflare')
      expect(typeof deployment.adapter.deployRelease).toBe('function')
      expect(parameters.namespace).toEqual(PLATFORM_NAMESPACE)
      for (const name of UNSUPPORTED_PARAMETERS) expect(parameters[name]).toBeUndefined()
      // No wrangler overlay: the generated runtime sets global_fetch_strictly_public itself, which
      // the frozen configuration test below asserts.
      expect(parameters.wrangler).toBeUndefined()
      expect(parameters.secrets).toBe(SECRETS_FILES[environment])
    },
  )

  it.each(environments)(
    'places %s on the readable platform line of ui.astrale.ai',
    async (environment, { deployment }) => {
      const placement = await deployment.adapter.placement(deployment.parameters, {
        environment,
        signal: SIGNAL,
      })
      expect(placement).toEqual({
        addressing: 'readable',
        routingDomain: PLATFORM_NAMESPACE.routingDomain,
      })
      const line = deploymentLine({ origin: ORIGIN, environment, addressing: placement.addressing })
      expect(line).toMatch(new RegExp(`^ui-${environment.slice(0, 10)}-[a-z2-7]{16}$`, 'u'))
    },
  )

  it.each(environments)(
    'freezes the configuration of %s with public fetch and no router',
    (environment, { deployment }) => {
      const configuration = deployment.adapter.configure(deployment.parameters, {
        environment,
        secrets: SECRETS,
      })
      expect(configuration.vars).toEqual({})
      expect(configuration.bindings).toEqual({
        services: [],
        dispatchNamespaces: [],
        secrets: SECRETS,
      })
      expect(configuration.router).toBe(false)
      // Provider subrequests are restricted to public destinations.
      expect(configuration.runtime.compatibilityFlags).toEqual(
        expect.arrayContaining(['nodejs_compat', 'global_fetch_strictly_public']),
      )
    },
  )

  it('keeps one deploy script and no development session or stable-target deploy', () => {
    const scripts: Readonly<Record<string, string>> = manifest.scripts
    expect(scripts.deploy).toBe('astrale-domain deploy')
    expect(scripts).not.toHaveProperty('dev')
    expect(scripts).not.toHaveProperty('prod')
  })

  it.each(['prod', 'beta'])(
    'refuses `astrale-domain deploy %s` as an unknown Environment before any effect',
    (environment) => {
      const result = withoutEffects(() => astraleDomain(['deploy', environment]))
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        `Project has no Environment ${environment}; known Environments: development, production.`,
      )
      expect(result.stdout).toBe('')
    },
    120_000,
  )
})

/** Run one command and prove it left the Project's deploy state as it found it. */
function withoutEffects<Result>(command: () => Result): Result {
  const state = join(projectDir, '.astrale')
  const before = existsSync(state) ? readdirSync(state).sort() : undefined
  const result = command()
  expect(existsSync(state) ? readdirSync(state).sort() : undefined).toEqual(before)
  return result
}

/** The installed SDK's `astrale-domain`, run in this Project without Cloudflare credentials. */
function astraleDomain(argv: readonly string[]) {
  const manifestPath = createRequire(import.meta.url).resolve('@astrale-os/sdk/package.json')
  const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    readonly bin: { readonly 'astrale-domain': string }
  }
  return spawnSync(
    process.execPath,
    [join(dirname(manifestPath), bin['astrale-domain']), ...argv],
    {
      cwd: projectDir,
      encoding: 'utf8',
      env: { ...process.env, CLOUDFLARE_API_TOKEN: '', CLOUDFLARE_ACCOUNT_ID: '' },
    },
  )
}
