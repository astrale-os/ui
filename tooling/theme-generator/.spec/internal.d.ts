import type { ThemeDocument } from '../../theme-document/index.js'
import type {
  GeneratedThemeAdmission,
  ThemeGenerationRequest,
  ThemeGenerationResult,
} from './api.js'

/** Qualification-only seam. Product consumers use generateTheme. */
export declare function generateThemeWithAdmission(
  request: ThemeGenerationRequest,
  admissionPolicy: (theme: ThemeDocument) => GeneratedThemeAdmission,
): ThemeGenerationResult
