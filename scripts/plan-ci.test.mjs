import assert from 'node:assert/strict'
import test from 'node:test'

import { planCi } from './plan-ci.mjs'

test('classifies documentation and request tooling without UI qualification', () => {
  assert.deepEqual(planCi(['README.md', 'request/.history/v2/LEDGER.md']).plan, 'docs-only')
  assert.deepEqual(planCi(['request/run.mjs', 'request/run.test.mjs']).plan, 'request-tooling')
})

test('derives affected families from physical registry ownership', () => {
  assert.deepEqual(
    planCi([
      'registry/components/button/button-01.tsx',
      'registry/components/button/button-01.preview.tsx',
      'registry/patterns/calendar/range.tsx',
    ]),
    {
      plan: 'family-scoped',
      families: ['component/button', 'pattern/calendar'],
      files: [
        'registry/components/button/button-01.preview.tsx',
        'registry/components/button/button-01.tsx',
        'registry/patterns/calendar/range.tsx',
      ],
    },
  )
})

test('falls closed to global UI for shared or unknown source', () => {
  assert.equal(planCi(['packages/ui/src/forms/button.tsx']).plan, 'global-ui')
  assert.equal(planCi(['scripts/mystery.mjs']).plan, 'global-ui')
  assert.equal(planCi(['registry/variants/catalog.json']).plan, 'global-ui')
})
