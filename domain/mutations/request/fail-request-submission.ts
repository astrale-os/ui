import type { NodeId } from '@astrale-os/sdk/graph/node'

import { Path } from '@astrale-os/sdk/graph/path'
import { defineMutation } from '@astrale-os/sdk/mutation'

import type { UiSchema } from '#schema'

export const failRequestSubmission = defineMutation<UiSchema>()((domain) => ({
  id: 'ui.request.fail-submission',
  build(input: { readonly requestId: NodeId; readonly owner: NodeId }, mutation) {
    mutation.expect.edge({
      class: domain.classes.request_owned_by,
      source: Path.id(input.owner),
      target: Path.id(input.requestId),
    })
    mutation.transition({
      node: Path.id(input.requestId),
      class: domain.classes.Request,
      property: 'submission',
      from: 'outcome-unknown',
      event: 'reject',
      props: { absent: ['collaborationUrl'] },
    })
  },
}))
