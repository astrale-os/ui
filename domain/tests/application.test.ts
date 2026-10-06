import { K } from '@astrale-os/sdk/schema'

import { domain } from '../domain.js'
import runtime from '../runtime.js'
import { schema } from '../schema/index.js'

describe('UI Domain definition', () => {
  it('retains the graph capabilities required by its Request workflow', () => {
    expect(domain.schema).toBe(schema)
    expect(domain.runtime).toBe(runtime)
    expect(domain.requirements).toEqual({
      functions: [K.functions.mutate.key, K.functions.query.key].sort(),
      classes: [],
      core: [],
    })
  })
})
