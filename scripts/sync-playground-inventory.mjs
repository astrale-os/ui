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

// Every public component entrypoint, upstream or owned here (the Finder), by the source folder that
// owns it; the class-name helper and the brand are not catalog components.
const packageJson = JSON.parse(await readFile('packages/ui/package.json', 'utf8'))
const runtimeComponents = Object.entries(packageJson.exports)
  .filter(
    ([name, target]) =>
      name.startsWith('./') &&
      name !== './class-name' &&
      !name.startsWith('./brand') &&
      typeof target?.import === 'string' &&
      target.import.endsWith('/index.js'),
  )
  .map(([name, target]) => ({
    name: name.slice(2),
    owner: target.import.replace(/^\.\/dist\//u, '').split('/')[0],
  }))

const output = groups.map((group) => ({
  id: group.id,
  label: group.label,
  components: runtimeComponents
    .filter((component) => group.owners.has(component.owner))
    .map((component) => component.name)
    .toSorted(),
}))
const grouped = output.flatMap((group) => group.components)
for (const component of runtimeComponents) {
  if (!grouped.includes(component.name)) {
    throw new Error(`No catalog group owns ${component.owner}/${component.name}.`)
  }
}

const registryComponents = provenance.components
  .filter((component) => component.disposition === 'owned-registry-component')
  .map((component) => component.address.slice('@shadcn/'.length))
  .toSorted()

const componentSources = Object.fromEntries(
  provenance.components
    .filter((component) =>
      ['owned-runtime', 'owned-registry-component'].includes(component.disposition),
    )
    .map((component) => {
      const name = component.address.slice(component.address.indexOf('/') + 1)
      return [`component/${name}`, component.address]
    }),
)

await writeFile(
  'playground/src/catalog/inventory.ts',
  `export const componentGroups = ${JSON.stringify(output, null, 2)} as const\n\nexport const registryComponents = ${JSON.stringify(registryComponents, null, 2)} as const\n\nexport const componentSources = ${JSON.stringify(componentSources, null, 2)} as const\n\nexport const runtimeComponentNames = componentGroups.flatMap((group) => group.components)\nexport const componentNames = [...runtimeComponentNames, ...registryComponents]\n`,
)
