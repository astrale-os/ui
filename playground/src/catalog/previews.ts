import type { ComponentType } from 'react'

import registry from '../../../registry/registry.json'
import { componentSources } from './inventory.js'

declare const __ASTRALE_STUDIO_CATALOG__: boolean

export type PreviewCanvas = 'compact' | 'panel' | 'wide' | 'viewport'

export type PreviewModule = {
  default: ComponentType
  preview?: {
    canvas?: PreviewCanvas
    source?: string
  }
}

export type PreviewDescriptor = {
  address: string
  scene: string
  id: string
  canonical: boolean
  kind: 'component' | 'pattern' | 'block'
  family: string
  group: string
  title: string
  defaultCanvas: 'panel' | 'viewport'
  expectedSource?: string
  load: () => Promise<PreviewModule>
}

type StudioCatalogItem = { address: string; title: string; source: string }

const runtimeModules = import.meta.glob<PreviewModule>(
  '../../../packages/ui/previews/**/*.preview.tsx',
)
const registryModules = import.meta.glob<PreviewModule>('../../../registry/**/*.preview.tsx')
const studioModules = __ASTRALE_STUDIO_CATALOG__
  ? import.meta.glob<PreviewModule>('../../../.internal/shadcn-studio/registry/**/*.preview.tsx')
  : {}
const studioCatalogModules = (
  __ASTRALE_STUDIO_CATALOG__
    ? import.meta.glob('../../../.internal/shadcn-studio/catalog.json', {
        eager: true,
        import: 'default',
      })
    : {}
) as Record<string, StudioCatalogItem[]>
const studioCatalog = Object.values(studioCatalogModules)[0] ?? []

const registryTitles = new Map([
  ...registry.items.map((item) => [item.meta.canonicalAddress, item.title] as const),
  ...studioCatalog.map((item) => [item.address, item.title] as const),
])
const registrySources = new Map([
  ...registry.items
    .filter((item) => 'upstreamAddress' in item.meta)
    .map((item) => [item.meta.canonicalAddress, item.meta.upstreamAddress] as const),
  ...studioCatalog.map((item) => [item.address, item.source] as const),
])
const admittedComponentSources: Readonly<Record<string, string>> = componentSources

function words(value: string) {
  return value.replaceAll('-', ' ')
}

function describe(path: string, load: () => Promise<PreviewModule>): PreviewDescriptor {
  const filename = path.split('/').at(-1)!
  const match = /^(?<subject>[a-z0-9-]+)(?:\.(?<scene>[a-z0-9-]+))?\.preview\.tsx$/u.exec(filename)
  if (!match?.groups) throw new Error(`Invalid preview path ${path}`)
  if (match.groups.scene === 'default') throw new Error(`Do not spell the canonical scene: ${path}`)
  const subject = match.groups.subject
  const scene = match.groups.scene ?? 'default'
  let address: string
  let group: string
  let family: string

  const runtime = /\/packages\/ui\/previews\/([^/]+)\/[^/]+$/u.exec(path)
  if (runtime) {
    if (runtime[1] !== subject) throw new Error(`Runtime preview subject mismatch: ${path}`)
    address = `component/${subject}`
    group = words(subject)
    family = subject
  } else {
    const studio =
      /\/\.internal\/shadcn-studio\/registry\/(components|patterns|blocks)\/([^/]+)\/([^/]+)\/[^/]+$/u.exec(
        path,
      )
    const component = /\/registry\/components\/([^/]+)\/[^/]+$/u.exec(path)
    const composition = /\/registry\/(patterns|blocks)\/([^/]+)\/[^/]+$/u.exec(path)
    if (studio) {
      if (studio[3] !== subject) throw new Error(`Studio preview subject mismatch: ${path}`)
      const kind = studio[1] === 'components' ? 'component' : studio[1].slice(0, -1)
      address = `${kind}/${studio[2]}/${subject}`
      group = words(studio[2])
      family = studio[2]
    } else if (component) {
      if (component[1] !== subject) throw new Error(`Registry preview subject mismatch: ${path}`)
      address = `component/${subject}`
      group = words(subject)
      family = subject
    } else if (composition) {
      const kind = composition[1] === 'patterns' ? 'pattern' : 'block'
      address = `${kind}/${composition[2]}/${subject}`
      group = `${words(composition[2])} ${kind}s`
      family = composition[2]
    } else {
      throw new Error(`Preview has no catalog owner: ${path}`)
    }
  }

  const [kind] = address.split('/') as ['component' | 'pattern' | 'block']
  if (!registryTitles.has(address) && kind !== 'component') {
    throw new Error(`Preview has no registry item: ${address}`)
  }
  return {
    address,
    scene,
    id: `${address}#${scene}`,
    canonical: scene === 'default',
    kind,
    family,
    group,
    title:
      scene === 'default'
        ? (registryTitles.get(address) ?? words(subject))
        : `${words(subject)} · ${words(scene)}`,
    defaultCanvas: kind === 'block' ? 'viewport' : 'panel',
    expectedSource: registrySources.get(address) ?? admittedComponentSources[address],
    load,
  }
}

export const previewDescriptors = [
  ...Object.entries(runtimeModules),
  ...Object.entries(registryModules),
  ...Object.entries(studioModules),
]
  .map(([path, load]) => describe(path, load))
  .sort((left, right) => left.id.localeCompare(right.id))

const admittedCanvases = new Set<PreviewCanvas>(['compact', 'panel', 'wide', 'viewport'])

export function admitPreviewModule(descriptor: PreviewDescriptor, module: PreviewModule) {
  if (!module.default) throw new Error(`${descriptor.id} has no default preview component.`)
  const canvas = module.preview?.canvas ?? descriptor.defaultCanvas
  if (!admittedCanvases.has(canvas))
    throw new Error(`${descriptor.id} has invalid canvas ${canvas}.`)
  if (descriptor.expectedSource && module.preview?.source !== descriptor.expectedSource) {
    throw new Error(
      `${descriptor.id} source ${module.preview?.source ?? '(missing)'} does not match ${descriptor.expectedSource ?? '(unknown)'}.`,
    )
  }
  if (module.preview?.source !== undefined && module.preview.source.trim() === '') {
    throw new Error(`${descriptor.id} has an empty source reference.`)
  }
  return { component: module.default, canvas }
}
