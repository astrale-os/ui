import { policy } from '@astrale-os/sdk/schema'

import { request_owned_by } from './request-owned-by.js'

export const ManageRequest = policy({
  description: 'The caller holds the optional observation grant for this Request.',
  match: ({ edge, object, subject }) =>
    edge({ source: subject, class: () => request_owned_by, target: object }),
})

export const TraverseOwnedRequest = policy({
  description: 'A Request observation grant is visible only to its granted Identity.',
  match: ({ edge, subject, target }) =>
    edge({ source: subject, class: () => request_owned_by, target }),
})
