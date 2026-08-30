import { defineApplication, requirements } from '@astrale-os/sdk/application'
import { K } from '@astrale-os/sdk/schema'

import { schema } from '#schema'

import runtime from './runtime.js'

/** Exact Schema and Runtime composition; deployment remains adapter-owned. */
export const application = defineApplication({
  schema,
  runtime,
  requirements: requirements({ functions: [K.functions.query, K.functions.mutate] }),
})
