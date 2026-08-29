import { Buffer } from 'node:buffer'

import { uiRequestLimits as limits } from '../.spec/limits.ts'
import { managedAgentLimits } from '../agent/.spec/limits.ts'
import { operationSignal, readBoundedJson } from '../agent/src/http.mjs'
import { hasRecordMarker, parseRecordComment, renderRecordComment } from './record.mjs'

export function createGitHubRequestStore(options) {
  const token = options?.token
  const owner = options?.owner
  const repo = options?.repo
  const actor = options?.recordActor ?? 'github-actions[bot]'
  const fetchImplementation = options?.fetch ?? globalThis.fetch
  const operationTimeoutMs =
    options?.operationTimeoutMs ?? managedAgentLimits.providerOperationTimeoutMs
  if (typeof token !== 'string' || token.length === 0)
    throw new TypeError('GitHub token is required')
  if (typeof owner !== 'string' || typeof repo !== 'string')
    throw new TypeError('GitHub repository is required')

  async function request(path, init = {}) {
    const { signal, ...requestInit } = init
    const response = await fetchImplementation(`https://api.github.com${path}`, {
      ...requestInit,
      signal: operationSignal(signal, operationTimeoutMs),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2026-03-10',
        ...requestInit.headers,
      },
    })
    const body = await readBoundedJson(response)
    if (!response.ok) throw new Error(`GitHub request store failed with HTTP ${response.status}`)
    return body
  }

  return Object.freeze({
    repository: `https://github.com/${owner}/${repo}`,

    async getIssue(issue, signal) {
      const body = await request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issue}`,
        { signal },
      )
      if (
        body?.pull_request ||
        body?.number !== issue ||
        typeof body?.title !== 'string' ||
        typeof body?.body !== 'string' ||
        typeof body?.html_url !== 'string' ||
        body?.state !== 'open'
      ) {
        throw new TypeError('GitHub issue is not an open UI request')
      }
      if (Buffer.byteLength(body.body, 'utf8') > limits.maxIssueBodyUtf8Bytes) {
        throw new TypeError('GitHub issue body exceeds the admitted size')
      }
      return { number: issue, title: body.title, body: body.body, url: body.html_url }
    },

    async getRecord(issue, signal) {
      let found = null
      let complete = false
      for (let page = 1; page <= limits.maxRecordCommentPages; page += 1) {
        const comments = await request(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issue}/comments?per_page=10&page=${page}`,
          { signal },
        )
        if (!Array.isArray(comments)) throw new TypeError('GitHub comments response is malformed')
        for (const comment of comments) {
          if (comment?.user?.login !== actor) continue
          const record = parseRecordComment(comment.body)
          if (!record && hasRecordMarker(comment.body)) {
            throw new TypeError('GitHub issue contains a malformed trusted request record')
          }
          if (!record) continue
          if (found)
            throw new TypeError('GitHub issue contains more than one trusted request record')
          found = { commentId: comment.id, record }
        }
        if (comments.length < 10) {
          complete = true
          break
        }
      }
      if (!complete) throw new TypeError('GitHub issue comments exceed the admitted scan bound')
      return found
    },

    async createRecord(issue, record, signal) {
      const comment = await request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issue}/comments`,
        { method: 'POST', signal, body: JSON.stringify({ body: renderRecordComment(record) }) },
      )
      if (!Number.isSafeInteger(comment?.id))
        throw new TypeError('GitHub comment response is malformed')
      return { commentId: comment.id, record }
    },

    async updateRecord(commentId, record, signal) {
      await request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/comments/${commentId}`,
        { method: 'PATCH', signal, body: JSON.stringify({ body: renderRecordComment(record) }) },
      )
      return { commentId, record }
    },
  })
}
