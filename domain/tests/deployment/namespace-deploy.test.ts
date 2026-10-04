import type { DeployResultV1 } from '@astrale-os/sdk/cli'

import {
  acceptDeploymentRecord,
  acceptPlatformDeploymentSummary,
  deploymentLine,
  deploymentUrl,
} from '@astrale-os/sdk/deployment/address'
import { spawnSync } from 'node:child_process'
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FakeScript, RecordedRequest } from './namespace/fake-cloudflare.js'

import { ORIGIN } from '../../schema/schema.js'
import { ACCOUNT, TOKEN } from './namespace/fake-cloudflare.js'

/**
 * Namespace deploy fixture (UI1): `astrale-domain deploy <environment>` of this Domain, with its
 * own configuration, against a fake Cloudflare account. The CLI selects the canonical mode (CT33)
 * and adapter-cloudflare makes one immutable deployment per release in the platform namespace, on
 * the readable line of ui.astrale.ai in that Environment; a redeploy of the same release reuses it
 * and rewrites only its secrets in place (AM-4'). No route, Worker or other script is touched.
 */
const DOMAIN = realpathSync(fileURLToPath(new URL('../../', import.meta.url)))
const BUN = join(DOMAIN, 'node_modules', '.bin', 'bun')
const ENTRY = fileURLToPath(new URL('./namespace/deploy.ts', import.meta.url))
const NAMESPACE = 'astrale-platform'
const ROUTING_DOMAIN = 'platform.astrale.ai'
const SCRIPTS = `/workers/dispatch/namespaces/${NAMESPACE}/scripts/`
const SECRET_NAMES = ['GITHUB_ACTOR', 'GITHUB_OWNER', 'GITHUB_REPOSITORY', 'GITHUB_TOKEN']
/** What a copy of the Project leaves behind: dependencies, build output, local state and secrets. */
const NOT_COPIED = new Set(['node_modules', '.astrale', '.domain-studio', '.wrangler', 'dist'])

interface Run {
  readonly argv: readonly string[]
  readonly exitCode: number
  readonly stdout: string
  readonly error?: string
}

interface Report {
  readonly runs: readonly Run[]
  readonly requests: readonly RecordedRequest[]
  readonly routing: Readonly<Record<string, string>>
  readonly scripts: readonly (FakeScript & { readonly name: string })[]
}

let project: string
let home: string
let report: Report
let stderr: string

beforeAll(() => {
  project = mkdtempSync(join(tmpdir(), 'ui-namespace-deploy-'))
  // Tools write caches under HOME: keep them out of the Project, whose tree must stay clean.
  home = mkdtempSync(join(tmpdir(), 'ui-namespace-deploy-home-'))
  cpSync(DOMAIN, project, {
    recursive: true,
    filter: (source) => {
      const name = basename(source)
      return !NOT_COPIED.has(name) && !(name.startsWith('.env.') && name !== '.env.example')
    },
  })
  symlinkSync(join(DOMAIN, 'node_modules'), join(project, 'node_modules'), 'dir')
  writeSecrets('.env.prod', 'production-token')
  writeSecrets('.env.dev', 'development-token')
  git('init', '--quiet', '--initial-branch=main')
  // The dependency link is no source: `node_modules/` in .gitignore matches directories only.
  appendFileSync(join(project, '.git', 'info', 'exclude'), 'node_modules\n')
  git('add', '--all')
  git('commit', '--quiet', '--no-gpg-sign', '--message', 'ui Domain')
  const reportFile = join(home, 'report.json')
  const completed = spawnSync(BUN, [ENTRY], {
    cwd: project,
    encoding: 'utf8',
    timeout: 240_000,
    // Never the caller's environment: no real Cloudflare account or token can reach the deploy.
    env: {
      ...isolatedGit(),
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT,
      CLOUDFLARE_API_TOKEN: TOKEN,
      UI_NAMESPACE_DEPLOY_REPORT: reportFile,
      NO_COLOR: '1',
    },
  })
  stderr = completed.stderr
  if (completed.status !== 0) {
    throw new Error(`The deploy fixture exited ${completed.status}: ${completed.stderr}`)
  }
  report = JSON.parse(readFileSync(reportFile, 'utf8')) as Report
}, 300_000)

afterAll(() => {
  for (const directory of [project, home]) {
    if (directory !== undefined) rmSync(directory, { recursive: true, force: true })
  }
})

