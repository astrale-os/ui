import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// jest-dom's Vitest entrypoint still augments the pre-v5 Assertion interface.
declare module 'vitest' {
  interface Matchers<R, T> extends TestingLibraryMatchers<T, R> {}
}

expect.extend(matchers)
