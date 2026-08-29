import { requestSubmission } from '../index.js'

describe('Request submission Integration', () => {
  it('owns one unsafe submission and one safe reconciliation operation', () => {
    expect(requestSubmission.id).toBe('ui-request-submission')
    expect(Object.keys(requestSubmission.operations).sort()).toEqual(['reconcile', 'submit'])
    expect(requestSubmission.operations.submit.replay).toEqual({ kind: 'unsafe' })
    expect(requestSubmission.operations.reconcile.replay).toEqual({ kind: 'safe' })
  })
})
