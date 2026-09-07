import { cloudflare } from '@astrale-os/adapter-cloudflare'
import { defineProject } from '@astrale-os/sdk/project'

import { application } from './application.js'

const providerWrangler = {
  compatibility_flags: ['global_fetch_strictly_public'],
} as const

/** Remote deployment only. Kernel installation is an explicit consumer operation. */
export default defineProject({
  application,
  environments: {
    development: {
      deployment: cloudflare({
        secrets: '.env.dev',
        router: false,
        wrangler: providerWrangler,
      }),
    },
    prod: {
      deployment: cloudflare({
        route: 'ui.astrale.ai',
        secrets: '.env.prod',
        signingIdentity: '.astrale/identity.json',
        router: false,
        wrangler: providerWrangler,
      }),
    },
  },
})
