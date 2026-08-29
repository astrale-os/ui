export const repository = 'https://github.com/astrale-os/ui'
export const issue = `${repository}/issues/123`

export const job = Object.freeze({
  request: issue,
  objective: 'Add the requested source-faithful UI and open one pull request.',
  target: { kind: 'repository', repository, baseRef: 'main' },
})

export function json(value, status = 200) {
  const body = JSON.stringify(value)
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
    },
  })
}
