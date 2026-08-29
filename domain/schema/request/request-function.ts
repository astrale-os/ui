import { func } from '@astrale-os/sdk/schema'
import { z } from 'zod'

export const requestIdValue = z.string().min(1)

export const requestIntentValue = z.string().min(1).max(512)
export const requestIdempotencyKeyValue = z.string().min(1).max(128)
export const collaborationUrlValue = z.string().min(1).max(8_192)

export const requestInput = z.strictObject({
  intent: requestIntentValue,
  idempotencyKey: requestIdempotencyKeyValue,
})

export const requestOutput = z.discriminatedUnion('state', [
  z.strictObject({
    state: z.literal('submitted'),
    requestId: requestIdValue,
    collaborationUrl: collaborationUrlValue,
  }),
  z.strictObject({ state: z.literal('pending'), requestId: requestIdValue }),
  z.strictObject({ state: z.literal('outcome-unknown'), requestId: requestIdValue }),
  z.strictObject({ state: z.literal('failed'), requestId: requestIdValue }),
  z.strictObject({ state: z.literal('conflict'), requestId: requestIdValue }),
])

export const request = func({
  description: 'Retain one idempotent UI need and expose its collaboration receipt.',
  auth: 'authenticated',
  input: requestInput,
  output: requestOutput,
})
