import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, normalizePath, type Plugin } from 'vite'

type UiPackageDocument = {
  exports: Record<string, string | { import?: string }>
}

type PlaygroundPackageDocument = {
  dependencies?: Record<string, string>
}

const uiRoot = new URL('../packages/ui/', import.meta.url)
const catalogModule = normalizePath(
  fileURLToPath(new URL('./src/catalog/previews.ts', import.meta.url)),
)
const previewRoots = [
  fileURLToPath(new URL('../packages/ui/previews', import.meta.url)),
  fileURLToPath(new URL('../registry', import.meta.url)),
  fileURLToPath(new URL('../registry/variants/source', import.meta.url)),
]
const variantSupportRoot = fileURLToPath(new URL('../registry/variants/support', import.meta.url))

function catalogPreviewFileWatcher(): Plugin {
  return {
    name: 'astrale-catalog-preview-file-watcher',
    configureServer(server) {
      server.watcher.add(previewRoots)
      const refreshCatalog = (path: string) => {
        const normalized = normalizePath(path)
        if (!normalized.endsWith('.preview.tsx')) return
        if (!previewRoots.some((root) => normalized.startsWith(`${normalizePath(root)}/`))) return
        const catalog = server.moduleGraph.getModuleById(catalogModule)
        if (catalog) server.moduleGraph.invalidateModule(catalog)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refreshCatalog)
      server.watcher.on('unlink', refreshCatalog)
    },
  }
}

function variantSupportResolver(): Plugin {
  return {
    name: 'astrale-variant-support-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith('@/')) return
      const match = importer
        ? /^(.*\/registry\/variants\/source\/(?:components|patterns|blocks)\/[^/]+\/[^/]+)\//u.exec(
            normalizePath(importer),
          )
        : undefined
      const candidates = [
        ...(match ? [`${match[1]}/support/${source.slice(2)}`] : []),
        `${variantSupportRoot}/${source.slice(2)}`,
      ]
      for (const candidate of candidates) {
        for (const extension of ['', '.tsx', '.ts', '.jsx', '.js']) {
          if (existsSync(`${candidate}${extension}`)) return `${candidate}${extension}`
        }
      }
      return undefined
    },
  }
}
const uiPackage = JSON.parse(
  readFileSync(new URL('package.json', uiRoot), 'utf8'),
) as UiPackageDocument
const playgroundPackage = JSON.parse(
  readFileSync(new URL('package.json', import.meta.url), 'utf8'),
) as PlaygroundPackageDocument
const playgroundDependencyOwners = Object.keys(playgroundPackage.dependencies ?? {}).filter(
  (dependency) => dependency !== '@astrale-os/ui',
)

const publicSourceAliases = Object.entries(uiPackage.exports).flatMap(([entrypoint, target]) => {
  const importPath = typeof target === 'string' ? undefined : target.import
  if (!importPath?.startsWith('./dist/') || !importPath.endsWith('.js')) return []
  const sourceWithoutExtension = importPath.slice('./dist/'.length, -'.js'.length)
  const source = ['.tsx', '.ts']
    .map((extension) => new URL(`src/${sourceWithoutExtension}${extension}`, uiRoot))
    .find((candidate) => existsSync(candidate))
  if (!source) throw new Error(`Missing source owner for UI export ${entrypoint}.`)
  return [
    {
      find: entrypoint === '.' ? /^@astrale-os\/ui$/u : `@astrale-os/ui/${entrypoint.slice(2)}`,
      replacement: fileURLToPath(source),
    },
  ]
})

export default defineConfig(({ mode }) => ({
  plugins: [variantSupportResolver(), tailwindcss(), react(), catalogPreviewFileWatcher()],
  // Next's client-only Link/Image entrypoints inspect this compile-time value.
  // Variant source remains copy-owned; this is playground runtime plumbing.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
    __ASTRALE_STUDIO_CATALOG__: JSON.stringify(
      mode !== 'public' && process.env.ASTRALE_STUDIO_CATALOG !== '0',
    ),
  },
  resolve: {
    // Variant source lives outside the Vite root. Resolve every explicitly declared host
    // dependency from the playground rather than searching upward from an item source file.
    dedupe: playgroundDependencyOwners,
    alias: [
      {
        find: /^@astrale-os\/ui\/theme\.css$/u,
        replacement: fileURLToPath(new URL('../packages/ui/src/theme/theme.css', import.meta.url)),
      },
      {
        find: /^@astrale-os\/ui\/reset\.css$/u,
        replacement: fileURLToPath(new URL('../packages/ui/src/theme/reset.css', import.meta.url)),
      },
      {
        find: /^@astrale-os\/ui\/presets\/(.+)\.css$/u,
        replacement: fileURLToPath(
          new URL('../packages/ui/src/theme/presets/$1.css', import.meta.url),
        ),
      },
      {
        find: /^#astrale-ui\/(.+)$/u,
        replacement: fileURLToPath(new URL('../packages/ui/src/$1', import.meta.url)),
      },
      ...publicSourceAliases,
    ],
  },
  server: {
    strictPort: true,
    forwardConsole: { unhandledErrors: false, logLevels: ['error', 'warn'] },
    watch:
      process.env.ASTRALE_STUDIO_CATALOG === '1' ? { usePolling: true, interval: 150 } : undefined,
  },
  build: { manifest: true, sourcemap: false },
}))
