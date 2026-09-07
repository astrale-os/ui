import { policy } from '@astrale-os/sdk/schema'

import { request_owned_by } from '../classes/request-owned-by.js'

export const TraverseOwnedRequest = policy({
  description: 'A Request observation grant is visible only to its granted Identity.',
  match: ({ edge, subject, target }) =>
    edge({ source: subject, class: () => request_owned_by, target }),
})
