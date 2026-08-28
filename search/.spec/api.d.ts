export type UiRegistryAddress =
  | `component/${string}`
  | `pattern/${string}/${string}`
  | `block/${string}/${string}`
  | `theme/${string}`

export type UiPackageImport = `@astrale-os/ui/${string}`

export type SearchDistribution =
  | {
      readonly packageImport: UiPackageImport
      readonly command?: never
    }
  | {
      readonly command: `astrale ui add ${UiRegistryAddress}`
      readonly packageImport?: never
    }

export type SearchRequest = {
  readonly query: string
  readonly limit?: number
  readonly offset?: number
  readonly project?: string
}

export type SearchRelease = {
  readonly version: string
  readonly commit: string
}

export type SearchResult = SearchDistribution & {
  readonly address: UiRegistryAddress | UiPackageImport
  readonly title: string
  readonly description: string
  readonly dependencies: readonly string[]
  readonly code: {
    readonly language: 'tsx' | 'css'
    readonly source: string
  }
}

/** `total` is the retained deterministic candidate window, not registry cardinality. */
export type SearchResponse = {
  readonly query: string
  readonly release: SearchRelease
  readonly offset: number
  readonly limit: number
  readonly total: number
  readonly nextOffset: number | null
  readonly results: readonly SearchResult[]
}

export type SearchFailure = {
  readonly error: 'UI_SEARCH_QUERY_INVALID' | 'UI_SEARCH_UNAVAILABLE'
  readonly message: string
  readonly hint?: string
}
