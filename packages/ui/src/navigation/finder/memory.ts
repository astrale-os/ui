import type {
  FinderClass,
  FinderDomain,
  FinderNode,
  FinderOrder,
  FinderRule,
  FinderSource,
  FinderValueKind,
} from './source.js'

/** A Class of an in-memory graph: abstract ones are only described, never listed. */
export interface FinderMemoryClass extends FinderClass {
  readonly abstract?: boolean
  /** The keys of the Classes it extends. */
  readonly extends?: readonly string[]
}

export interface FinderMemoryGraph {
  readonly domains: readonly FinderDomain[]
  /** Each Domain's Classes, by Domain id. */
  readonly classes: Readonly<Record<string, readonly FinderMemoryClass[]>>
  readonly nodes: readonly FinderNode[]
  /** Milliseconds each read waits, to show loading states. Default 0. */
  readonly latency?: number
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(signal.reason)
  if (milliseconds <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}

/** Orders two values as the Kernel does: numbers by value, instants in time, text by code point. */
function compare(left: unknown, right: unknown, kind?: FinderValueKind): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (kind === 'instant') {
    // An ISO 8601 date-time may carry any offset: `13:00+02:00` is before `12:00Z`.
    const a = Date.parse(String(left))
    const b = Date.parse(String(right))
    if (!Number.isNaN(a) && !Number.isNaN(b)) return a - b
  }
  const a = String(left)
  const b = String(right)
  return a < b ? -1 : a > b ? 1 : 0
}

function present(value: unknown): boolean {
  return value !== undefined && value !== null
}

// Preview data stays in memory. The graph source delegates normalization and ranking to the Kernel.
function nameSearch(nodes: readonly FinderNode[], text: string): FinderNode[] {
  const fold = (value: string) =>
    value.toLowerCase().replaceAll('ß', 'ss').normalize('NFKD').replace(/\p{M}/gu, '')
  const words = (value: string) => value.match(/[\p{L}\p{Nd}]+/gu) ?? []
  const phrase = fold(text)
  const query = words(phrase)
  if (query.length === 0) return []
  const anchor = [...query].sort((a, b) => [...b].length - [...a].length || compare(a, b))[0]!
  const ranked = nodes.flatMap((node) => {
    const value = fold(node.name ?? '')
    const tokens = words(value)
    if (!query.every((q) => tokens.some((w) => w.startsWith(q)))) return []
    const first = tokens.filter((w) => w.startsWith(anchor)).sort()[0]!
    return [
      {
        node,
        rank: value.startsWith(phrase) ? '1' + [...value].slice(0, 256).join('') : '2' + first,
      },
    ]
  })
  ranked.sort((a, b) => compare(a.rank, b.rank) || compare(a.node.id, b.node.id))
  return ranked.map((entry) => entry.node)
}

/**
 * A `FinderSource` over a graph held in memory, with the Kernel's semantics: a Class stands for
 * itself and every Class that extends it, rules all match, absent values sort last.
 */
export function createMemoryFinderSource(graph: FinderMemoryGraph): FinderSource {
  const latency = graph.latency ?? 0
  const all = Object.values(graph.classes).flat()
  const byKey = new Map(all.map((item) => [item.key, item]))
  const nameKeys = new Set(all.flatMap((item) => (item.nameProperty ? [item.nameProperty] : [])))
  // A property two Classes share has the same key, so one kind per key.
  const kinds = new Map(
    all.flatMap((item) =>
      item.properties.map((property) => [property.key, property.kind] as const),
    ),
  )

  const ancestry = (key: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(key)) return seen
    seen.add(key)
    for (const parent of byKey.get(key)?.extends ?? []) ancestry(parent, seen)
    return seen
  }
  const satisfies = (key: string, classes: readonly string[]) => {
    const lineage = ancestry(key)
    return classes.some((item) => lineage.has(item))
  }
  const valueOf = (node: FinderNode, property: string): unknown =>
    property in node.values ? node.values[property] : nameKeys.has(property) ? node.name : undefined
  const matches = (node: FinderNode, rule: FinderRule): boolean => {
    const value = valueOf(node, rule.property)
    switch (rule.operator) {
      case 'isSet':
        return present(value)
      case 'is':
        return value === rule.value
      case 'isOneOf':
        return present(value) && rule.values.includes(String(value))
      case 'startsWith':
        return typeof value === 'string' && value.startsWith(rule.value)
      case 'between':
        return (
          present(value) &&
          (rule.from === undefined || compare(value, rule.from, kinds.get(rule.property)) >= 0) &&
          (rule.to === undefined || compare(value, rule.to, kinds.get(rule.property)) <= 0)
        )
    }
  }
  const range = (classes: readonly string[], rules: readonly FinderRule[]) =>
    graph.nodes.filter(
      (node) => satisfies(node.class, classes) && rules.every((rule) => matches(node, rule)),
    )
  const ordered = (nodes: readonly FinderNode[], order: readonly FinderOrder[]) =>
    [...nodes].sort((left, right) => {
      for (const key of order) {
        const a = valueOf(left, key.property)
        const b = valueOf(right, key.property)
        if (!present(a) || !present(b)) {
          if (present(a) !== present(b)) return present(a) ? -1 : 1
          continue
        }
        const difference = compare(a, b, kinds.get(key.property))
        if (difference !== 0) return key.direction === 'asc' ? difference : -difference
      }
      return compare(left.id, right.id)
    })

  return {
    async domains({ accepts, signal }) {
      await wait(latency, signal)
      if (!accepts) return graph.domains
      return graph.domains.filter((domain) =>
        (graph.classes[domain.id] ?? []).some(
          (item) => !item.abstract && satisfies(item.key, accepts),
        ),
      )
    },
    async classes({ domain, accepts, signal }) {
      await wait(latency, signal)
      return (graph.classes[domain] ?? []).filter(
        (item) => !item.abstract && (!accepts || satisfies(item.key, accepts)),
      )
    },
    async describe({ classes, signal }) {
      await wait(latency, signal)
      return classes.flatMap((key) => {
        const found = byKey.get(key)
        return found ? [found] : []
      })
    },
    async nodes({ classes, rules, order, text, after, size, signal }) {
      await wait(latency, signal)
      const start = after === undefined ? 0 : Number(after)
      const candidates = range(classes, rules)
      const list = text ? nameSearch(candidates, text) : ordered(candidates, order)
      const page = list.slice(start, start + size)
      const end = start + page.length
      return { nodes: page, ...(end < list.length ? { next: String(end) } : {}) }
    },
    async count({ classes, rules, upTo, signal }) {
      await wait(latency, signal)
      const total = range(classes, rules).length
      return { value: Math.min(total, upTo), more: total > upTo }
    },
    async node({ id, signal }) {
      await wait(latency, signal)
      const node = graph.nodes.find((item) => item.id === id)
      if (!node) throw new Error(`No Node ${id}.`)
      const nodeClass = byKey.get(node.class)
      return {
        id: node.id,
        class: node.class,
        ...(node.name === undefined ? {} : { name: node.name }),
        properties: (nodeClass?.properties ?? []).map((property) => ({
          ...property,
          value: valueOf(node, property.key),
        })),
      }
    },
  }
}
