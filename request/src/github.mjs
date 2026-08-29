import { Buffer } from 'node:buffer'

import { uiRequestLimits as limits } from '../.spec/limits.ts'
import { managedAgentLimits } from '../agent/.spec/limits.ts'
import { operationSignal, readBoundedJson } from '../agent/src/http.mjs'
import { hasRecordMarker, parseRecordComment, renderRecordComment } from './record.mjs'

const acceptedAssociations = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

async function acceptedComment(value, resolveWritePermission) {
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
  if (
    typeof value.body !== 'string' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string' ||
    !Number.isFinite(Date.parse(value.created_at)) ||
    !Number.isFinite(Date.parse(value.updated_at))
  ) {
    throw new TypeError('GitHub accepted maintainer comment is malformed')
  }
  return {
    id: value.id,
    author: value.user.login,
    association: associationAccepted ? value.author_association : 'COLLABORATOR',
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    body: value.body,
  }
}

function admittedComments(comments, selectedIds) {
  const ordered = comments.toSorted(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id - right.id,
  )
  const selected =
    selectedIds === undefined
      ? ordered
      : selectedIds.map((id) => {
          const comment = ordered.find((entry) => entry.id === id)
          if (!comment) throw new TypeError('A reserved accepted maintainer comment is unavailable')
          return comment
        })
  if (selected.length > limits.maxAcceptedCommentCount) {
    throw new TypeError('Accepted maintainer comments exceed the admitted count')
  }
  const totalBodyBytes = selected.reduce(
    (total, comment) => total + Buffer.byteLength(comment.body, 'utf8'),
    0,
  )
  if (totalBodyBytes > limits.maxAcceptedCommentBodyUtf8Bytes) {
    throw new TypeError('Accepted maintainer comments exceed the admitted size')
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
      let complete = false
      for (let page = 1; page <= limits.maxRecordCommentPages; page += 1) {
        const comments = await request(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issue}/comments?per_page=10&page=${page}`,
          { signal },
        )
        if (!Array.isArray(comments)) throw new TypeError('GitHub comments response is malformed')
        for (const comment of comments) {
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
          const eligible = await acceptedComment(comment, hasWritePermission)
          if (eligible) accepted.push(eligible)
        }
        if (comments.length < 10) {
          complete = true
          break
        }
      }
      if (!complete) throw new TypeError('GitHub issue comments exceed the admitted scan bound')
      const selectedIds =
        commentMode === 'recorded' ? (found?.record.acceptedCommentIds ?? []) : undefined
      return {
        issue: {
          number: issue,
          title: body.title,
          body: body.body,
          url: body.html_url,
          comments: admittedComments(accepted, selectedIds),
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