describe('astrale-domain deploy of the ui Domain', () => {
  it('makes one immutable production deployment in the platform namespace', () => {
    const [created] = report.runs
    const result = deployResult(created!)
    const line = deploymentLine({
      origin: ORIGIN,
      environment: 'production',
      addressing: 'readable',
    })
    const label = result.deployment.script!
    expect(label).toMatch(new RegExp(`^${line}-[a-z2-7]{16}$`, 'u'))
    expect(result).toMatchObject({
      origin: ORIGIN,
      environment: 'production',
      url: deploymentUrl(label, ROUTING_DOMAIN),
      deployment: { state: 'created' },
      secrets: { state: 'bound' },
    })
    expect(result.deployment.adapter).toMatch(/^cloudflare@/u)
    expect(result.release).not.toBeNull()
    expect(result.commit).toMatchObject({ dirty: false })
    // The canonical mode: no deprecation of the legacy direct mode was printed.
    expect(stderr).not.toMatch(/legacy direct|deprecated/iu)

    const uploads = report.requests.filter(
      (request) => request.method === 'PUT' && request.path === `${SCRIPTS}${label}`,
    )
    expect(uploads).toEqual([expect.objectContaining({ ifNoneMatch: '*', status: 200 })])
    const script = report.scripts.find((candidate) => candidate.name === label)!
    expect(script.tags).toEqual(
      expect.arrayContaining([
        `astrale-line:${line}`,
        expect.stringMatching(/^astrale-artifact:/u),
      ]),
    )
    expect(script.compatibilityFlags).toEqual(
      expect.arrayContaining(['nodejs_compat', 'global_fetch_strictly_public']),
    )
    // Exactly the Environment's declared secrets and the deployment's own key; no router binding.
    expect(names(script, 'secret_text')).toEqual(
      [...SECRET_NAMES, 'ASTRALE_SIGNING_IDENTITY'].sort(),
    )
    expect(names(script, 'service')).toEqual([])

    const record = acceptDeploymentRecord(JSON.parse(report.routing[`record:${label}`]!))
    expect(record).toMatchObject({
      origin: ORIGIN,
      environment: 'production',
      providerScript: label,
      releaseDigest: result.release!.digest,
      buildDigest: result.build!.digest,
    })
    const summary = acceptPlatformDeploymentSummary(JSON.parse(report.routing[`summary:${label}`]!))
    expect(summary).toMatchObject({ owner: 'platform', id: label, state: 'active' })
  })

  it('reuses the production deployment of the same release and rewrites its secrets in place', () => {
    const [created, reused] = report.runs.map(deployResult)
    const label = created!.deployment.script!
    expect(reused).toEqual({
      ...created,
      deployment: { ...created!.deployment, state: 'reused' },
      secrets: { state: 'updated' },
    })
    const uploads = report.requests.filter(
      (request) => request.method === 'PUT' && request.path === `${SCRIPTS}${label}`,
    )
    expect(uploads).toHaveLength(1)
    const script = report.scripts.find((candidate) => candidate.name === label)!
    expect(secret(script, 'GITHUB_TOKEN')).toBe('production-token-rotated')
  })

  it('deploys development on its own readable line beside production', () => {
    const [production, , development] = report.runs.map(deployResult)
    const line = deploymentLine({
      origin: ORIGIN,
      environment: 'development',
      addressing: 'readable',
    })
    expect(development!.deployment.script).toMatch(new RegExp(`^${line}-[a-z2-7]{16}$`, 'u'))
    expect(development!.deployment.state).toBe('created')
    expect(development!.url).not.toBe(production!.url)
    const script = report.scripts.find(
      (candidate) => candidate.name === development!.deployment.script,
    )!
    expect(secret(script, 'GITHUB_TOKEN')).toBe('development-token')
  })

  it('touches nothing but its own namespace scripts and routing keys', () => {
    expect(report.scripts.map(({ name }) => name).sort()).toEqual(
      report.runs
        .map(deployResult)
        .map((result) => result.deployment.script!)
        .filter((label, index, labels) => labels.indexOf(label) === index)
        .sort(),
    )
    for (const request of report.requests) {
      if (request.host === 'api.cloudflare.com') {
        // Only the platform namespace's scripts and the account's KV: no account Worker, route,
        // custom domain, workers.dev subdomain or DNS record.
        expect(request.path).toMatch(
          new RegExp(`^(${escapeRegExp(SCRIPTS)}|/storage/kv/namespaces)`, 'u'),
        )
      } else {
        expect(request.host).toMatch(
          new RegExp(`^ui-[a-z0-9-]+\\.${escapeRegExp(ROUTING_DOMAIN)}$`, 'u'),
        )
        expect(request.method).toBe('GET')
      }
    }
    const keys = Object.keys(report.routing).sort()
    const labels = report.scripts.map(({ name }) => name).sort()
    expect(keys).toEqual(labels.flatMap((label) => [`record:${label}`, `summary:${label}`]).sort())
  })
})

function deployResult(run: Run): DeployResultV1 {
  expect(run.error).toBeUndefined()
  expect(run.exitCode).toBe(0)
  return JSON.parse(run.stdout) as DeployResultV1
}

function names(script: FakeScript, type: string): string[] {
  return script.bindings
    .filter((binding) => binding.type === type)
    .map((binding) => binding.name)
    .sort()
}

function secret(script: FakeScript, name: string): unknown {
  return script.bindings.find((binding) => binding.type === 'secret_text' && binding.name === name)
    ?.text
}

function writeSecrets(file: string, token: string): void {
  writeFileSync(
    join(project, file),
    `GITHUB_TOKEN=${token}\nGITHUB_OWNER=astrale-os\nGITHUB_REPOSITORY=ui\nGITHUB_ACTOR=ui-fixture\n`,
  )
}

/** Git and the CLI's own git reads without the user's or the system's configuration. */
function isolatedGit(): Record<string, string> {
  return {
    PATH: process.env.PATH ?? '',
    HOME: home,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'ui fixture',
    GIT_AUTHOR_EMAIL: 'fixture@ui.example',
    GIT_COMMITTER_NAME: 'ui fixture',
    GIT_COMMITTER_EMAIL: 'fixture@ui.example',
  }
}

function git(...args: readonly string[]): void {
  const completed = spawnSync('git', args, { cwd: project, encoding: 'utf8', env: isolatedGit() })
  if (completed.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${completed.stderr}`)
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}
