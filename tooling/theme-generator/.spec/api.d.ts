import type {
  GeneratorBranch,
  GeneratorMetadata,
  ThemeDNA,
  ThemeDocument,
} from '../../theme-document/index.js'

export type ThemeGenerationRequest =
  | {
      readonly kind: 'new-direction'
      readonly theme: ThemeDocument
      readonly seed: string
      readonly locks: readonly GeneratorBranch[]
    }
  | {
      readonly kind: 'variation'
      readonly theme: ThemeDocument & { readonly generation: GeneratorMetadata }
      readonly seed: string
      readonly locks: readonly GeneratorBranch[]
    }

export type ThemeGenerationResult =
  | { readonly kind: 'generated'; readonly theme: ThemeDocument; readonly attempts: number }
  | { readonly kind: 'fallback'; readonly theme: ThemeDocument; readonly attempts: 12 }
  | {
      readonly kind: 'failure'
      readonly code:
        | 'variation-unavailable'
        | 'all-branches-locked'
        | 'locked-branch-invalid'
        | 'generation-failed'
      readonly message: string
    }

export interface GeneratedThemeAdmission {
  readonly ok: boolean
  readonly reasons: readonly string[]
}

export declare function sampleThemeDNA(seed: string): ThemeDNA

export declare function generateTheme(request: ThemeGenerationRequest): ThemeGenerationResult

export declare function replayPristineTheme(
  theme: ThemeDocument & { readonly generation: GeneratorMetadata },
): ThemeDocument

export declare function admitGeneratedTheme(theme: ThemeDocument): GeneratedThemeAdmission
