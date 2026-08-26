import type { ComponentType } from 'react'

import registry from '../../../registry/registry.json'
import { componentGroups, componentSources } from './inventory.js'

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

const runtimeModules = import.meta.glob<PreviewModule>(
  '../../../packages/ui/previews/**/*.preview.tsx',
)
const registryModules = import.meta.glob<PreviewModule>('../../../registry/**/*.preview.tsx')

const runtimeGroups = new Map<string, { id: string; label: string }>(
  componentGroups.flatMap((group) =>
    group.components.map((name) => [name, { id: group.id, label: group.label }] as const),
  ),
)
const registryTitles = new Map(
  registry.items.map((item) => [item.meta.canonicalAddress, item.title] as const),
)
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
    const runtimeGroup = runtimeGroups.get(subject)
    group = runtimeGroup?.label ?? 'Components'
    family = runtimeGroup?.id ?? 'runtime'
  } else {
    const component = /\/registry\/components\/([^/]+)\/[^/]+$/u.exec(path)
    const composition = /\/registry\/(patterns|blocks)\/([^/]+)\/[^/]+$/u.exec(path)
    if (component) {
      if (component[1] !== subject) throw new Error(`Registry preview subject mismatch: ${path}`)
      address = `component/${subject}`
      group = 'Registry components'
      family = 'registry'
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
    title: scene === 'default' ? words(subject) : `${words(subject)} · ${words(scene)}`,
    defaultCanvas: kind === 'block' ? 'viewport' : 'panel',
    expectedSource: kind === 'component' ? admittedComponentSources[address] : undefined,
    load,
  }
}

export const previewDescriptors = [
  ...Object.entries(runtimeModules),
  ...Object.entries(registryModules),
]
  .map(([path, load]) => describe(path, load))
  .sort((left, right) => left.id.localeCompare(right.id))

const admittedCanvases = new Set<PreviewCanvas>(['compact', 'panel', 'wide', 'viewport'])

export function admitPreviewModule(descriptor: PreviewDescriptor, module: PreviewModule) {
  if (!module.default) throw new Error(`${descriptor.id} has no default preview component.`)
  const canvas = module.preview?.canvas ?? descriptor.defaultCanvas
  if (!admittedCanvases.has(canvas))
    throw new Error(`${descriptor.id} has invalid canvas ${canvas}.`)
  if (descriptor.kind === 'component' && module.preview?.source !== descriptor.expectedSource) {
    throw new Error(
      `${descriptor.id} source ${module.preview?.source ?? '(missing)'} does not match ${descriptor.expectedSource ?? '(unknown)'}.`,
    )
  }
  if (module.preview?.source !== undefined && module.preview.source.trim() === '') {
    throw new Error(`${descriptor.id} has an empty source reference.`)
  }
  return { component: module.default, canvas }
}
