import type { CloudflareAdapterBindings } from '@astrale-os/adapter-cloudflare/worker'
import type { Runtime } from '@astrale-os/sdk/runtime'

import {
  decodeSigningIdentity,
  deploymentSettings,
  generatedCloudflareWorkerEntry,
  runtimeBindings,
  withDirectIssuer,
} from '@astrale-os/adapter-cloudflare/worker'
import { cloudflareFrontDoor } from '@astrale-os/adapter-cloudflare/worker/front'
import { generatedMaterial } from '@astrale-os/sdk/deployment/build'
import { createHash } from 'node:crypto'

type Build = Parameters<typeof generatedMaterial>[0]

/** The account and API token the fixture deploys with. Neither exists at Cloudflare. */
export const ACCOUNT = '0123456789abcdef0123456789abcdef'
export const TOKEN = 'ui-namespace-fixture-token'
/** The Cloudflare API base adapter-cloudflare calls when nothing overrides it. */
const API_BASE = 'https://api.cloudflare.com/client/v4'

/** One binding as an upload's metadata declares it, secret values included. */
export type UploadedBinding = Readonly<Record<string, unknown>> & {
  readonly type: string
  readonly name: string
}

/** One script of the fake dispatch namespace, as Cloudflare keeps it. */
export interface FakeScript {
  readonly etag: string
  /** The current provider version (`deployment_id`), in Cloudflare's compact form. */
  version: string
  readonly tags: readonly string[]
  readonly compatibilityDate: string
  readonly compatibilityFlags: readonly string[]
  readonly mainModule: string
  readonly modules: readonly string[]
  bindings: UploadedBinding[]
}

/** One request the fake received. Secret values never appear here. */
export interface RecordedRequest {
  readonly method: string
  /** The URL, the account prefix of an API path left out, with its query. */
  readonly path: string
  readonly host: string
  readonly ifNoneMatch?: string
  readonly status: number
}

interface KvNamespace {
  readonly id: string
  readonly title: string
  readonly values: Map<string, string>
}

/**
 * A fake Cloudflare account for one deploy of a namespace-mode Environment: the Workers for
 * Platforms API of one dispatch namespace and Workers KV, as the OPS-2 spike recorded them (a
 * create-only upload over an existing script answers 412 with code 10018; a secret PUT keeps the
 * script's etag and tags, mints a new `deployment_id` and answers only `{ name, type }`), and the
 * platform dispatcher at `https://<label>.<routingDomain>`, which serves a label only once its
 * `record:<label>` exists.
 *
 * A script runs the generated Worker of this Domain's Build in this process, with exactly the
 * bindings its upload declared and its current version as version metadata. Any other host is
 * refused, so a deploy that tried to reach anything else fails instead of leaving the process.
 */
export class FakeCloudflare {
  readonly requests: RecordedRequest[] = []
  readonly scripts = new Map<string, FakeScript>()
  private readonly kvs: KvNamespace[]
  private readonly isolates = new Map<string, Isolate>()
  private sequence = 0

  constructor(
    private readonly options: {
      readonly namespace: string
      readonly routingDomain: string
      readonly routingKvTitle: string
      readonly build: Build
      readonly runtime: Runtime
    },
  ) {
    this.kvs = [
      { id: hex('unrelated'), title: 'an-unrelated-kv', values: new Map() },
      { id: hex('routing'), title: options.routingKvTitle, values: new Map() },
    ]
  }

  /** The routing KV the platform dispatcher reads. */
  get routing(): ReadonlyMap<string, string> {
    return this.kvs[1]!.values
  }

  /** A provider version, as a deployment's Worker reports it, in UUID form. */
  static uuid(version: string): string {
    return `${version.slice(0, 8)}-${version.slice(8, 12)}-${version.slice(12, 16)}-${version.slice(16, 20)}-${version.slice(20)}`
  }

