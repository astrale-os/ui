import { run } from '@astrale-os/sdk/cli'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

vi.mock('@astrale-os/sdk/cli', () => ({ run: vi.fn(async () => 0) }))

const originalArguments = process.argv
const originalExitCode = process.exitCode

beforeEach(() => {
  vi.resetModules()
  vi.mocked(run).mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
  process.argv = originalArguments
  process.exitCode = originalExitCode
})

it.each([
  [[], ['dev', 'development']],
  [['beta'], ['dev', 'beta']],
  [
    ['prod', '--deploy-only'],
    ['dev', 'prod', '--deploy-only'],
  ],
  [['--help'], ['dev', '--help']],
])('forwards development arguments %j', async (arguments_, expected) => {
  process.argv = ['bun', 'scripts/dev/index.ts', ...arguments_]
  await import('../index.js')
  expect(run).toHaveBeenCalledExactlyOnceWith(expected)
  expect(process.exitCode).toBe(0)
})

it('preserves a failed development command exit code', async () => {
  vi.mocked(run).mockResolvedValueOnce(1)
  process.argv = ['bun', 'scripts/dev/index.ts']
  await import('../index.js')
  expect(process.exitCode).toBe(1)
})

it('reports a thrown failure and exits unsuccessfully', async () => {
  vi.mocked(run).mockRejectedValueOnce(new Error('Unknown environment staging'))
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
  process.argv = ['bun', 'scripts/dev/index.ts', 'staging']
  await import('../index.js')
  expect(stderr).toHaveBeenCalledExactlyOnceWith('Unknown environment staging\n')
  expect(process.exitCode).toBe(1)
})
