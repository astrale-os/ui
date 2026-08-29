import { describe, expect, test } from 'vitest'

import observatorySource from '../../../registry/themes/observatory.astrale-theme.json'
import {
  parseThemeDocument,
  serializeThemeDocument,
  type ThemeDNA,
  type ThemeDocument,
} from '../../../tooling/theme-document/index.js'
import { perceptualDistance } from '../../../tooling/theme-generator/color.js'
import { generateTheme, generatorFontCatalog } from '../../../tooling/theme-generator/index.js'

const enabled = process.env.ASTRALE_THEME_GENERATOR_CORPUS === '1'
const observatory = parseThemeDocument(observatorySource)

function seed(index: number): string {
  return index.toString(16).padStart(32, '0')
}

function quantile(values: readonly number[], position: number): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor((sorted.length - 1) * position)] ?? 0
}

function dnaDistance(left: ThemeDNA, right: ThemeDNA): number {
  const hue = Math.abs(left.palette.hue - right.palette.hue)
  const hueDistance = Math.min(hue, 360 - hue) / 180
  const values = [
    hueDistance,
    left.palette.relation === right.palette.relation ? 0 : 1,
    Math.abs(left.palette.colorfulness - right.palette.colorfulness),
    Math.abs(left.palette.contrast - right.palette.contrast),
    Math.abs(left.palette.tint - right.palette.tint),
    Math.abs(left.palette.warmth - right.palette.warmth) / 2,
    Math.abs(left.typography.contrast - right.typography.contrast),
    Math.abs(left.typography.compactness - right.typography.compactness),
    Math.abs(left.geometry.density - right.geometry.density),
    Math.abs(left.geometry.roundness - right.geometry.roundness),
    Math.abs(left.geometry.elevation - right.geometry.elevation),
  ]
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function themeDistance(left: ThemeDocument, right: ThemeDocument): number {
  const tokens = ['background', 'primary', 'accent', 'destructive', 'chart1', 'chart3'] as const
  const colors = (['light', 'dark'] as const).flatMap((mode) =>
    tokens.map(
      (token) =>
        perceptualDistance(left.appearance[mode][token], right.appearance[mode][token]) ?? 0,
    ),
  )
  const values = [
    ...colors,
    left.typography.body.family === right.typography.body.family ? 0 : 1,
    left.typography.heading.family === right.typography.heading.family ? 0 : 1,
    Math.abs(Number.parseFloat(left.geometry.radius) - Number.parseFloat(right.geometry.radius)) /
      1.5,
    Math.abs(Number.parseFloat(left.density.control) - Number.parseFloat(right.density.control)) /
      1.25,
  ]
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function requireGenerated(result: ReturnType<typeof generateTheme>): ThemeDocument & {
  generation: NonNullable<ThemeDocument['generation']>
} {
  expect(result.kind).not.toBe('failure')
  if (result.kind === 'failure') throw new Error(result.message)
  if (!result.theme.generation) throw new Error('Generated theme is missing provenance.')
  return result.theme as ThemeDocument & { generation: NonNullable<ThemeDocument['generation']> }
}

describe('theme generator qualification corpus', () => {
  test.skipIf(!enabled)(
    'covers 10,000 seeds without collapse and within the fixed runtime budget',
    () => {
      const relationCounts = new Map<string, number>()
      const hueBins = Array.from({ length: 12 }, () => 0)
      const bodyFamilies = new Set<string>()
      const headingFamilies = new Set<string>()
      const terminalFamilies = new Set<string>()
      const headingWeights = new Set<number>()
      const pairClasses = new Map<string, number>()
      const documents = new Set<string>()
      const primaryOutputs = new Set<string>()
      const geometryOutputs = new Set<string>()
      const axisQuartiles = Array.from({ length: 10 }, () => [0, 0, 0, 0])
      const durations: number[] = []
      let retries = 0
      let rejectedAttempts = 0
      let fallbacks = 0

      for (let index = 0; index < 10_000; index += 1) {
        const started = performance.now()
        const result = generateTheme({
          kind: 'new-direction',
          theme: observatory,
          seed: seed(index),
          locks: [],
        })
        durations.push(performance.now() - started)
        if (result.kind === 'failure') throw new Error(result.message)
        const theme = requireGenerated(result)
        if (result.kind === 'fallback') fallbacks += 1
        if (result.attempts > 1) retries += 1
        rejectedAttempts += result.attempts - 1
        const relation = theme.generation.dna.palette.relation
        relationCounts.set(relation, (relationCounts.get(relation) ?? 0) + 1)
        hueBins[Math.min(11, Math.floor(theme.generation.dna.palette.hue / 30))] += 1
        bodyFamilies.add(theme.typography.body.family)
        headingFamilies.add(theme.typography.heading.family)
        terminalFamilies.add(theme.typography.mono)
        headingWeights.add(theme.typography.heading.weight)
        documents.add(serializeThemeDocument(theme))
        primaryOutputs.add(`${theme.appearance.light.primary}|${theme.appearance.dark.primary}`)
        geometryOutputs.add(
          JSON.stringify({
            geometry: theme.geometry,
            density: theme.density,
            effects: theme.effects,
            motion: theme.motion,
          }),
        )
        const dna = theme.generation.dna
        const axes = [
          dna.palette.colorfulness,
          dna.palette.contrast,
          dna.palette.tint,
          (dna.palette.warmth + 1) / 2,
          dna.typography.contrast,
          dna.typography.compactness,
          dna.geometry.density,
          dna.geometry.roundness,
          dna.geometry.elevation,
          dna.palette.hue / 360,
        ]
        axes.forEach((value, axis) => {
          axisQuartiles[axis]![Math.min(3, Math.floor(value * 4))] += 1
        })
        const bodyKind = generatorFontCatalog.find(
          (font) => font.family === theme.typography.body.family,
        )?.kind
        const headingKind = generatorFontCatalog.find(
          (font) => font.family === theme.typography.heading.family,
        )?.kind
        const pair = `${bodyKind}/${headingKind}`
        pairClasses.set(pair, (pairClasses.get(pair) ?? 0) + 1)
      }

      const relationShares = [...relationCounts.values()].map((count) => count / 10_000)
      const hueShares = hueBins.map((count) => count / 10_000)
      const largestPairShare = Math.max(...pairClasses.values()) / 10_000
      expect(relationShares.every((share) => share >= 0.2 && share <= 0.3)).toBe(true)
      expect(hueShares.every((share) => share >= 0.05 && share <= 0.12)).toBe(true)
      expect(bodyFamilies.size).toBe(4)
      expect(headingFamilies.size).toBe(4)
      expect(terminalFamilies.size).toBe(1)
      expect(headingWeights.size).toBeGreaterThanOrEqual(2)
      expect(documents.size).toBe(10_000)
      expect(primaryOutputs.size).toBeGreaterThan(9_900)
      expect(geometryOutputs.size).toBeGreaterThan(9_000)
      expect(
        axisQuartiles.every((quartiles) =>
          quartiles.every((count) => count / 10_000 >= 0.0025 && count / 10_000 <= 0.8),
        ),
      ).toBe(true)
      expect(largestPairShare).toBeLessThanOrEqual(0.65)
      expect(retries).toBeLessThanOrEqual(rejectedAttempts)
      expect(rejectedAttempts / 10_000).toBeLessThanOrEqual(0.05)
      expect(fallbacks / 10_000).toBeLessThanOrEqual(0.005)
      expect(quantile(durations, 0.95)).toBeLessThanOrEqual(8)

      const variationDistances: number[] = []
      const directionDistances: number[] = []
      const variationThemeDistances: number[] = []
      const directionThemeDistances: number[] = []
      const variationDurations: number[] = []
      for (let index = 0; index < 500; index += 1) {
        const parent = requireGenerated(
          generateTheme({
            kind: 'new-direction',
            theme: observatory,
            seed: seed(index),
            locks: [],
          }),
        )
        const variationStarted = performance.now()
        const variationResult = generateTheme({
          kind: 'variation',
          theme: parent,
          seed: seed(10_000 + index),
          locks: [],
        })
        variationDurations.push(performance.now() - variationStarted)
        const variation = requireGenerated(variationResult)
        const direction = requireGenerated(
          generateTheme({
            kind: 'new-direction',
            theme: parent,
            seed: seed(20_000 + index),
            locks: [],
          }),
        )
        variationDistances.push(dnaDistance(parent.generation.dna, variation.generation.dna))
        directionDistances.push(dnaDistance(parent.generation.dna, direction.generation.dna))
        variationThemeDistances.push(themeDistance(parent, variation))
        directionThemeDistances.push(themeDistance(parent, direction))
      }
      expect(quantile(variationDistances, 0.5)).toBeLessThan(quantile(directionDistances, 0.1))
      expect(quantile(variationThemeDistances, 0.5)).toBeLessThan(
        quantile(directionThemeDistances, 0.1),
      )
      expect(quantile(variationDurations, 0.95)).toBeLessThanOrEqual(8)
      process.stdout.write(
        `THEME_GENERATOR_CORPUS ${JSON.stringify({
          seeds: 10_000,
          relationCounts: Object.fromEntries(relationCounts),
          hueBins,
          bodyFamilies: bodyFamilies.size,
          headingFamilies: headingFamilies.size,
          terminalFamilies: terminalFamilies.size,
          headingWeights: [...headingWeights].sort(),
          pairClasses: Object.fromEntries(pairClasses),
          uniqueDocuments: documents.size,
          uniquePrimaryOutputs: primaryOutputs.size,
          uniqueGeometryOutputs: geometryOutputs.size,
          axisQuartiles,
          retries,
          rejectedAttempts,
          fallbacks,
          p95Milliseconds: Number(quantile(durations, 0.95).toFixed(3)),
          variationP95Milliseconds: Number(quantile(variationDurations, 0.95).toFixed(3)),
          medianVariationDnaDistance: Number(quantile(variationDistances, 0.5).toFixed(4)),
          p10NewDirectionDnaDistance: Number(quantile(directionDistances, 0.1).toFixed(4)),
          medianVariationThemeDistance: Number(quantile(variationThemeDistances, 0.5).toFixed(4)),
          p10NewDirectionThemeDistance: Number(quantile(directionThemeDistances, 0.1).toFixed(4)),
        })}\n`,
      )
    },
    180_000,
  )
})
