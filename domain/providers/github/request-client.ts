import type { IntegrationExecution } from '@astrale-os/sdk/integration'

import type {
  ReconcileRequestSubmissionInput,
  ReconcileRequestSubmissionResult,
  SubmitRequestInput,
  SubmitRequestResult,
} from '#integrations/request-submission'

import type { AdmittedGitHubRequestSubmissionConfiguration } from './provider.js'

const API_VERSION = '2026-03-10'
const MAXIMUM_RESPONSE_BYTES = 256 * 1024
const PAGE_SIZE = 100
const MAXIMUM_RECONCILIATION_PAGES = 10
const RECONCILIATION_CLOCK_SKEW_MS = 10 * 60 * 1000
const REQUEST_ID = /^[A-Za-z0-9._:-]{1,256}$/u

export class GitHubBoundaryError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GitHubBoundaryError'
    this.status = status
  }
}

export class IntegrationDeadlineError extends Error {
  constructor() {
    super('Request submission execution deadline elapsed.')
    this.name = 'IntegrationDeadlineError'
  }
}

export class GitHubRequestClient {
  private readonly token: string
  private readonly owner: string
  private readonly repository: string
  private readonly actor: string
  private readonly fetcher: typeof fetch
  private readonly apiBase: string
  private readonly timeoutMs: number
  private readonly execution: IntegrationExecution

  constructor(
    configuration: AdmittedGitHubRequestSubmissionConfiguration,
    execution: IntegrationExecution,
  ) {
    this.token = configuration.token
    this.owner = configuration.owner
    this.repository = configuration.repository
    this.actor = configuration.actor
    this.fetcher = configuration.fetcher
    this.apiBase = configuration.apiBase
    this.timeoutMs = configuration.timeoutMs
    this.execution = execution
  }

  async submit(input: SubmitRequestInput): Promise<SubmitRequestResult> {
    requestId(input.requestId)
    const body = issueBody(input.requestId, input.intent)
    let response: Response
    try {
      response = await this.request('POST', this.issuesPath(), {
        title: issueTitle(input.intent),
        body,
      })
    } catch (cause) {
      if (this.execution.signal.aborted) throw this.execution.signal.reason ?? cause
      if (cause instanceof IntegrationDeadlineError) throw cause
      return { kind: 'outcome-unknown' }
    }
    if (response.status >= 500) return { kind: 'outcome-unknown' }
    if (!response.ok) {
      if ([401, 403, 404].includes(response.status)) {
        throw new GitHubBoundaryError(
          `GitHub issue submission is not authorized for ${this.owner}/${this.repository}.`,
          response.status,
        )
      }
      return { kind: 'rejected' }
    }
    try {
      const decoded = await boundedJson(response)
      const collaborationUrl = this.issueUrl(decoded)
      return collaborationUrl === undefined
        ? { kind: 'outcome-unknown' }
        : { kind: 'submitted', collaborationUrl }
    } catch (cause) {
      if (this.execution.signal.aborted) throw this.execution.signal.reason ?? cause
      return { kind: 'outcome-unknown' }
    }
  }

