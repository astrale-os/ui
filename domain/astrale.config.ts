import { cloudflare } from '@astrale-os/adapter-cloudflare'
import { deploy, runtime } from '@astrale-os/sdk/deployment'
import { defineProject } from '@astrale-os/sdk/project'

import { application } from './application.js'

const providerWrangler = {
  compatibility_flags: ['global_fetch_strictly_public'],
} as const

/** Direct provider deployment; installation is explicit on each target Kernel. */
export default defineProject({
  deployment: deploy({
    application,
    entrypoint: runtime('./runtime.ts'),
    adapter: cloudflare({
      dev: {
        secrets: '.env.dev',
        router: false,
        wrangler: providerWrangler,
      },
      prod: {
        route: 'ui.astrale.ai',
        secrets: '.env.prod',
        signingIdentity: '.astrale/identity.json',
        router: false,
        wrangler: providerWrangler,
      },
    }),
  }),
})
