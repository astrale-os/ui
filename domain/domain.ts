import { defineDomain, requirements } from '@astrale-os/sdk/domain'
import { K } from '@astrale-os/sdk/schema'

import { schema } from '#schema'

import runtime from './runtime.js'

/** Exact Schema and Runtime composition; deployment remains adapter-owned. */
export const domain = defineDomain({
  schema,
  runtime,
  requirements: requirements({ functions: [K.functions.query, K.functions.mutate] }),
})
