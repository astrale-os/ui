import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const arguments_ = process.argv.slice(2).filter((argument) => argument !== '--')
const intakeRoot = arguments_[0]
assert.ok(intakeRoot, 'usage: pnpm intake:apply -- <qualified-shadcn-project>')
assert.equal(arguments_.length, 1, 'intake:apply accepts exactly one qualified project path')

function run(file, args) {
  const result = spawnSync(file, args, { encoding: 'utf8', stdio: 'inherit' })
  assert.equal(result.status, 0, `${file} ${args.join(' ')} failed`)
}

run(process.execPath, ['scripts/intake-shadcn-profile.mjs', intakeRoot])
run(process.execPath, ['scripts/sync-registry-components.mjs'])
run(process.execPath, ['scripts/sync-runtime-surface.mjs'])
run(process.execPath, ['scripts/sync-playground-inventory.mjs'])
run('pnpm', ['exec', 'oxfmt', '--write', 'packages/ui/src', 'playground/src/catalog'])
