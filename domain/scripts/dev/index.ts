import { run } from '@astrale-os/sdk/cli'

// The convenience default belongs to this Project, not ambient CLI state.
const args = process.argv.slice(2)
try {
  process.exitCode = await run(['dev', ...(args.length === 0 ? ['development'] : args)])
} catch (cause) {
  process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`)
  process.exitCode = 1
}
