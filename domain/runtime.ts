import type { Providers } from '@astrale-os/sdk/integration'
import type { Runtime } from '@astrale-os/sdk/runtime'

import { defineRuntime } from '@astrale-os/sdk/runtime'

import type { schema } from '#schema'

import { requestWorkflow } from '#functions/request'
import { integrations } from '#integrations'
import {
  createGitHubRequestSubmissionProvider,
  githubRequestSubmissionConfigurationFromEnvironment,
  type GitHubRequestSubmissionEnvironment,
} from '#providers/github'

export type Environment = GitHubRequestSubmissionEnvironment

const runtime: Runtime<
  typeof schema,
  typeof integrations,
  (environment: Environment) => { readonly providers: Providers<typeof integrations> }
> = defineRuntime<typeof schema>()({
  integrations,
  initialize(environment: Environment) {
    const providers = {
      requestSubmission: createGitHubRequestSubmissionProvider({
        ...githubRequestSubmissionConfigurationFromEnvironment(environment),
      }),
    } satisfies Providers<typeof integrations>
    return { providers }
  },
  functions: [requestWorkflow],
})

export default runtime
