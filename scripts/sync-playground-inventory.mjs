import { readFile, writeFile } from 'node:fs/promises'

const provenance = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', 'utf8'),
)
const groups = [
  { id: 'actions-inputs', label: 'Actions & inputs', owners: new Set(['action', 'input']) },
  {
    id: 'content-feedback',
    label: 'Content & feedback',
    owners: new Set(['content', 'feedback']),
  },
  {
    id: 'navigation-layout',
    label: 'Navigation & layout',
    owners: new Set(['disclosure', 'layout', 'navigation']),
  },
  { id: 'menus-overlays', label: 'Menus & overlays', owners: new Set(['menu', 'overlay']) },
]

const output = groups.map((group) => ({
  id: group.id,
  label: group.label,
  components: provenance.components
    .filter((component) => component.disposition === 'owned-runtime')
    .filter((component) => {
      const owner = component.implementation.replace(/^packages\/ui\/src\//u, '').split('/')[0]
      return group.owners.has(owner)
    })
    .map((component) => component.address.slice('@shadcn/'.length))
    .toSorted(),
}))

const registryComponents = provenance.components
  .filter((component) => component.disposition === 'owned-registry-component')
  .map((component) => component.address.slice('@shadcn/'.length))
  .toSorted()

await writeFile(
  'playground/src/catalog/inventory.ts',
  `export const componentGroups = ${JSON.stringify(output, null, 2)} as const\n\nexport const registryComponents = ${JSON.stringify(registryComponents, null, 2)} as const\n\nexport const runtimeComponentNames = componentGroups.flatMap((group) => group.components)\nexport const componentNames = [...runtimeComponentNames, ...registryComponents]\n`,
)
