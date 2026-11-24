import { describe, expect, test } from 'vitest'

import { themeTextContrastReasons } from '../../../tooling/theme-generator/index.js'
import { bundledThemes, defaultTheme } from './workspace.js'

describe('bundled themes', () => {
  test('lists every registry theme with Spatial as the default', () => {
    expect(defaultTheme.name).toBe('spatial')
    expect(bundledThemes.map((theme) => theme.name)).toEqual([
      'spatial',
      'console',
      'desktop',
      'observatory',
    ])
  })

  test.each(bundledThemes.map((theme) => [theme.name, theme] as const))(
    '%s keeps every text pair and status color legible in both modes',
    (_name, theme) => {
      expect(themeTextContrastReasons(theme)).toEqual([])
    },
  )
})
