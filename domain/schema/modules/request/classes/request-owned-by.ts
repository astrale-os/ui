import { K, edgeClass } from '@astrale-os/sdk/schema'

import { TraverseOwnedRequest } from '../policies/request.js'
import { Request } from './request.js'

export const request_owned_by = edgeClass.directed({
  description: 'An optional caller-facing observation grant for one Request.',
  source: { as: 'owner', accepts: [K.classes.Identity], outgoing: '0..*' },
  target: { as: 'request', accepts: [() => Request], incoming: '0..1' },
  policies: { traverse: () => TraverseOwnedRequest },
})
