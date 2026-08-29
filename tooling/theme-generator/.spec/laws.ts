export const themeGeneratorLaws = [
  {
    id: 'THEME-GEN-DETERMINISTIC',
    statement:
      'The same admitted input, version tuple, seed, and branch derivation seeds produce one byte-identical pristine ThemeDocument.',
  },
  {
    id: 'THEME-GEN-BRANCH-INDEPENDENT',
    statement:
      'Changing or retrying one unlocked generator branch does not consume randomness from another branch.',
  },
  {
    id: 'THEME-GEN-LOCK-EXACT',
    statement: 'A locked branch preserves every concrete ThemeDocument token owned by that branch.',
  },
  {
    id: 'THEME-GEN-ONE-COMMIT',
    statement:
      'A successful generation action presents one complete admitted result and creates one workspace history entry.',
  },
  {
    id: 'THEME-GEN-FAIL-UNCHANGED',
    statement:
      'A failed generation action leaves document, provenance, locks, history, persistence, and preview unchanged.',
  },
  {
    id: 'THEME-GEN-TOKENS-AUTHORITATIVE',
    statement:
      'ThemeDocument tokens remain render authority; generator metadata is provenance and never overrides them.',
  },
] as const
