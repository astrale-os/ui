import { deploymentLine } from '@astrale-os/sdk/deployment/address'

import project from '../../astrale.config.js'
import manifest from '../../package.json' with { type: 'json' }
import { ORIGIN } from '../../schema/schema.js'

/** The platform dispatch namespace every platform Domain deploys into (D4). */
const PLATFORM_NAMESPACE = { name: 'astrale-platform', routingDomain: 'platform.astrale.ai' }
/** The adapter-cloudflare parameters that select the legacy direct mode (CT33 `legacy-direct`). */
const DIRECT_PARAMETERS = ['route', 'workerName', 'identityIssuer', 'addressing', 'signingIdentity']
/** The secret names the request-submission Provider reads (`.env.example`). */
const SECRETS = ['GITHUB_ACTOR', 'GITHUB_OWNER', 'GITHUB_REPOSITORY', 'GITHUB_TOKEN']
/** The gitignored secrets file of each Environment; the names the direct mode already used. */
const SECRETS_FILES: Readonly<Record<string, string>> = {
  development: '.env.dev',
  production: '.env.prod',
}
const SIGNAL = new AbortController().signal

const environments = Object.entries(project.environments)

describe('ui Domain deployment configuration', () => {
  it('deploys only to the development and production namespace Environments', () => {
    // The direct `prod` Environment is gone: the stable Worker ui.astrale.ai keeps its deployed
    // code and is never redeployed from main (AM-75).
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
      for (const name of DIRECT_PARAMETERS) expect(parameters[name]).toBeUndefined()
      // An immutable deployment runs no cron of its own and binds only its frozen configuration.
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
      expect(configuration.bindings).toEqual({ services: [], secrets: SECRETS })
      expect(configuration.router).toBe(false)
      // The GitHub Provider's subrequests keep the public-fetch flag the direct mode set by hand.
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
})
