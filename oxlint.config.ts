import { defineConfig } from 'oxlint'

export default defineConfig({
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-explicit-any': 'warn',
    'consistent-type-imports': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],
  },
  ignorePatterns: [
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/*.js',
    '**/*.mjs',
    '**/*.cjs',
    '**/*.gen.ts',
    '**/*.gen.tsx',
    'registry/variants/source/**',
    'registry/variants/support/**',
    'tooling/upstream/providers/**',
  ],
  overrides: [
    {
      files: ['packages/ui/src/**/index.tsx', 'registry/components/**/*.{ts,tsx}'],
      rules: {
        eqeqeq: 'off',
        'prefer-const': 'off',
      },
    },
    {
      files: [
        '**/__tests__/**/*.ts',
        '**/*.test.ts',
        '**/*.perf.ts',
        '**/*.bench.ts',
        '**/*.spec.ts',
      ],
      rules: {
        'no-explicit-any': 'off',
        'no-unused-vars': 'off',
        'no-console': 'off',
      },
    },
  ],
})