  readonly fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    let response: Response
    if (request.url.startsWith(`${API_BASE}/`)) response = await this.api(request, url)
    else if (url.hostname.endsWith(`.${this.options.routingDomain}`)) {
      response = await this.dispatch(request, url)
    } else {
      this.record(request, url, 599)
      throw new TypeError(`The fake Cloudflare account has no host ${url.host}.`)
    }
    this.record(request, url, response.status)
    return response
  }

  private record(request: Request, url: URL, status: number): void {
    const prefix = `/client/v4/accounts/${ACCOUNT}`
    const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
    const ifNoneMatch = request.headers.get('if-none-match')
    this.requests.push({
      method: request.method,
      host: url.host,
      path: `${path}${url.search}`,
      ...(ifNoneMatch === null ? {} : { ifNoneMatch }),
      status,
    })
  }

  /** Answer one call to a deployment URL as the platform dispatcher does. */
  private async dispatch(request: Request, url: URL): Promise<Response> {
    const label = url.hostname.slice(0, -`.${this.options.routingDomain}`.length)
    const record = this.routing.get(`record:${label}`)
    const script = this.scripts.get(label)
    if (record === undefined || script === undefined) {
      return Response.json({ error: { code: 5001 } }, { status: 503 })
    }
    if (url.pathname === '/.well-known/astrale/deployment.json') {
      return new Response(record, { status: 200 })
    }
    const key = `${label}@${script.version}`
    let isolate = this.isolates.get(key)
    if (isolate === undefined) {
      isolate = new Isolate(
        script.version,
        script.bindings,
        this.options.build,
        this.options.runtime,
      )
      this.isolates.set(key, isolate)
    }
    return isolate.fetch(request)
  }

  private async api(request: Request, url: URL): Promise<Response> {
    const prefix = `/client/v4/accounts/${ACCOUNT}`
    if (!url.pathname.startsWith(`${prefix}/`)) return failure(404, 7003, 'No route.')
    if (request.headers.get('authorization') !== `Bearer ${TOKEN}`) {
      return failure(403, 10000, 'Authentication error')
    }
    if (url.pathname === `${prefix}/storage/kv/namespaces` && request.method === 'GET') {
      return envelope(
        this.kvs.map(({ id, title }) => ({ id, title })),
        { page: 1, per_page: 1000, total_pages: 1, total_count: this.kvs.length },
      )
    }
    const kv = /\/storage\/kv\/namespaces\/([^/]+)\/values\/(.+)$/u.exec(url.pathname)
    if (kv !== null) {
      const namespace = this.kvs.find((candidate) => candidate.id === kv[1])
      if (namespace === undefined) return failure(404, 10013, 'namespace not found')
      const key = decodeURIComponent(kv[2]!)
      if (request.method === 'GET') {
        const value = namespace.values.get(key)
        return value === undefined
          ? failure(404, 10009, 'get: key not found')
          : new Response(value, { status: 200 })
      }
      if (request.method === 'PUT') {
        namespace.values.set(key, await request.text())
        return envelope(null)
      }
    }
    const scripts = `${prefix}/workers/dispatch/namespaces/${this.options.namespace}/scripts/`
    if (url.pathname.startsWith(scripts)) {
      const [name, suffix = ''] = url.pathname.slice(scripts.length).split(/(?=\/)/u, 2) as [
        string,
        string?,
      ]
      return this.script(request, decodeURIComponent(name), suffix)
    }
    return failure(404, 7003, `No route for ${request.method} ${url.pathname}.`)
  }

  private async script(request: Request, name: string, suffix: string): Promise<Response> {
    const script = this.scripts.get(name)
    if (suffix === '' && request.method === 'GET') {
      if (script === undefined) return failure(404, 10007, 'This Worker does not exist.')
      return envelope({
        dispatch_namespace: this.options.namespace,
        script: {
          id: name,
          etag: script.etag,
          deployment_id: script.version,
          tags: script.tags.length === 0 ? null : [...script.tags],
        },
      })
    }
    if (suffix === '' && request.method === 'PUT') {
      const form = await request.formData()
      const metadata = JSON.parse(await (form.get('metadata') as File).text()) as Record<
        string,
        unknown
      >
      if (script !== undefined && request.headers.get('if-none-match') === '*') {
        return failure(
          412,
          10018,
          'The request could not be completed due to a precondition failure.',
        )
      }
      if (metadata.assets !== undefined) {
        return failure(400, 10021, 'This fixture serves no static assets.')
      }
      const modules: string[] = []
      const digest = createHash('sha256')
      for (const [field, value] of form.entries()) {
        if (field === 'metadata') continue
        modules.push(field)
        digest.update(field).update(new Uint8Array(await (value as File).arrayBuffer()))
      }
      const created: FakeScript = {
        etag: digest.digest('hex'),
        version: this.version(),
        tags: (metadata.tags as string[] | undefined) ?? [],
        compatibilityDate: metadata.compatibility_date as string,
        compatibilityFlags: (metadata.compatibility_flags as string[] | undefined) ?? [],
        mainModule: metadata.main_module as string,
        modules,
        bindings: metadata.bindings as UploadedBinding[],
      }
      this.scripts.set(name, created)
      return envelope({
        id: name,
        etag: created.etag,
        deployment_id: created.version,
        tags: created.tags.length === 0 ? null : [...created.tags],
        compatibility_date: created.compatibilityDate,
        compatibility_flags: created.compatibilityFlags,
        has_assets: false,
        has_modules: true,
      })
    }
    if (script === undefined) return failure(404, 10007, 'This Worker does not exist.')
    if (suffix === '/secrets' && request.method === 'GET') {
      return envelope(
        script.bindings
          .filter((binding) => binding.type === 'secret_text')
          .map((binding) => ({ name: binding.name, type: 'secret_text' })),
      )
    }
    if (suffix === '/secrets' && request.method === 'PUT') {
      const body = (await request.json()) as { name: string; text: string; type: string }
      script.bindings = [
        ...script.bindings.filter((binding) => binding.name !== body.name),
        { type: 'secret_text', name: body.name, text: body.text },
      ]
      script.version = this.version()
      return envelope({ name: body.name, type: 'secret_text' })
    }
    if (suffix === '/settings' && request.method === 'GET') {
      return envelope({
        compatibility_date: script.compatibilityDate,
        compatibility_flags: script.compatibilityFlags,
        tags: script.tags,
        bindings: script.bindings.map((binding) =>
          binding.type === 'secret_text' ? { name: binding.name, type: binding.type } : binding,
        ),
      })
    }
    return failure(404, 7003, `No route for ${request.method} ${suffix}.`)
  }

  private version(): string {
    return hex(`version-${(this.sequence += 1)}`).slice(0, 32)
  }
}

