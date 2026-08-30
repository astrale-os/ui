import type { NodeId } from '@astrale-os/sdk/graph/node'

import { Path } from '@astrale-os/sdk/graph/path'
import { defineMutation } from '@astrale-os/sdk/mutation'

import type { UiSchema } from '#schema'

export const confirmRequestSubmission = defineMutation<UiSchema>()((domain) => ({
  id: 'ui.request.confirm-submission',
  build(
    input: {
      readonly requestId: NodeId
      readonly owner: NodeId
      readonly collaborationUrl: string
    },
    mutation,
  ) {
    mutation.transition({
      node: Path.id(input.requestId),
      class: domain.classes.Request,
      property: 'submission',
      from: 'outcome-unknown',
      event: 'reconcile',
      props: { equals: { ownerId: input.owner }, absent: ['collaborationUrl'] },
      update: { set: { collaborationUrl: input.collaborationUrl } },
    })
  },
}))
