import { func } from '@astrale-os/sdk/schema'

import { requestInput, requestOutput } from '../types/index.js'

export const request = func({
  description: 'Retain one idempotent UI need and expose its collaboration receipt.',
  auth: 'authenticated',
  input: requestInput,
  output: requestOutput,
})
