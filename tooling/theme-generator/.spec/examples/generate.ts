import type { ThemeDocument } from '../../../theme-document/index.js'

import { generateTheme } from '../../index.js'

declare const currentTheme: ThemeDocument

const result = generateTheme({
  kind: 'new-direction',
  theme: currentTheme,
  seed: '0123456789abcdef0123456789abcdef',
  locks: ['typography'],
})

if (result.kind === 'generated' || result.kind === 'fallback') {
  result.theme satisfies ThemeDocument
}