  async reconcile(
    input: ReconcileRequestSubmissionInput,
  ): Promise<ReconcileRequestSubmissionResult> {
    requestId(input.requestId)
    const notBefore = canonicalInstant(input.notBefore)
    const since = new Date(notBefore - RECONCILIATION_CLOCK_SKEW_MS).toISOString()
    const marker = requestMarker(input.requestId)
    const matches = new Set<string>()
    for (let page = 1; page <= MAXIMUM_RECONCILIATION_PAGES; page += 1) {
      let response: Response
      try {
        const query = new URLSearchParams({
          state: 'all',
          sort: 'created',
          direction: 'desc',
          since,
          per_page: String(PAGE_SIZE),
          page: String(page),
        })
        response = await this.request('GET', `${this.issuesPath()}?${query.toString()}`)
      } catch (cause) {
        if (this.execution.signal.aborted) throw this.execution.signal.reason ?? cause
        if (cause instanceof IntegrationDeadlineError) throw cause
        return { kind: 'unresolved' }
      }
      if (response.status >= 500) return { kind: 'unresolved' }
      if (!response.ok) {
        throw new GitHubBoundaryError(
          `GitHub issue reconciliation failed for ${this.owner}/${this.repository}.`,
          response.status,
        )
      }
      const decoded = await boundedJson(response)
      if (!Array.isArray(decoded)) {
        throw new GitHubBoundaryError('GitHub returned an invalid issue collection.')
      }
      for (const candidate of decoded) {
        if (!record(candidate)) {
          throw new GitHubBoundaryError('GitHub returned an invalid issue entry.')
        }
        if (
          'pull_request' in candidate ||
          typeof candidate.body !== 'string' ||
          !record(candidate.user) ||
          candidate.user.login !== this.actor ||
          typeof candidate.created_at !== 'string' ||
          canonicalInstant(candidate.created_at) < notBefore - RECONCILIATION_CLOCK_SKEW_MS ||
          !candidate.body.endsWith(`\n\n${marker}`)
        ) {
          continue
        }
        const collaborationUrl = this.issueUrl(candidate)
        if (collaborationUrl === undefined) {
          throw new GitHubBoundaryError('GitHub returned invalid matching issue evidence.')
        }
        matches.add(collaborationUrl)
      }
      if (matches.size > 1) return { kind: 'unresolved' }
      if (decoded.length < PAGE_SIZE) {
        const collaborationUrl = [...matches][0]
        return collaborationUrl === undefined
          ? { kind: 'unresolved' }
          : { kind: 'submitted', collaborationUrl }
      }
    }
    return { kind: 'unresolved' }
  }

  private issuesPath(): string {
    return `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/issues`
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    if (this.execution.signal.aborted) {
      throw this.execution.signal.reason ?? new DOMException('Aborted', 'AbortError')
    }
    const untilDeadline = this.execution.deadline - Date.now()
    if (untilDeadline <= 0) throw new IntegrationDeadlineError()
    const remaining = Math.min(this.timeoutMs, untilDeadline)
    return this.fetcher(`${this.apiBase}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'astrale-ui-domain',
        'X-GitHub-Api-Version': API_VERSION,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.any([this.execution.signal, AbortSignal.timeout(remaining)]),
    })
  }

  private issueUrl(candidate: unknown): string | undefined {
    if (
      !record(candidate) ||
      !Number.isSafeInteger(candidate.number) ||
      !record(candidate.user) ||
      candidate.user.login !== this.actor
    ) {
      return undefined
    }
    const expected = `https://github.com/${this.owner}/${this.repository}/issues/${String(candidate.number)}`
    return candidate.html_url === expected ? expected : undefined
  }
}

function issueTitle(intent: string): string {
  const summary = [...intent.replace(/\s+/gu, ' ').trim()].slice(0, 120).join('')
  return summary.length === 0 ? '[UI request]' : `[UI request]: ${summary}`
}

function issueBody(request: string, intent: string): string {
  return `## UI need\n\n${intent}\n\n${requestMarker(request)}`
}

function requestMarker(request: string): string {
  return `<!-- astrale-ui-domain-request:${request} -->`
}

function requestId(value: string): void {
  if (!REQUEST_ID.test(value)) throw new TypeError('GitHub requestId is invalid.')
}

function canonicalInstant(value: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new TypeError('GitHub reconciliation notBefore must be a canonical instant.')
  }
  return parsed
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function boundedJson(response: Response): Promise<unknown> {
  const declared = response.headers.get('content-length')
  if (declared !== null) {
    const length = Number(declared)
    if (!Number.isSafeInteger(length) || length < 0 || length > MAXIMUM_RESPONSE_BYTES) {
      throw new GitHubBoundaryError('GitHub response exceeds the admitted size.')
    }
  }
  const chunks: Uint8Array[] = []
  let length = 0
  const reader = response.body?.getReader()
  if (reader !== undefined) {
    for (;;) {
      const next = await reader.read()
      if (next.done) break
      length += next.value.byteLength
      if (length > MAXIMUM_RESPONSE_BYTES) {
        await reader.cancel('GitHub response exceeds the admitted size.')
        throw new GitHubBoundaryError('GitHub response exceeds the admitted size.')
      }
      chunks.push(next.value)
    }
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new GitHubBoundaryError('GitHub returned invalid JSON.')
  }
}
