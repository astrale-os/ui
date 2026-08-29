export const themeGeneratorLimits = {
  seedHexCharacters: 32,
  maxAttempts: 12,
  corpusSeeds: 10_000,
  maxRejectionRate: 0.05,
  maxFallbackRate: 0.005,
  textContrastMinimum: 4.5,
  nonTextContrastMinimum: 3,
  generationP95Milliseconds: 8,
  variationSigma: 0.08,
  relationKeepProbability: 0.85,
} as const
