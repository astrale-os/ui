import { K, edgeClass } from '@astrale-os/sdk/schema'

import { TraverseOwnedRequest } from './request-policies.js'
import { Request } from './request.js'

export const request_owned_by = edgeClass.directed({
  description: 'The Identity that submitted and may observe one Request.',
  source: { as: 'owner', accepts: [K.classes.Identity], outgoing: '0..*' },
  target: { as: 'request', accepts: [() => Request], incoming: '1' },
  policies: { traverse: () => TraverseOwnedRequest },
})
