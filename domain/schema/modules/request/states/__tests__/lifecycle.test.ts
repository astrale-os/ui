import { requestSubmission } from '../index.js'

const legal = [
  ['pending', 'uncertain', 'outcome-unknown'],
  ['outcome-unknown', 'reconcile', 'submitted'],
  ['outcome-unknown', 'reject', 'failed'],
  ['failed', 'retry', 'pending'],
] as const

describe('Request submission', () => {
  it('owns the complete legal and illegal submission relation', () => {
    expect(requestSubmission.initial).toBe('pending')
    expect(requestSubmission.transitions).toEqual({
      failed: { retry: 'pending' },
      'outcome-unknown': { reconcile: 'submitted', reject: 'failed' },
      pending: { uncertain: 'outcome-unknown' },
      submitted: {},
    })
    const states = Object.keys(requestSubmission.transitions)
    const events = [
      ...new Set(
        Object.values(requestSubmission.transitions).flatMap((outgoing) => Object.keys(outgoing)),
      ),
    ]
    for (const from of states) {
      for (const event of events) {
        const expected = legal.find(([state, candidate]) => state === from && candidate === event)
        const decision = requestSubmission.decide(from as never, event as never)
        if (expected === undefined) {
          expect(decision).toEqual({
            kind: 'rejected',
            code: 'STATE_TRANSITION_ILLEGAL',
            from,
            event,
          })
        } else {
          expect(decision).toEqual({
            kind: 'allowed',
            transition: { from, event, to: expected[2] },
          })
        }
      }
    }
  })
})
