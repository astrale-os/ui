import type { SearchDistribution, UiPackageImport, UiRegistryAddress } from './api.js'

export type SearchDocument = SearchDistribution & {
  readonly address: UiRegistryAddress | UiPackageImport
  readonly title: string
  readonly description: string
  readonly dependencies: readonly string[]
  readonly code: {
    readonly language: 'tsx' | 'css'
    readonly path: string
    readonly bytes: number
    readonly sha256: string
  }
  readonly evidence: {
    readonly identity: readonly string[]
    readonly behavior: readonly string[]
  }
}

export type SearchArtifactFile = {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}

export type SearchArtifactManifest = {
  readonly version: 1
  readonly engine: 'lexical-v1'
  readonly scoring: {
    readonly fingerprint: string
    readonly parameters: Readonly<Record<string, unknown>>
  }
  readonly corpus: {
    readonly registry: number
    readonly runtime: number
    readonly total: number
  }
  readonly layout:
    | { readonly kind: 'single'; readonly index: SearchArtifactFile }
    | {
        readonly kind: 'partitioned'
        readonly documents: number
        readonly terms: readonly (readonly [string, number, number])[]
        readonly documentMetadataParts: readonly number[]
        readonly termFiles: readonly SearchArtifactFile[]
        readonly metadataFiles: readonly SearchArtifactFile[]
      }
}
