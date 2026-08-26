import { readFile, writeFile } from 'node:fs/promises'

const provenance = JSON.parse(
  await readFile('tooling/upstream/providers/shadcn/4.18.0/base-nova/provenance.json', 'utf8'),
)
const packagePath = 'packages/ui/package.json'
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const runtimeComponents = provenance.components.filter(
  (component) => component.disposition === 'owned-runtime',
)

const retainedExports = Object.entries(packageJson.exports).filter(
  ([name]) =>
    name === '.' || name === './class-name' || name.endsWith('.css') || name === './package.json',
)
packageJson.exports = Object.fromEntries(retainedExports)

for (const component of runtimeComponents) {
  const name = component.address.slice('@shadcn/'.length)
  const owner = component.implementation
    .replace(/^packages\/ui\/src\//u, '')
    .replace(/\/index\.tsx$/u, '')
  packageJson.exports[`./${name}`] = {
    types: `./dist/${owner}/index.d.ts`,
    import: `./dist/${owner}/index.js`,
    default: `./dist/${owner}/index.js`,
  }
}

const cssExports = Object.entries(packageJson.exports).filter(
  ([name]) => name.endsWith('.css') || name === './package.json',
)
const codeExports = Object.entries(packageJson.exports)
  .filter(
    ([name]) =>
      name === '.' ||
      name === './class-name' ||
      (!name.endsWith('.css') && name !== './package.json'),
  )
  .toSorted(([a], [b]) => a.localeCompare(b))
packageJson.exports = Object.fromEntries([...codeExports, ...cssExports])

await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

const rootExports = runtimeComponents
  .map((component) =>
    component.implementation
      .replace(/^packages\/ui\/src\//u, "export * from './")
      .replace(/\.tsx$/u, ".js'"),
  )
  .toSorted()
await writeFile(
  'packages/ui/src/index.ts',
  [`export { cn } from './class-name.js'`, ...rootExports, ''].join('\n'),
)
