export type UiRequestDraft = {
  /** The trimmed free-text need presented to the request form. */
  readonly query: string
  /** A GitHub form URL. The request does not exist until the user submits this form. */
  readonly submissionUrl: `https://github.com/astrale-os/ui/issues/new?${string}`
}

export type UiRequestInput = {
  readonly query: string
}

export type UiRequestFailure = {
  readonly error: 'UI_REQUEST_QUERY_INVALID' | 'UI_REQUEST_UNAVAILABLE'
  readonly message: string
  readonly hint?: string
}

/** Candidate JSON output for `astrale ui request <query> --json`. */
export type UiRequestResponse = UiRequestDraft
