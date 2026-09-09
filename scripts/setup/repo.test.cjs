const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const { test } = require('node:test')

const packages = ['packages/ui', 'registry', 'playground', 'domain']

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ui setup-')))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const scripts = path.join(root, 'scripts/setup')
  fs.cpSync(__dirname, scripts, { recursive: true })
  fs.writeFileSync(path.join(root, '.nvmrc'), process.versions.node + '\n')
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ packageManager: 'pnpm@12.1.0', devDependencies: { typescript: '7.0.2' } }),
  )
  fs.writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    'packages: [' + packages.join(', ') + ']\n',
  )
  for (const directory of packages) {
    fs.mkdirSync(path.join(root, directory), { recursive: true })
    fs.writeFileSync(
      path.join(root, directory, 'package.json'),
      JSON.stringify({
        devDependencies: {
          typescript: '7.0.2',
        },
      }),
    )
  }
  fs.writeFileSync(path.join(root, '.bun-version'), '1.4.0\n')
  const home = path.join(root, 'home')
  const storage = path.join(root, 'tools')
  const bin = path.join(storage, 'bin')
  fs.mkdirSync(home)
  fs.mkdirSync(bin, { recursive: true })
  const env = {
    ...process.env,
    // pnpm injects a module-resolution fallback to its own dependencies.
    // Fixtures must resolve only their own packages, including missing-package checks.
    NODE_OPTIONS: '',
    NODE_PATH: '',
    HOME: home,
    AGENT_SETUP_HOME: storage,
    AGENT_HARNESSES: 'codex,claude',
    AGENT_SETUP_BROWSER: '',
    AGENT_SETUP_ASTRALE_CLI: '',
    CLAUDE_ENV_FILE: '',
    CLAUDE_CODE_REMOTE: '',
    TEST_LOG: path.join(root, 'calls'),
  }
  function run(script, args = [], extra = {}) {
    return spawnSync('bash', [path.join(scripts, script), ...args], {
      cwd: os.tmpdir(),
      env: { ...env, ...extra },
      encoding: 'utf8',
      timeout: 15_000,
    })
  }
  function executable(name, body) {
    fs.writeFileSync(
      path.join(bin, name),
      '#!/usr/bin/env bash\nset -euo pipefail\n' + body + '\n',
      {
        mode: 0o755,
      },
    )
  }
  executable('jq', 'echo jq-fixture')
  function mock(body) {
    fs.appendFileSync(path.join(scripts, 'lib/common.sh'), '\n' + body)
  }
  assert.equal(spawnSync('git', ['init', '--initial-branch=feature', root]).status, 0)
  return { root, scripts, storage, env, run, executable, mock }
}

function success(result) {
  assert.equal(result.status, 0, `${result.error ?? ''}\n${result.stdout}\n${result.stderr}`)
}

test('preflight rejects missing workspace manifests before running any runtime', (t) => {
  const f = fixture(t)
  for (const name of ['node', 'npm', 'pnpm', 'bun'])
    f.executable(name, 'echo unexpected >> "$TEST_LOG"; exit 99')
  success(f.run('setup_repo.sh', ['--check']))
  fs.rmSync(path.join(f.root, 'domain/package.json'))
  assert.match(f.run('setup.sh').stderr, /Incomplete UI checkout/)
  assert.equal(fs.existsSync(f.env.TEST_LOG), false)
})

test('default preparation preserves repository work and excludes Astrale tooling', (t) => {
  const f = fixture(t)
  f.mock(
    'agent_ensure_node() { :; }\nagent_ensure_bun() { :; }\nagent_install_repo() { echo install >> "$TEST_LOG"; }\nagent_select_browser() { echo browser >> "$TEST_LOG"; }\nagent_ensure_skill() { exit 99; }',
  )
  f.executable('pnpm', 'echo pnpm >> "$TEST_LOG"')
  f.executable('bun', 'echo 1.4.0')
  f.executable('astrale', 'echo unexpected >> "$TEST_LOG"; exit 99')
  success(f.run('setup_repo.sh'))
  success(f.run('setup_repo.sh'))
  assert.equal(
    fs.readFileSync(f.env.TEST_LOG, 'utf8'),
    'install\npnpm\npnpm\nbrowser\npnpm\ninstall\npnpm\npnpm\nbrowser\npnpm\n',
  )
  assert.equal(fs.existsSync(path.join(f.storage, 'env.sh')), true)
})

test('failed dependency installation does not persist a prepared environment', (t) => {
  const f = fixture(t)
  f.mock(
    'agent_ensure_node() { :; }\nagent_ensure_bun() { :; }\nagent_install_repo() { return 43; }',
  )
  assert.equal(f.run('setup_repo.sh').status, 43)
  assert.equal(fs.existsSync(path.join(f.storage, 'env.sh')), false)
})

