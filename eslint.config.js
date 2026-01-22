import { createConfig } from '@astrale/eslint-config'

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  ignorePatterns: ['**/dist/**', '**/node_modules/**'],
})
