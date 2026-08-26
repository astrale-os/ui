import assert from 'node:assert/strict'

export function adaptShadcnComponent(content, resolveOwner) {
  let adapted = content.replaceAll('"@/lib/utils"', "'#astrale-ui/class-name'")
  adapted = adapted.replaceAll('"@/hooks/use-mobile"', "'#astrale-ui/hook/use-mobile'")
  adapted = adapted.replace(/"@\/components\/ui\/([^"/]+)"/gu, (_match, name) => {
    const owner = resolveOwner(name)
    assert.ok(owner, `missing owner for internal import: ${name}`)
    return `'#astrale-ui/${owner}'`
  })
  if (!adapted.replace(/^import \* as React from "react"\n/u, '').includes('React.')) {
    adapted = adapted.replace(/^import \* as React from "react"\n/u, '')
  }
  return adapted
}

export function adaptShadcnRegistryComponent(content) {
  let adapted = content.replaceAll('"@/lib/utils"', "'@astrale-os/ui/class-name'")
  adapted = adapted.replaceAll('"@/hooks/use-mobile"', "'./use-mobile'")
  adapted = adapted.replace(/"@\/components\/ui\/([^"/]+)"/gu, (_match, name) => {
    return `'@astrale-os/ui/${name}'`
  })
  if (!adapted.replace(/^import \* as React from "react"\n/u, '').includes('React.')) {
    adapted = adapted.replace(/^import \* as React from "react"\n/u, '')
  }
  return adapted
}
