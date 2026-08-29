import { policy } from '@astrale-os/sdk/schema'

import { request_owned_by } from './request-owned-by.js'

export const ManageRequest = policy({
  description: 'The caller is the exact Identity that submitted this Request.',
  match: ({ edge, object, subject }) =>
    edge({ source: subject, class: () => request_owned_by, target: object }),
})

export const TraverseOwnedRequest = policy({
  description: 'Request ownership is visible only to the submitting Identity.',
  match: ({ allOf, edge, source, subject, target }) =>
    allOf(
      edge({ source: subject, class: () => request_owned_by, target }),
      edge({ source, class: () => request_owned_by, target }),
    ),
})
