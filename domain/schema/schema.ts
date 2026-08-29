import type { schema as language } from '@astrale-os/sdk/schema'

import { KernelSchema, defineSchema } from '@astrale-os/sdk/schema'

import {
  ManageRequest,
  Request,
  TraverseOwnedRequest,
  request,
  request_owned_by,
} from '#schema/request'

export const ORIGIN = 'ui.astrale.ai' as const

export const schema = defineSchema(ORIGIN, {
  dependencies: { kernel: KernelSchema },
  classes: { Request, request_owned_by },
  policies: { ManageRequest, TraverseOwnedRequest },
  functions: { request },
})

export type UiSchema = typeof schema
export type UiDomain = language.DomainOf<typeof schema>
