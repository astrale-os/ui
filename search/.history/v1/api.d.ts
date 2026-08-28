/** Candidate contract. It is not ratified or exported by a package. */

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

/**
 * Canonical producer-to-indexer input derived from package exports, registry manifests, and code.
 * It is not emitted by the public CLI.
 */
export type SearchDocument = SearchDistribution & {
  readonly address: UiRegistryAddress | UiPackageImport
  readonly title: string
  readonly description: string
  readonly dependencies: readonly string[]
  readonly code: {
    readonly language: 'tsx' | 'css'
    readonly path: string
  }
  readonly evidence: {
    readonly identity: readonly string[]
    readonly behavior: readonly string[]
  }
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
