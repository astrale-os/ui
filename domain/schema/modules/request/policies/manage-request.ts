import { policy } from '@astrale-os/sdk/schema'

import { request_owned_by } from '../classes/request-owned-by.js'

export const ManageRequest = policy({
  description: 'The caller holds the optional observation grant for this Request.',
  match: ({ edge, object, subject }) =>
    edge({ source: subject, class: () => request_owned_by, target: object }),
})
