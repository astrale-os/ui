/**
 * The lowercase JSX elements of a source, each match naming its tag in group 1. A `<` right
 * after a name opens type arguments (`Promise<void>`), never an element.
 */
export function lowercaseElements(source) {
  return source.matchAll(/(?<![\w$])<([a-z][a-z0-9-]*)(?=[\s/>])/gu)
}
