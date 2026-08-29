import { K } from '@astrale-os/sdk/schema'

import { application } from '../application.js'
import runtime from '../runtime.js'
import { schema } from '../schema/index.js'

describe('UI application composition', () => {
  it('retains the graph capabilities required by its Request workflow', () => {
    expect(application.schema).toBe(schema)
    expect(application.runtime).toBe(runtime)
    expect(application.requirements).toEqual({
      callables: [K.functions.mutate.key, K.functions.query.key].sort(),
      classes: [],
    })
  })
})
