import { K, nodeClass, property, stateProperty, classIcon } from '@astrale-os/sdk/schema'
import { Inbox } from '@astrale-os/sdk/schema/icons'

import {
  requestIdValue,
  collaborationUrlValue,
  requestIdempotencyKeyValue,
  requestIntentValue,
} from './request-function.js'
import { ManageRequest } from './request-policies.js'
import { requestSubmission } from './states/index.js'

export const Request = nodeClass({
  description: 'One idempotent UI capability request and its external collaboration receipt.',
  icon: classIcon.lucide(Inbox),
  extends: [K.classes.Timestamped],
  properties: {
    ownerId: requestIdValue,
    intent: requestIntentValue,
    idempotencyKey: requestIdempotencyKeyValue,
    submission: stateProperty(requestSubmission),
    collaborationUrl: property(collaborationUrlValue, { required: false }),
  },
  policies: { read: () => ManageRequest },
})
