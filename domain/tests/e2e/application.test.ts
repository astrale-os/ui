import { requestWorkflow } from '#functions/request'
import { requestSubmission } from '#integrations/request-submission'

import { domain, runtime, schema } from '../../index.js'

afterEach(() => vi.unstubAllGlobals())

describe('Domain definition', () => {
  it('keeps the authored Domain definition and Runtime composition exact', () => {
    expect(domain.schema).toBe(schema)
    expect(domain.runtime).toBe(runtime)
    expect(runtime.functions).toEqual([requestWorkflow])
    expect(runtime.integrations).toEqual({ requestSubmission })
    expect(domain.frontend).toBeUndefined()
  })

  it('routes the complete Runtime environment into the exact Provider', async () => {
    const collaborationUrl = 'https://github.com/example-owner/component-bank/issues/7'
    const fetcher = vi.fn(async () =>
      Response.json({
        number: 7,
        html_url: collaborationUrl,
        user: { login: 'trusted-agent' },
      }),
    )
    vi.stubGlobal('fetch', fetcher)
    const initialized = runtime.initialize({
      GITHUB_TOKEN: 'routed-token',
      GITHUB_OWNER: 'example-owner',
      GITHUB_REPOSITORY: 'component-bank',
      GITHUB_ACTOR: 'trusted-agent',
    })
    expect(Object.keys(initialized.providers)).toEqual(['requestSubmission'])
    expect(initialized.providers.requestSubmission.integration).toBe(requestSubmission)
    const implementation = requireProvider(initialized.providers.requestSubmission).implementation
    await expect(
      implementation.submit(
        { requestId: 'request-1', intent: 'Need' },
        {
          callId: 'call-1',
          signal: new AbortController().signal,
          deadline: Date.now() + 60_000,
        },
      ),
    ).resolves.toEqual({ kind: 'submitted', collaborationUrl })
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.com/repos/example-owner/component-bank/issues')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer routed-token')
    expect(() =>
      runtime.initialize({
        GITHUB_TOKEN: 'token',
        GITHUB_OWNER: 'astrale-os',
        GITHUB_REPOSITORY: 'ui',
      }),
    ).toThrow('GITHUB_ACTOR')
  })
})
import { requireProvider } from '@astrale-os/sdk/integration'
import { vi } from 'vitest'
