import { Buffer } from 'node:buffer'

import { uiRequestLimits as limits } from '../.spec/limits.ts'
import { managedAgentLimits } from '../agent/.spec/limits.ts'
import { operationSignal, readBoundedJson } from '../agent/src/http.mjs'
import { parsePullRequestUrl } from '../agent/src/model.mjs'
import { hasRecordMarker, parseRecordComment, renderRecordComment } from './record.mjs'

const acceptedAssociations = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])
const previewEvidenceMarker = 'astrale-ui-request-preview:v1'

async function acceptedComment(value, resolveWritePermission, source) {
  if (
    !value ||
    typeof value !== 'object' ||
    !Number.isSafeInteger(value.id) ||
    value.id < 1 ||
    value.user?.type === 'Bot'
  ) {
    return null
  }
  const associationAccepted = acceptedAssociations.has(value.author_association)
  if (
    typeof value.user?.login !== 'string' ||
    value.user.login.length === 0 ||
    (!associationAccepted && !(await resolveWritePermission(value.user.login)))
  ) {
    return null
  }
  const createdAt = value.created_at ?? value.submitted_at
  const updatedAt = value.updated_at ?? value.submitted_at
  if (
    typeof value.body !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(createdAt)) ||
    !Number.isFinite(Date.parse(updatedAt))
  ) {
    throw new TypeError('GitHub accepted maintainer comment is malformed')
  }
  if (value.body.includes(`<!-- ${previewEvidenceMarker}`)) return null
  return {
    id: value.id,
    discussionId: `${source}:${value.id}`,
    source,
    author: value.user.login,
    association: associationAccepted ? value.author_association : 'COLLABORATOR',
    createdAt,
    updatedAt,
    body: value.body,
    ...(typeof value.html_url === 'string' ? { url: value.html_url } : {}),
    ...(typeof value.path === 'string' ? { path: value.path } : {}),
    ...(Number.isSafeInteger(value.line) && value.line > 0 ? { line: value.line } : {}),
  }
}

