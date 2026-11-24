import type {
  FinderClass,
  FinderDomain,
  FinderNode,
  FinderOrder,
  FinderRule,
  FinderSource,
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

function compare(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  const a = String(left)
  const b = String(right)
  return a < b ? -1 : a > b ? 1 : 0
}

function present(value: unknown): boolean {
  return value !== undefined && value !== null
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
          (rule.from === undefined || compare(value, rule.from) >= 0) &&
          (rule.to === undefined || compare(value, rule.to) <= 0)
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
        const difference = compare(a, b)
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
    async nodes({ classes, rules, order, after, size, signal }) {
      await wait(latency, signal)
      const start = after === undefined ? 0 : Number(after)
      const list = ordered(range(classes, rules), order)
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
