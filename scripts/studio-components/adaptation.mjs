function replaceModuleSpecifiers(content, replacements) {
  const replace = (match, prefix, quote, specifier) => {
    const replacement = replacements.get(specifier)
    return replacement === undefined ? match : `${prefix}${quote}${replacement}${quote}`
  }
  return content
    .replace(/(^\s*(?:import|export)\b[\s\S]*?\bfrom\s*)(['"])([^'"]+)\2/gmu, replace)
    .replace(/(^\s*import\s*)(['"])([^'"]+)\2/gmu, replace)
}

export function moduleSpecifiers(content) {
  return [
    ...content.matchAll(/^\s*(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/gmu),
    ...content.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gmu),
  ].map((match) => match[1])
}

function adaptDrawerProfile(content) {
  if (!content.includes('@/components/ui/drawer')) return content
  let adapted = content.replace(
    /import \{ Drawer as DrawerPrimitive \} from ['"]vaul['"]/u,
    "import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'",
  )
  if (adapted.includes("from '@base-ui/react/drawer'")) {
    adapted = adapted.replaceAll('DrawerPrimitive.Content', 'DrawerPrimitive.Popup')
  }
  return adapted
    .replace(/(<Drawer\b[^>]*?)\bdirection=/gmu, '$1swipeDirection=')
    .replaceAll('vaul-drawer-direction', 'swipe-direction')
    .replaceAll('[swipe-direction=bottom]', '[swipe-direction=down]')
    .replaceAll('[swipe-direction=top]', '[swipe-direction=up]')
    .replace(
      "swipeDirection={side === 'bottom' ? undefined : (side as 'top' | 'right' | 'left')}",
      "swipeDirection={side === 'bottom' ? 'down' : side === 'top' ? 'up' : side}",
    )
}

function restoreDrawerProfile(content) {
  if (!content.includes('@astrale-os/ui/drawer') && !content.includes('@/components/ui/drawer')) {
    return content
  }
  let restored = content.replace(
    "swipeDirection={side === 'bottom' ? 'down' : side === 'top' ? 'up' : side}",
    "swipeDirection={side === 'bottom' ? undefined : (side as 'top' | 'right' | 'left')}",
  )
  restored = restored
    .replaceAll('[swipe-direction=down]', '[swipe-direction=bottom]')
    .replaceAll('[swipe-direction=up]', '[swipe-direction=top]')
    .replace(/(<Drawer\b[^>]*?)\bswipeDirection=/gmu, '$1direction=')
    .replaceAll('swipe-direction', 'vaul-drawer-direction')
  if (restored.includes("from '@base-ui/react/drawer'")) {
    restored = restored
      .replaceAll('DrawerPrimitive.Popup', 'DrawerPrimitive.Content')
      .replace(
        "import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'",
        "import { Drawer as DrawerPrimitive } from 'vaul'",
      )
  }
  return restored
}

function isReactSyntaxBridge(context) {
  return context.upstreamId === 'toggle-group-14' && context.target === 'assets/svg/thumbs-down.tsx'
}

function adaptReactSyntax(content, context) {
  if (!isReactSyntaxBridge(context)) return content
  return content
    .replaceAll('stroke-width=', 'strokeWidth=')
    .replaceAll('stroke-linecap=', 'strokeLinecap=')
    .replaceAll('stroke-linejoin=', 'strokeLinejoin=')
}

function restoreReactSyntax(content, context) {
  if (!isReactSyntaxBridge(context)) return content
  return content
    .replaceAll('strokeWidth=', 'stroke-width=')
    .replaceAll('strokeLinecap=', 'stroke-linecap=')
    .replaceAll('strokeLinejoin=', 'stroke-linejoin=')
}

function importRoutes(runtimeOwners) {
  return new Map([
    ['@/lib/utils', '@astrale-os/ui/class-name'],
    ...[...runtimeOwners]
      .filter((owner) => owner !== 'class-name')
      .map((owner) => [`@/components/ui/${owner}`, `@astrale-os/ui/${owner}`]),
  ])
}

export function adaptSource(content, context, runtimeOwners) {
  const reactAdapted = adaptReactSyntax(content, context)
  const profileAdapted = adaptDrawerProfile(reactAdapted)
  const adapted = replaceModuleSpecifiers(profileAdapted, importRoutes(runtimeOwners))
  const transformations = []
  if (reactAdapted !== content) transformations.push('react-syntax-bridge')
  if (profileAdapted !== reactAdapted) transformations.push('base-profile-bridge')
  if (adapted !== profileAdapted) transformations.push('imports-only')
  return { content: adapted, transformations }
}

export function restoreSource(content, context, runtimeOwners) {
  const routes = importRoutes(runtimeOwners)
  const restoredImports = replaceModuleSpecifiers(
    content,
    new Map([...routes].map(([from, to]) => [to, from])),
  )
  return restoreReactSyntax(restoreDrawerProfile(restoredImports), context)
}

export function proveImportTransformScope(runtimeOwners) {
  const source = `import { cn } from '@/lib/utils'\nconst shown = '@/lib/utils'\n// import '@/lib/utils'\nexport const sample = shown\n`
  const adapted = adaptSource(
    source,
    { upstreamId: 'fixture', target: 'fixture.tsx' },
    runtimeOwners,
  ).content
  return {
    adapted,
    expected: `import { cn } from '@astrale-os/ui/class-name'\nconst shown = '@/lib/utils'\n// import '@/lib/utils'\nexport const sample = shown\n`,
  }
}
