import type { NodeId } from '@astrale-os/sdk/graph/node'

import { Path } from '@astrale-os/sdk/graph/path'
import { defineMutation } from '@astrale-os/sdk/mutation'

import type { UiSchema } from '#schema'

export const reserveRequestSubmission = defineMutation<UiSchema>()((domain) => ({
  id: 'ui.request.reserve-submission',
  build(input: { readonly requestId: NodeId; readonly owner: NodeId }, mutation) {
    mutation.transition({
      node: Path.id(input.requestId),
      class: domain.classes.Request,
      property: 'submission',
      from: 'pending',
      event: 'uncertain',
      props: { equals: { ownerId: input.owner }, absent: ['collaborationUrl'] },
    })
  },
}))
