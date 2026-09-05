import { K, classIcon, nodeClass, property, stateProperty } from '@astrale-os/sdk/schema'
import { Inbox } from '@astrale-os/sdk/schema/icons'

import { ManageRequest } from '../policies/index.js'
import { requestSubmission } from '../states/index.js'
import {
  requestIdValue,
  collaborationUrlValue,
  requestIdempotencyKeyValue,
  requestIntentValue,
} from '../types/index.js'

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
