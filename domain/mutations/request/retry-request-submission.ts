import type { NodeId } from '@astrale-os/sdk/graph/node'

import { Path } from '@astrale-os/sdk/graph/path'
import { defineMutation } from '@astrale-os/sdk/mutation'

import type { UiSchema } from '#schema'

export const retryRequestSubmission = defineMutation<UiSchema>()((domain) => ({
  id: 'ui.request.retry-submission',
  build(input: { readonly requestId: NodeId; readonly owner: NodeId }, mutation) {
    mutation.transition({
      node: Path.id(input.requestId),
      class: domain.classes.Request,
      property: 'submission',
      from: 'failed',
      event: 'retry',
      props: { equals: { ownerId: input.owner }, absent: ['collaborationUrl'] },
    })
  },
}))
