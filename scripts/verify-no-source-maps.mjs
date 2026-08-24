import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const roots = process.argv.slice(2).map((entry) => resolve(entry))
if (roots.length === 0) throw new Error('pass at least one build directory')

const failures = []
for (const root of roots) await inspect(root)

if (failures.length > 0) {
  throw new Error(`published output contains source maps:\n${failures.join('\n')}`)
}

console.log(`PASS published output contains no source maps (${roots.length} directories)`)

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      await inspect(path)
      continue
    }

    if (entry.name.endsWith('.map')) {
      failures.push(path)
      continue
    }

    if (!/\.(?:c?js|mjs|css)$/u.test(entry.name)) continue
    const contents = await readFile(path, 'utf8')
    if (/^[#/@*\s]*sourceMappingURL=/mu.test(contents)) failures.push(path)
  }
}