test('verification refuses missing workspace dependencies without installing them', (t) => {
  const f = fixture(t)
  fs.mkdirSync(path.join(f.root, 'node_modules'))
  fs.writeFileSync(path.join(f.root, 'node_modules/.modules.yaml'), 'fixture')
  f.executable('bun', 'echo 1.4.0')
  f.executable(
    'pnpm',
    'if [[ "$*" == --version ]]; then echo 12.1.0; elif [[ "$*" == *install* ]]; then exit 99; else echo fixture; fi',
  )
  const result = f.run('verify.sh')
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Missing UI workspace dependencies/)
  assert.equal(fs.existsSync(path.join(f.root, 'packages/ui/node_modules')), false)
})

test('the configured local Claude hook only loads prepared paths', (t) => {
  const f = fixture(t)
  const settings = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../.claude/settings.json'), 'utf8'),
  )
  const envFile = path.join(f.root, 'claude.env')
  fs.writeFileSync(path.join(f.storage, 'env.sh'), 'export UI_SETUP_CHECK=ready\n')
  const result = spawnSync('bash', ['-c', settings.hooks.SessionStart[0].hooks[0].command], {
    env: {
      ...f.env,
      CLAUDE_PROJECT_DIR: f.root,
      CLAUDE_ENV_FILE: envFile,
      CLAUDE_CODE_REMOTE: 'false',
    },
    encoding: 'utf8',
  })
  success(result)
  assert.equal(fs.readFileSync(envFile, 'utf8'), 'export UI_SETUP_CHECK=ready\n')
  assert.equal(fs.existsSync(path.join(f.storage, 'state')), false)
})

function cloudFixture(t) {
  const f = fixture(t)
  fs.writeFileSync(
    path.join(f.scripts, 'setup.sh'),
    `#!/usr/bin/env bash
set -euo pipefail
echo setup >> "$TEST_LOG"
sleep 0.1
printf 'export UI_SETUP_CHECK=ready\\n' > "$AGENT_SETUP_HOME/env.sh"
`,
  )
  fs.writeFileSync(
    path.join(f.scripts, 'verify.sh'),
    `#!/usr/bin/env bash
echo verify >> "$TEST_LOG"
[[ "\${TEST_FAIL_VERIFY:-0}" == 0 ]]
`,
  )
  f.env.CLAUDE_CODE_REMOTE = 'true'
  return f
}

test(
  'concurrent cloud hooks initialize once and a later hook only restores paths',
  { skip: process.platform !== 'linux' },
  async (t) => {
    const f = cloudFixture(t)
    const launch = (name) =>
      new Promise((resolve, reject) => {
        const child = spawn('bash', [path.join(f.scripts, 'claude_session_start.sh')], {
          env: { ...f.env, CLAUDE_ENV_FILE: path.join(f.root, name) },
        })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (data) => {
          stdout += data
        })
        child.stderr.on('data', (data) => {
          stderr += data
        })
        child.on('error', reject)
        child.on('close', (status) => resolve({ status, stdout, stderr }))
      })
    const results = await Promise.all([launch('first.env'), launch('second.env')])
    for (const result of results) success(result)
    assert.equal(
      results.filter((result) => result.stdout.includes('"reloadSkills":true')).length,
      1,
    )
    assert.equal(fs.readFileSync(f.env.TEST_LOG, 'utf8'), 'setup\nverify\n')
    const directory = path.join(f.storage, 'state/claude')
    const marker = path.join(
      directory,
      fs.readdirSync(directory).find((name) => name.endsWith('.ready')),
    )
    const before = fs.statSync(marker).mtimeMs
    const resumed = await launch('resumed.env')
    success(resumed)
    assert.match(resumed.stderr, /already initialized; loading environment only/)
    assert.equal(fs.statSync(marker).mtimeMs, before)
    assert.equal(fs.readFileSync(f.env.TEST_LOG, 'utf8'), 'setup\nverify\n')
    assert.equal(
      fs.readFileSync(path.join(f.root, 'resumed.env'), 'utf8'),
      'export UI_SETUP_CHECK=ready\n',
    )
  },
)

test(
  'failed cloud verification leaves no success marker and the next hook retries',
  { skip: process.platform !== 'linux' },
  (t) => {
    const f = cloudFixture(t)
    const failed = f.run('claude_session_start.sh', [], { TEST_FAIL_VERIFY: '1' })
    assert.notEqual(failed.status, 0)
    const state = path.join(f.storage, 'state/claude')
    assert.equal(fs.readdirSync(state).filter((name) => name.endsWith('.ready')).length, 0)
    success(f.run('claude_session_start.sh'))
    assert.equal(fs.readdirSync(state).filter((name) => name.endsWith('.ready')).length, 1)
    assert.equal(fs.readFileSync(f.env.TEST_LOG, 'utf8'), 'setup\nverify\nsetup\nverify\n')
  },
)

test('browser-off prepares the library without downloading project browsers', (t) => {
  const f = fixture(t)
  f.mock(
    'agent_ensure_node() { :; }\nagent_ensure_bun() { :; }\nagent_install_repo() { :; }\nagent_select_browser() { exit 99; }',
  )
  f.executable('pnpm', 'echo "$*" >> "$TEST_LOG"')
  success(f.run('setup_repo.sh', [], { AGENT_SETUP_BROWSER: '0' }))
  assert.equal(fs.readFileSync(f.env.TEST_LOG, 'utf8'), '--dir domain --version\nrun build\n')
})
