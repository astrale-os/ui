import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { parseThemeDocumentText, serializeThemeDocument } from '../tooling/theme-document/index.ts'

const directory = 'registry/themes'
for (const file of await readdir(directory)) {
  if (!file.endsWith('.astrale-theme.json')) continue
  const target = path.join(directory, file)
  await writeFile(
    target,
    serializeThemeDocument(parseThemeDocumentText(await readFile(target, 'utf8'))),
  )
}

console.log('PASS migrated portable themes to version 2')
