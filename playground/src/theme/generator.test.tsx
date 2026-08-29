import { act, renderHook } from '@testing-library/react'
import { createHash } from 'node:crypto'
import { describe, expect, test } from 'vitest'

import observatorySource from '../../../registry/themes/observatory.astrale-theme.json'
import {
  parseThemeDocument,
  renderThemeCss,
  serializeThemeDocument,
  ThemeDocumentError,
  type ThemeDocument,
} from '../../../tooling/theme-document/index.js'
import {
  cssContrastRatio,
  formatOklch,
  gamutMap,
  inSrgbGamut,
  parseCssColor,
  perceptualDistance,
} from '../../../tooling/theme-generator/color.js'
import {
  admitGeneratedTheme,
  generateTheme,
  generateThemeWithAdmission,
  replayPristineTheme,
  sampleThemeDNA,
} from '../../../tooling/theme-generator/index.js'
import { useThemeWorkspace } from './workspace.js'

const observatory = parseThemeDocument(observatorySource)
const seed = '0123456789abcdef0123456789abcdef'

function generatedTheme() {
  const result = generateTheme({ kind: 'new-direction', theme: observatory, seed, locks: [] })
  if (result.kind === 'failure') throw new Error(result.message)
  return result.theme
}

describe('theme generator', () => {
  test('matches independent WCAG and color-space reference vectors', () => {
    expect(cssContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 8)
    expect(cssContrastRatio('#777777', '#ffffff')).toBeCloseTo(4.478_089, 5)
    expect(parseCssColor('rgb(0 0 0 / 0.25)')?.alpha).toBe(0.25)
    expect(parseCssColor('#ffffff80')?.alpha).toBeCloseTo(128 / 255, 8)
    expect(perceptualDistance('#336699', '#336699')).toBe(0)
    const mapped = gamutMap({ l: 0.62, c: 0.5, h: 24 })
    expect(mapped.l).toBe(0.62)
    expect(mapped.h).toBe(24)
    expect(mapped.c).toBeLessThan(0.5)
    expect(inSrgbGamut(mapped)).toBe(true)
    expect(Object.values(parseCssColor(formatOklch(mapped)) ?? {}).slice(0, 3)).toEqual(
      expect.arrayContaining([expect.any(Number)]),
    )
  })

  test('samples the same DNA and complete admitted document for the same seed', () => {
    expect(sampleThemeDNA(seed)).toEqual(sampleThemeDNA(seed))
    const first = generatedTheme()
    const second = generatedTheme()
    expect(serializeThemeDocument(first)).toBe(serializeThemeDocument(second))
    expect(admitGeneratedTheme(first)).toEqual({ ok: true, reasons: [] })
    expect(
      replayPristineTheme(
        first as typeof first & { generation: NonNullable<typeof first.generation> },
      ),
    ).toEqual(first)
  })

  test('locks engine V1 to a canonical serialized output digest', () => {
    const digest = createHash('sha256')
      .update(serializeThemeDocument(generatedTheme()))
      .digest('hex')
    expect(digest).toBe('895ac2cb137fbe148ddc56ed98f8d5fb486686bca28f716c54a42a455c15b298')
  })

  test('does not leak prior theme tokens into any unlocked branch', () => {
    const parent = generatedTheme()
    const altered = parseThemeDocument({
      ...observatory,
      name: 'alternate-source',
      label: 'Alternate source',
      appearance: parent.appearance,
      typography: parent.typography,
      geometry: parent.geometry,
      density: parent.density,
      effects: parent.effects,
      motion: parent.motion,
    })
    const requestSeed = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const first = generateTheme({
      kind: 'new-direction',
      theme: observatory,
      seed: requestSeed,
      locks: [],
    })
    const second = generateTheme({
      kind: 'new-direction',
      theme: altered,
      seed: requestSeed,
      locks: [],
    })
    if (first.kind === 'failure' || second.kind === 'failure') throw new Error('Generation failed.')
    expect(first.theme.appearance).toEqual(second.theme.appearance)
    expect(first.theme.typography).toEqual(second.theme.typography)
    expect(first.theme.geometry).toEqual(second.theme.geometry)
    expect(first.theme.density).toEqual(second.theme.density)
    expect(first.theme.name).toBe('observatory')
    expect(second.theme.name).toBe('alternate-source')
  })

  test('preserves locked branches byte-for-byte', () => {
    const first = generatedTheme()
    if (!first.generation) throw new Error('Expected generator provenance.')
    const result = generateTheme({
      kind: 'variation',
      theme: first as typeof first & { generation: typeof first.generation },
      seed: 'fedcba9876543210fedcba9876543210',
      locks: ['typography', 'geometry'],
    })
    expect(result.kind).toBe('generated')
    if (result.kind === 'failure') throw new Error(result.message)
    expect(result.theme.typography).toEqual(first.typography)
    expect(result.theme.geometry).toEqual(first.geometry)
    expect(result.theme.density).toEqual(first.density)
    expect(result.theme.effects).toEqual(first.effects)
    expect(result.theme.motion).toEqual(first.motion)
    expect(result.theme.appearance).not.toEqual(first.appearance)
  })

  test('rejects an action when every branch is locked', () => {
    expect(
      generateTheme({
        kind: 'new-direction',
        theme: observatory,
        seed,
        locks: ['palette', 'typography', 'geometry'],
      }),
    ).toMatchObject({ kind: 'failure', code: 'all-branches-locked' })
  })

  test('retries only the rejected subsystem and bounds fallback behavior to twelve attempts', () => {
    const request = {
      kind: 'new-direction' as const,
      theme: observatory,
      seed: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      locks: [] as const,
    }
    const baseline = generateTheme(request)
    if (baseline.kind === 'failure' || !baseline.theme.generation)
      throw new Error('Baseline failed.')
    let retryCalls = 0
    const retried = generateThemeWithAdmission(request, (theme) => {
      retryCalls += 1
      return retryCalls === 1
        ? { ok: false, reasons: ['Typography family was rejected for qualification.'] }
        : admitGeneratedTheme(theme)
    })
    if (retried.kind === 'failure' || !retried.theme.generation) throw new Error('Retry failed.')
    expect(retried.attempts).toBe(2)
    expect(retried.theme.generation.derivationSeeds.palette).toBe(
      baseline.theme.generation.derivationSeeds.palette,
    )
    expect(retried.theme.generation.derivationSeeds.geometry).toBe(
      baseline.theme.generation.derivationSeeds.geometry,
    )
    expect(retried.theme.generation.derivationSeeds.typography).not.toBe(
      baseline.theme.generation.derivationSeeds.typography,
    )
    expect(retried.theme.appearance).toEqual(baseline.theme.appearance)
    expect(retried.theme.geometry).toEqual(baseline.theme.geometry)
    expect(retried.theme.density).toEqual(baseline.theme.density)
    expect(retried.theme.effects).toEqual(baseline.theme.effects)
    expect(retried.theme.motion).toEqual(baseline.theme.motion)

    let fallbackCalls = 0
    const fallback = generateThemeWithAdmission(request, (theme) => {
      fallbackCalls += 1
      return fallbackCalls <= 12
        ? { ok: false, reasons: ['light.chart1 was rejected for qualification.'] }
        : admitGeneratedTheme(theme)
    })
    expect(fallbackCalls).toBe(13)
    expect(fallback.kind).toBe('fallback')
    if (fallback.kind !== 'fallback' || !fallback.theme.generation) throw new Error('No fallback.')
    expect(fallback.theme.generation.lineage).toEqual({ kind: 'fallback', failedAttempts: 12 })
    expect(admitGeneratedTheme(fallback.theme).ok).toBe(true)
    expect(
      generateTheme({
        kind: 'variation',
        theme: fallback.theme as typeof fallback.theme & {
          generation: typeof fallback.theme.generation
        },
        seed: 'cccccccccccccccccccccccccccccccc',
        locks: [],
      }),
    ).toMatchObject({ kind: 'failure', code: 'variation-unavailable' })

    const terminal = generateThemeWithAdmission(request, () => ({
      ok: false,
      reasons: ['light.chart1 was rejected for qualification.'],
    }))
    expect(terminal).toMatchObject({ kind: 'failure', code: 'generation-failed' })
  })

  test('preserves tokens, DNA, and branch seeds across every lock combination and action', () => {
    const parent = generatedTheme()
    if (!parent.generation) throw new Error('Expected generator provenance.')
    const combinations = [
      ['palette'],
      ['typography'],
      ['geometry'],
      ['palette', 'typography'],
      ['palette', 'geometry'],
      ['typography', 'geometry'],
    ] as const
    const output = (theme: ThemeDocument, branch: 'palette' | 'typography' | 'geometry') =>
      branch === 'palette'
        ? theme.appearance
        : branch === 'typography'
          ? theme.typography
          : {
              geometry: theme.geometry,
              density: theme.density,
              effects: theme.effects,
              motion: theme.motion,
            }
    for (const kind of ['new-direction', 'variation'] as const) {
      for (const [index, locks] of combinations.entries()) {
        const result = generateTheme({
          kind,
          theme: parent as typeof parent & { generation: typeof parent.generation },
          seed: (index + (kind === 'variation' ? 200 : 100)).toString(16).padStart(32, '0'),
          locks,
        })
        if (result.kind === 'failure' || !result.theme.generation) {
          throw new Error(result.kind === 'failure' ? result.message : 'Missing provenance.')
        }
        const locked = new Set<string>(locks)
        for (const branch of ['palette', 'typography', 'geometry'] as const) {
          if (locked.has(branch)) {
            expect(output(result.theme, branch)).toEqual(output(parent, branch))
            expect(result.theme.generation.dna[branch]).toEqual(parent.generation.dna[branch])
            expect(result.theme.generation.derivationSeeds[branch]).toBe(
              parent.generation.derivationSeeds[branch],
            )
          } else {
            expect(output(result.theme, branch)).not.toEqual(output(parent, branch))
            expect(result.theme.generation.derivationSeeds[branch]).not.toBe(
              parent.generation.derivationSeeds[branch],
            )
          }
        }
        expect(
          replayPristineTheme(
            result.theme as typeof result.theme & { generation: typeof result.theme.generation },
          ),
        ).toEqual(result.theme)
      }
    }
  })

  test('rejects invalid locked output without mutating the source', () => {
    const parent = generatedTheme()
    if (!parent.generation) throw new Error('Expected generator provenance.')
    const invalid = parseThemeDocument({
      ...parent,
      generation: { ...parent.generation, editedBranches: ['palette'] },
      appearance: {
        ...parent.appearance,
        light: {
          ...parent.appearance.light,
          primaryForeground: parent.appearance.light.primary,
        },
      },
    }) as typeof parent & { generation: typeof parent.generation }
    const before = serializeThemeDocument(invalid)
    expect(
      generateTheme({
        kind: 'variation',
        theme: invalid,
        seed: '11111111111111111111111111111111',
        locks: ['palette'],
      }),
    ).toMatchObject({ kind: 'failure', code: 'locked-branch-invalid' })
    expect(serializeThemeDocument(invalid)).toBe(before)
  })

  test('keeps provenance out of CSS and rejects malformed or unsupported metadata atomically', () => {
    const generated = generatedTheme()
    const { generation: _generation, ...plain } = generated
    expect(renderThemeCss(generated)).toBe(renderThemeCss(parseThemeDocument(plain)))
    for (const generation of [
      { ...generated.generation, engineVersion: 2 },
      { ...generated.generation, seed: 'ABCDEF0123456789ABCDEF0123456789' },
      { ...generated.generation, locks: ['palette', 'palette'] },
      {
        ...generated.generation,
        derivationSeeds: { ...generated.generation?.derivationSeeds, extra: seed },
      },
      {
        ...generated.generation,
        dna: {
          ...generated.generation?.dna,
          palette: { ...generated.generation?.dna.palette, colorfulness: 1.1 },
        },
      },
    ]) {
      expect(() => parseThemeDocument({ ...generated, generation })).toThrow(ThemeDocumentError)
    }
  })

  test('rejects transparent colors, wrong font roles, broken surfaces, and invalid geometry', () => {
    const generated = generatedTheme()
    const { generation: _generation, ...plain } = generated
    const candidates = [
      {
        reason: 'must be opaque',
        theme: {
          ...plain,
          appearance: {
            ...plain.appearance,
            light: { ...plain.appearance.light, foreground: 'rgb(0 0 0 / 0)' },
          },
        },
      },
      {
        reason: 'not eligible for the body role',
        theme: {
          ...plain,
          typography: {
            ...plain.typography,
            body: { ...plain.typography.body, family: plain.typography.mono },
          },
        },
      },
      {
        reason: 'not eligible for the terminal role',
        theme: {
          ...plain,
          typography: { ...plain.typography, mono: plain.typography.body.family },
        },
      },
      {
        reason: 'surface ordering is invalid',
        theme: {
          ...plain,
          appearance: {
            ...plain.appearance,
            light: {
              ...plain.appearance.light,
              card: plain.appearance.light.secondary,
            },
          },
        },
      },
      {
        reason: 'geometry is outside its admitted range',
        theme: {
          ...plain,
          density: { ...plain.density, controlSmall: '3.25rem' },
        },
      },
      {
        reason: 'geometry is outside its admitted range',
        theme: {
          ...plain,
          motion: { fast: '280ms', standard: '120ms' },
        },
      },
    ]
    for (const { theme, reason } of candidates) {
      expect(admitGeneratedTheme(parseThemeDocument(theme)).reasons).toEqual(
        expect.arrayContaining([expect.stringContaining(reason)]),
      )
    }
  })

  test('rejects pristine metadata that does not replay to the document tokens', () => {
    const generated = generatedTheme()
    const forged = parseThemeDocument({
      ...generated,
      appearance: {
        ...generated.appearance,
        light: { ...generated.appearance.light, border: generated.appearance.light.ring },
      },
    })
    expect(admitGeneratedTheme(forged)).toMatchObject({
      ok: false,
      reasons: expect.arrayContaining([
        expect.stringContaining('palette tokens do not match their pristine generator provenance'),
      ]),
    })

    expect(admitGeneratedTheme(generated)).toEqual({ ok: true, reasons: [] })
    expect(
      generateTheme({
        kind: 'variation',
        theme: generated as typeof generated & {
          generation: NonNullable<typeof generated.generation>
        },
        seed: '0023456789abcdef0123456789abcdef',
        locks: [],
      }).kind,
    ).toBe('generated')
    generated.appearance.light.border = generated.appearance.light.ring
    expect(admitGeneratedTheme(generated)).toMatchObject({
      ok: false,
      reasons: expect.arrayContaining([
        expect.stringContaining('palette tokens do not match their pristine generator provenance'),
      ]),
    })

    expect(
      generateTheme({
        kind: 'variation',
        theme: generated as typeof generated & {
          generation: NonNullable<typeof generated.generation>
        },
        seed: '1123456789abcdef0123456789abcdef',
        locks: [],
      }),
    ).toMatchObject({
      kind: 'failure',
      code: 'generation-failed',
      message: expect.stringContaining(
        'palette tokens do not match their pristine generator provenance',
      ),
    })

    const metadataMutation = generatedTheme()
    if (!metadataMutation.generation) throw new Error('Expected generator provenance.')
    expect(
      generateTheme({
        kind: 'variation',
        theme: metadataMutation as typeof metadataMutation & {
          generation: NonNullable<typeof metadataMutation.generation>
        },
        seed: '1023456789abcdef0123456789abcdef',
        locks: [],
      }).kind,
    ).toBe('generated')
    Object.assign(metadataMutation.generation.dna.palette, {
      hue: (metadataMutation.generation.dna.palette.hue + 90) % 360,
    })
    expect(
      generateTheme({
        kind: 'variation',
        theme: metadataMutation as typeof metadataMutation & {
          generation: NonNullable<typeof metadataMutation.generation>
        },
        seed: '2123456789abcdef0123456789abcdef',
        locks: [],
      }),
    ).toMatchObject({
      kind: 'failure',
      code: 'generation-failed',
      message: expect.stringContaining(
        'palette tokens do not match their pristine generator provenance',
      ),
    })
  })

  test('commits generation once and restores bootstrap locks on Undo', async () => {
    const workspace = renderHook(() => useThemeWorkspace())
    act(() => workspace.result.current.toggleLock('typography'))
    expect(workspace.result.current.locks).toEqual(['typography'])
    expect(workspace.result.current.canUndo).toBe(false)

    let generated: Awaited<ReturnType<typeof workspace.result.current.newDirection>> | undefined
    await act(async () => {
      generated = await workspace.result.current.newDirection()
      expect(generated.kind).toBe('generated')
    })
    if (!generated || generated.kind === 'failure') throw new Error('Expected generated theme.')
    expect(workspace.result.current.theme).toBe(generated.theme)
    expect(workspace.result.current.theme.generation?.locks).toEqual(['typography'])
    expect(workspace.result.current.theme.typography).toEqual(observatory.typography)
    expect(workspace.result.current.canUndo).toBe(true)

    act(() => workspace.result.current.undo())
    expect(workspace.result.current.theme).toEqual(observatory)
    expect(workspace.result.current.locks).toEqual(['typography'])
    expect(workspace.result.current.canUndo).toBe(false)
  })

  test('does not turn an unavailable Variation call into a new direction', async () => {
    const workspace = renderHook(() => useThemeWorkspace())
    const before = workspace.result.current.theme
    await act(async () => {
      expect(await workspace.result.current.variation()).toMatchObject({
        kind: 'failure',
        code: 'variation-unavailable',
      })
    })
    expect(workspace.result.current.theme).toBe(before)
    expect(workspace.result.current.canUndo).toBe(false)
  })

  test('reports the explicit no-op state when every workspace branch is locked', async () => {
    const workspace = renderHook(() => useThemeWorkspace())
    act(() => workspace.result.current.toggleLock('palette'))
    act(() => workspace.result.current.toggleLock('typography'))
    act(() => workspace.result.current.toggleLock('geometry'))
    expect(workspace.result.current.generationDisabled).toBe(true)
    await act(async () => {
      expect(await workspace.result.current.newDirection()).toMatchObject({
        kind: 'failure',
        code: 'all-branches-locked',
      })
    })
    expect(workspace.result.current.canUndo).toBe(false)
  })

  test('marks only manually edited generator branches and makes lock toggles undoable', async () => {
    const workspace = renderHook(() => useThemeWorkspace())
    await act(async () => {
      const result = await workspace.result.current.newDirection()
      expect(result.kind).toBe('generated')
    })
    act(() => workspace.result.current.setIdentity('label', 'Local direction'))
    expect(workspace.result.current.theme.generation?.editedBranches).toEqual([])
    act(() => workspace.result.current.setColor('light', 'primary', 'oklch(0.5 0.1 120)'))
    expect(workspace.result.current.theme.generation?.editedBranches).toEqual(['palette'])
    act(() =>
      workspace.result.current.setValue('typography', 'body', {
        ...workspace.result.current.theme.typography.body,
        weight: 500,
      }),
    )
    expect(workspace.result.current.theme.generation?.editedBranches).toEqual([
      'palette',
      'typography',
    ])
    act(() => workspace.result.current.toggleLock('palette'))
    expect(workspace.result.current.locks).toEqual(['palette'])
    act(() => workspace.result.current.undo())
    expect(workspace.result.current.locks).toEqual([])
  })

  test('maps every manual editor surface to its exact provenance branch', () => {
    const workspace = renderHook(() => useThemeWorkspace())
    const base = generatedTheme()
    const edits: Array<{
      expected: readonly string[]
      apply(): void
    }> = [
      {
        expected: ['palette'],
        apply: () => workspace.result.current.setColor('light', 'border', '#123456'),
      },
      {
        expected: ['typography'],
        apply: () =>
          workspace.result.current.setValue('typography', 'body', {
            ...workspace.result.current.theme.typography.body,
            leading: '1.6',
          }),
      },
      {
        expected: ['typography'],
        apply: () =>
          workspace.result.current.setValue('typography', 'heading', {
            ...workspace.result.current.theme.typography.heading,
            tracking: '-0.02em',
          }),
      },
      {
        expected: ['typography'],
        apply: () =>
          workspace.result.current.setValue(
            'typography',
            'mono',
            workspace.result.current.theme.typography.mono,
          ),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('geometry', 'radius', '0.5rem'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('geometry', 'panelRadius', '0.8rem'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('density', 'control', '2.4rem'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('density', 'controlSmall', '2rem'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('density', 'controlLarge', '2.8rem'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('effects', 'controlShadow', 'none'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('effects', 'panelShadow', 'none'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('motion', 'fast', '100ms'),
      },
      {
        expected: ['geometry'],
        apply: () => workspace.result.current.setValue('motion', 'standard', '200ms'),
      },
      { expected: [], apply: () => workspace.result.current.setIdentity('name', 'local-theme') },
      { expected: [], apply: () => workspace.result.current.setIdentity('label', 'Local theme') },
      { expected: [], apply: () => workspace.result.current.setIdentity('description', '') },
    ]
    for (const edit of edits) {
      act(() => workspace.result.current.load(base))
      act(edit.apply)
      expect(workspace.result.current.theme.generation?.editedBranches).toEqual(edit.expected)
    }
  })

  test('undoes a generation before undoing the preceding persisted lock toggle', async () => {
    const workspace = renderHook(() => useThemeWorkspace())
    await act(async () => {
      await workspace.result.current.newDirection()
    })
    act(() => workspace.result.current.toggleLock('palette'))
    const beforeGeneration = workspace.result.current.theme
    await act(async () => {
      await workspace.result.current.newDirection()
    })
    act(() => workspace.result.current.undo())
    expect(workspace.result.current.theme).toEqual(beforeGeneration)
    expect(workspace.result.current.locks).toEqual(['palette'])
    act(() => workspace.result.current.undo())
    expect(workspace.result.current.locks).toEqual([])
  })
})
