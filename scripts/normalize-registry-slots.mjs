import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name)
        return entry.isDirectory() ? walk(target) : target
      }),
    )
  ).flat()
}

for (const file of (await walk('registry')).filter((target) => target.endsWith('.tsx'))) {
  const original = await readFile(file, 'utf8')
  const insertions = []
  const stem = file
    .replace(/^registry\//u, '')
    .replace(/\.tsx$/u, '')
    .replaceAll('/', '-')
  const source = original.replace(
    new RegExp(`data-slot="${stem}-([a-z][a-z0-9-]*)-\\d+"`, 'gu'),
    `data-slot="${stem}-$1"`,
  )
  for (const match of source.matchAll(/<([a-z][a-z0-9-]*)(?=[\s/>])/gu)) {
    const position = match.index + match[0].length
    const closing = source.indexOf('>', position)
    if (closing < 0) throw new Error(`Unclosed JSX tag in ${file}`)
    if (!source.slice(position, closing).includes('data-slot=')) {
      insertions.push({ position, text: ` data-slot="${stem}-${match[1]}"` })
    }
  }
  let output = source
  for (const insertion of insertions.sort((left, right) => right.position - left.position)) {
    output = output.slice(0, insertion.position) + insertion.text + output.slice(insertion.position)
  }
  if (output !== original) await writeFile(file, output, 'utf8')
}
