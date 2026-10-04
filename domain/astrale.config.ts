import type { CloudflareNamespace } from '@astrale-os/adapter-cloudflare'

import { cloudflare } from '@astrale-os/adapter-cloudflare'
import { defineProject } from '@astrale-os/sdk/project'

import { domain } from './domain.js'

/**
 * The platform dispatch namespace the platform Domains deploy into (D4). Each release of an
 * Environment becomes one immutable deployment there, on the readable line of `ui.astrale.ai` in
 * that Environment, at `https://<label>.platform.astrale.ai`. A deploy never replaces another
 * deployment and never installs: `astrale domain install <url>` installs the URL it prints.
 */
const PLATFORM_NAMESPACE = {
  name: 'astrale-platform',
  routingDomain: 'platform.astrale.ai',
} as const satisfies CloudflareNamespace

/** Remote deployment only. Kernel installation is an explicit consumer operation. */
export default defineProject({
  domain,
  environments: {
    development: {
      deployment: cloudflare({
        namespace: PLATFORM_NAMESPACE,
        secrets: '.env.dev',
        router: false,
      }),
    },
    production: {
      deployment: cloudflare({
        namespace: PLATFORM_NAMESPACE,
        secrets: '.env.prod',
        router: false,
      }),
    },
  },
})
