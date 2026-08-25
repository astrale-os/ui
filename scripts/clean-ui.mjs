import { rm } from 'node:fs/promises'

await rm(new URL('../packages/ui/dist', import.meta.url), { recursive: true, force: true })
await rm(new URL('../packages/ui/tsconfig.tsbuildinfo', import.meta.url), { force: true })
