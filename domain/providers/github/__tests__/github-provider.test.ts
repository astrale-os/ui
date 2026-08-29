import type { IntegrationExecution } from '@astrale-os/sdk/integration'

import { requireProvider } from '@astrale-os/sdk/integration'
import { vi } from 'vitest'

import { createGitHubRequestSubmissionProvider } from '../provider.js'
import { GitHubBoundaryError, IntegrationDeadlineError } from '../request-client.js'
import { githubRequestSubmissionConfigurationFromEnvironment } from '../runtime-environment.js'

const requestId = 'request-1'
const collaborationUrl = 'https://github.com/astrale-os/ui/issues/42'
const execution: IntegrationExecution = {
  callId: 'call-1',
  signal: new AbortController().signal,
  deadline: Date.now() + 60_000,
}

describe('GitHub request submission Provider', () => {
  it('admits the exact Runtime environment and rejects unstable credentials', () => {
    expect(
      githubRequestSubmissionConfigurationFromEnvironment({
        GITHUB_TOKEN: 'token',
        GITHUB_OWNER: 'astrale-os',
        GITHUB_REPOSITORY: 'ui',
        GITHUB_ACTOR: 'astrale-ui[bot]',
      }),
    ).toEqual({
      token: 'token',
      owner: 'astrale-os',
      repository: 'ui',
      actor: 'astrale-ui[bot]',
    })
    expect(() =>
      githubRequestSubmissionConfigurationFromEnvironment({
        GITHUB_TOKEN: ' ',
        GITHUB_OWNER: 'astrale-os',
        GITHUB_REPOSITORY: 'ui',
        GITHUB_ACTOR: 'astrale-ui[bot]',
      }),
    ).toThrow('GITHUB_TOKEN')
  })

  it('creates the exact bounded issue and admits its canonical receipt', async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        { number: 42, html_url: collaborationUrl, user: { login: 'astrale-ui[bot]' } },
        { status: 201 },
      ),
    )
    const implementation = provider(fetcher)
    await expect(
      implementation.submit({ requestId, intent: 'API status monitor' }, execution),
    ).resolves.toEqual({ kind: 'submitted', collaborationUrl })
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.test/repos/astrale-os/ui/issues')
    expect(init.method).toBe('POST')
    expect(Object.fromEntries(new Headers(init.headers).entries())).toEqual({
      accept: 'application/vnd.github+json',
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
      'user-agent': 'astrale-ui-domain',
      'x-github-api-version': '2026-03-10',
    })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(init.signal?.aborted).toBe(false)
    expect(JSON.parse(String(init.body))).toEqual({
      title: '[UI request]: API status monitor',
      body: '## UI need\n\nAPI status monitor\n\n<!-- astrale-ui-domain-request:request-1 -->',
    })
  })

  it('bounds the generated title by Unicode code point without truncating the issue body', async () => {
    const intent = '😀'.repeat(130)
    const fetcher = vi.fn(async () =>
      Response.json(
        { number: 42, html_url: collaborationUrl, user: { login: 'astrale-ui[bot]' } },
        { status: 201 },
      ),
    )
    await provider(fetcher).submit({ requestId, intent }, execution)
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({
      title: `[UI request]: ${'😀'.repeat(120)}`,
      body: `## UI need\n\n${intent}\n\n<!-- astrale-ui-domain-request:request-1 -->`,
    })
  })

  it('distinguishes known rejection, configuration defects, and uncertain effects', async () => {
    await expect(
      provider(async () => new Response('{}', { status: 422 })).submit(
        { requestId, intent: 'Need' },
        execution,
      ),
    ).resolves.toEqual({ kind: 'rejected' })
    await expect(
      provider(async () => new Response('{}', { status: 503 })).submit(
        { requestId, intent: 'Need' },
        execution,
      ),
    ).resolves.toEqual({ kind: 'outcome-unknown' })
    await expect(
      provider(async () => {
        throw new TypeError('network unavailable')
      }).submit({ requestId, intent: 'Need' }, execution),
    ).resolves.toEqual({ kind: 'outcome-unknown' })
    const forbidden = provider(async () => new Response('{}', { status: 403 })).submit(
      { requestId, intent: 'Need' },
      execution,
    )
    await expect(forbidden).rejects.toBeInstanceOf(GitHubBoundaryError)
    await expect(forbidden).rejects.toMatchObject({
      name: 'GitHubBoundaryError',
      status: 403,
    })
    await expect(
      provider(async () => Response.json({ number: 42, html_url: 'https://evil.test/42' })).submit(
        { requestId, intent: 'Need' },
        execution,
      ),
    ).resolves.toEqual({ kind: 'outcome-unknown' })
    await expect(
      provider(async () =>
        Response.json({
          number: 42,
          html_url: collaborationUrl,
          user: { login: 'untrusted-user' },
        }),
      ).submit({ requestId, intent: 'Need' }, execution),
    ).resolves.toEqual({ kind: 'outcome-unknown' })
  })

  it('reconciles exactly one trusted marker and treats a complete empty scan as unresolved', async () => {
    const urls: string[] = []
    const submitted = provider(async (request, init) => {
      urls.push(String(request))
      expect(init?.method).toBe('GET')
      return Response.json([
        issue(9, 'unrelated'),
        issue(42, '## UI need\n\nNeed\n\n<!-- astrale-ui-domain-request:request-1 -->'),
      ])
    })
    await expect(
      submitted.reconcile({ requestId, notBefore: '2026-08-29T12:00:00.000Z' }, execution),
    ).resolves.toEqual({ kind: 'submitted', collaborationUrl })
    const submittedUrl = new URL(urls[0] ?? '')
    expect(submittedUrl.pathname).toBe('/repos/astrale-os/ui/issues')
    expect(Object.fromEntries(submittedUrl.searchParams)).toEqual({
      state: 'all',
      sort: 'created',
      direction: 'desc',
      since: '2026-08-29T11:50:00.000Z',
      per_page: '100',
      page: '1',
    })

    const absent = provider(async () => Response.json([issue(9, 'unrelated')]))
    await expect(
      absent.reconcile({ requestId, notBefore: '2026-08-29T12:00:00.000Z' }, execution),
    ).resolves.toEqual({ kind: 'unresolved' })

    const forged = provider(async () =>
      Response.json([
        {
          ...issue(42, 'Need\n\n<!-- astrale-ui-domain-request:request-1 -->'),
          user: { login: 'untrusted-user' },
        },
      ]),
    )
    await expect(
      forged.reconcile({ requestId, notBefore: '2026-08-29T12:00:00.000Z' }, execution),
    ).resolves.toEqual({ kind: 'unresolved' })
  })

  it('keeps ambiguous, incomplete, and unavailable reconciliation unresolved', async () => {
    const ambiguous = provider(async () =>
      Response.json([
        issue(41, 'Need\n\n<!-- astrale-ui-domain-request:request-1 -->'),
        issue(42, 'Need\n\n<!-- astrale-ui-domain-request:request-1 -->'),
      ]),
    )
    await expect(
      ambiguous.reconcile({ requestId, notBefore: '2026-08-29T12:00:00.000Z' }, execution),
    ).resolves.toEqual({ kind: 'unresolved' })

    const fullPage = Array.from({ length: 100 }, (_, index) => issue(index + 1, 'unrelated'))
    const fetchedUrls: string[] = []
    const fetcher = vi.fn(async (request: string | URL | Request) => {
      fetchedUrls.push(String(request))
      return Response.json(fullPage)
    })
    await expect(
      provider(fetcher).reconcile({ requestId, notBefore: '2026-08-29T12:00:00.000Z' }, execution),
    ).resolves.toEqual({ kind: 'unresolved' })
    expect(fetcher).toHaveBeenCalledTimes(10)
    expect(fetchedUrls.map((value) => new URL(value).searchParams.get('page'))).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ])

    await expect(
      provider(async () => new Response('{}', { status: 503 })).reconcile(
        { requestId, notBefore: '2026-08-29T12:00:00.000Z' },
        execution,
      ),
    ).resolves.toEqual({ kind: 'unresolved' })
  })

  it('does not translate caller cancellation into a provider outcome', async () => {
    const controller = new AbortController()
    const reason = new Error('cancelled')
    controller.abort(reason)
    const fetcher = vi.fn<typeof fetch>()
    await expect(
      provider(fetcher).submit(
        { requestId, intent: 'Need' },
        { ...execution, signal: controller.signal },
      ),
    ).rejects.toBe(reason)
    expect(fetcher).toHaveBeenCalledTimes(0)

    const active = new AbortController()
    const activeReason = new Error('cancelled in flight')
    let forwarded: AbortSignal | undefined
    const pendingFetcher = vi.fn<typeof fetch>(async (_request, init) => {
      forwarded = init?.signal ?? undefined
      return new Promise<Response>((_resolve, reject) => {
        forwarded?.addEventListener('abort', () => reject(forwarded?.reason), { once: true })
      })
    })
    const pending = provider(pendingFetcher).submit(
      { requestId, intent: 'Need' },
      { ...execution, signal: active.signal },
    )
    active.abort(activeReason)
    await expect(pending).rejects.toBe(activeReason)
    expect(forwarded?.aborted).toBe(true)
    expect(forwarded?.reason).toBe(activeReason)
  })

  it('does not begin or continue egress after the execution deadline', async () => {
    const expiredFetcher = vi.fn<typeof fetch>()
    await expect(
      provider(expiredFetcher).submit(
        { requestId, intent: 'Need' },
        { ...execution, deadline: Date.now() - 1 },
      ),
    ).rejects.toBeInstanceOf(IntegrationDeadlineError)
    expect(expiredFetcher).toHaveBeenCalledTimes(0)

    const mutableExecution = { ...execution, deadline: Date.now() + 60_000 }
    const fullPage = Array.from({ length: 100 }, (_, index) => issue(index + 1, 'unrelated'))
    const pagedFetcher = vi.fn(async () => {
      mutableExecution.deadline = Date.now() - 1
      return Response.json(fullPage)
    })
    await expect(
      provider(pagedFetcher).reconcile(
        { requestId, notBefore: '2026-08-29T12:00:00.000Z' },
        mutableExecution,
      ),
    ).rejects.toBeInstanceOf(IntegrationDeadlineError)
    expect(pagedFetcher).toHaveBeenCalledTimes(1)
  })

  it('bounds provider bytes and rejects malformed reconciliation evidence', async () => {
    const oversizedReceipt = JSON.stringify({
      number: 42,
      html_url: collaborationUrl,
      user: { login: 'astrale-ui[bot]' },
      padding: 'x'.repeat(256 * 1024),
    })
    const declaredOversized = new Response(oversizedReceipt, {
      status: 201,
      headers: { 'content-length': String(256 * 1024 + 1) },
    })
    await expect(
      provider(async () => declaredOversized).submit({ requestId, intent: 'Need' }, execution),
    ).resolves.toEqual({ kind: 'outcome-unknown' })

    const streamedOversized = new Response(oversizedReceipt, { status: 201 })
    await expect(
      provider(async () => streamedOversized).submit({ requestId, intent: 'Need' }, execution),
    ).resolves.toEqual({ kind: 'outcome-unknown' })

    await expect(
      provider(async () => Response.json([null])).reconcile(
        { requestId, notBefore: '2026-08-29T12:00:00.000Z' },
        execution,
      ),
    ).rejects.toThrow('invalid issue entry')
  })
})

function provider(fetcher: typeof fetch) {
  return requireProvider(
    createGitHubRequestSubmissionProvider({
      token: 'test-token',
      owner: 'astrale-os',
      repository: 'ui',
      actor: 'astrale-ui[bot]',
      apiBase: 'https://api.github.test',
      fetcher,
    }),
  ).implementation
}

function issue(number: number, body: string) {
  return {
    number,
    body,
    created_at: '2026-08-29T12:00:00.000Z',
    html_url: `https://github.com/astrale-os/ui/issues/${number}`,
    user: { login: 'astrale-ui[bot]' },
  }
}