type WorkerEnvironment = CloudflareAdapterBindings & { readonly ASTRALE_SIGNING_IDENTITY: string }

/** One isolate of one script version: the generated Worker over the upload's bindings. */
class Isolate {
  private readonly worker
  private readonly frontDoor = cloudflareFrontDoor<WorkerEnvironment>({})
  private readonly environment: WorkerEnvironment

  constructor(
    version: string,
    bindings: readonly UploadedBinding[],
    build: Build,
    runtime: Runtime,
  ) {
    this.worker = generatedCloudflareWorkerEntry<
      WorkerEnvironment,
      Omit<WorkerEnvironment, 'ASTRALE_SIGNING_IDENTITY'>
    >()({
      load: async () => ({ runtime, material: generatedMaterial(build) }),
      privateKey: (env) => decodeSigningIdentity(env.ASTRALE_SIGNING_IDENTITY),
      resolveEnvironment: runtimeBindings,
      settings: withDirectIssuer(deploymentSettings),
      selfBinding: (env) => env.SELF,
    })
    const environment: Record<string, unknown> = {}
    for (const binding of bindings) {
      if (binding.type === 'plain_text' || binding.type === 'secret_text') {
        environment[binding.name] = binding.text
      } else if (binding.type === 'version_metadata') {
        environment[binding.name] = { id: FakeCloudflare.uuid(version), tag: '' }
      } else {
        throw new TypeError(`This fixture binds no ${binding.type} binding (${binding.name}).`)
      }
    }
    this.environment = environment as unknown as WorkerEnvironment
  }

  async fetch(request: Request): Promise<Response> {
    const context = { waitUntil() {}, passThroughOnException() {} } as unknown as Parameters<
      typeof this.worker.fetch
    >[2]
    const admission = await this.frontDoor.admit(request, this.environment)
    if (admission.kind !== 'execution') return admission.response
    return this.worker.fetch(request, this.environment, context)
  }
}

function envelope(result: unknown, resultInfo?: Record<string, unknown>): Response {
  return Response.json({
    result,
    success: true,
    errors: [],
    messages: [],
    ...(resultInfo === undefined ? {} : { result_info: resultInfo }),
  })
}

function failure(status: number, code: number, message: string): Response {
  return Response.json(
    { result: null, success: false, errors: [{ code, message }], messages: [] },
    { status },
  )
}

function hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