function admittedComments(comments, selectedDiscussionIds, selectedLegacyIds) {
  const ordered = comments.toSorted(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id - right.id,
  )
  const selected = selectedDiscussionIds
    ? selectedDiscussionIds.map((discussionId) => {
        const comment = ordered.find((entry) => entry.discussionId === discussionId)
        if (!comment)
          throw new TypeError('A reserved accepted maintainer discussion is unavailable')
        return comment
      })
    : selectedLegacyIds
      ? selectedLegacyIds.map((id) => {
          const comment = ordered.find(
            (entry) => entry.source === 'issue-comment' && entry.id === id,
          )
          if (!comment) throw new TypeError('A reserved accepted maintainer comment is unavailable')
          return comment
        })
      : ordered
  if (selected.length > limits.maxAcceptedCommentCount) {
    throw new TypeError('Accepted maintainer comments exceed the admitted count')
  }
  if (
    selected.some(
      (comment) => Buffer.byteLength(comment.body, 'utf8') > limits.maxAcceptedCommentBodyUtf8Bytes,
    )
  ) {
    throw new TypeError('An accepted maintainer comment exceeds the admitted size')
  }
  const totalBodyBytes = selected.reduce(
    (total, comment) => total + Buffer.byteLength(comment.body, 'utf8'),
    0,
  )
  if (totalBodyBytes > limits.maxAcceptedDiscussionUtf8Bytes) {
    throw new TypeError('Accepted maintainer discussion exceeds the admitted size')
  }
  return selected
}

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
    const { allowNotFound = false, signal, ...requestInit } = init
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
    if (allowNotFound && response.status === 404) return null
    if (!response.ok) throw new Error(`GitHub request store failed with HTTP ${response.status}`)
    return body
  }

  async function paginated(path, signal) {
    const values = []
    for (let page = 1; page <= limits.maxRecordCommentPages; page += 1) {
      const separator = path.includes('?') ? '&' : '?'
      const entries = await request(`${path}${separator}per_page=10&page=${page}`, { signal })
      if (!Array.isArray(entries)) throw new TypeError('GitHub discussion response is malformed')
      values.push(...entries)
      if (entries.length < 10) return values
    }
    throw new TypeError('GitHub discussion exceeds the admitted scan bound')
  }

  return Object.freeze({
    repository: `https://github.com/${owner}/${repo}`,

    async getRequest(issue, options = {}) {
      const { commentMode = 'current', signal } = options
      if (!['current', 'recorded'].includes(commentMode)) {
        throw new TypeError('GitHub request comment mode is invalid')
      }
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
      let found = null
      const accepted = []
      const commentPermissions = new Map()
      function hasWritePermission(login) {
        if (!commentPermissions.has(login)) {
          commentPermissions.set(
            login,
            request(
              `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(login)}/permission`,
              { allowNotFound: true, signal },
            ).then(
              (permission) =>
                permission !== null && ['admin', 'write'].includes(permission?.permission),
            ),
          )
        }
        return commentPermissions.get(login)
      }
      const issueComments = await paginated(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issue}/comments`,
        signal,
      )
      for (const comment of issueComments) {
        if (comment?.user?.login === actor) {
          if (typeof comment.body !== 'string') {
            throw new TypeError('GitHub issue contains a malformed trusted request record')
          }
          const record = parseRecordComment(comment.body)
          if (!record && hasRecordMarker(comment.body)) {
            throw new TypeError('GitHub issue contains a malformed trusted request record')
          }
          if (record) {
            if (!Number.isSafeInteger(comment.id) || comment.id < 1) {
              throw new TypeError('GitHub trusted request record comment is malformed')
            }
            if (found) {
              throw new TypeError('GitHub issue contains more than one trusted request record')
            }
            found = { commentId: comment.id, record }
          }
        }
        const eligible = await acceptedComment(comment, hasWritePermission, 'issue-comment')
        if (eligible) accepted.push(eligible)
      }

      if (found?.record.pullRequest) {
        const proposal = parsePullRequestUrl(found.record.pullRequest)
        const pullRequest = await request(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${proposal.number}`,
          { signal },
        )
        if (
          pullRequest?.html_url !== found.record.pullRequest ||
          pullRequest?.state !== 'open' ||
          pullRequest?.merged_at != null ||
          pullRequest?.base?.ref !== 'main' ||
          pullRequest?.head?.repo?.full_name !== `${owner}/${repo}` ||
          typeof pullRequest?.head?.ref !== 'string' ||
          !pullRequest.head.ref.startsWith(`astrale/ui-request-${issue}-`)
        ) {
          throw new TypeError('GitHub request proposal is not an admitted managed pull request')
        }
        const sources = [
          {
            path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${proposal.number}/comments`,
            source: 'pull-request-comment',
          },
          {
            path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${proposal.number}/reviews`,
            source: 'pull-request-review',
          },
          {
            path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${proposal.number}/comments`,
            source: 'pull-request-review-comment',
          },
        ]
        for (const source of sources) {
          for (const comment of await paginated(source.path, signal)) {
            if (typeof comment?.body !== 'string' || comment.body.trim() === '') continue
            const eligible = await acceptedComment(comment, hasWritePermission, source.source)
            if (eligible) accepted.push(eligible)
          }
        }
      }

      const selectedDiscussionIds =
        commentMode === 'recorded' ? found?.record.acceptedDiscussionIds : undefined
      const selectedLegacyIds =
        commentMode === 'recorded' && !selectedDiscussionIds
          ? (found?.record.acceptedCommentIds ?? [])
          : undefined
      return {
        issue: {
          number: issue,
          title: body.title,
          body: body.body,
          url: body.html_url,
          comments: admittedComments(accepted, selectedDiscussionIds, selectedLegacyIds),
        },
        binding: found,
      }
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
