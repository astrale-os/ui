import type { Identity, IdentityFinderSource, IdentityKind } from './source.js'

/** A kind of an in-memory directory, with the keys of the Classes it extends. */
export interface IdentityMemoryKind extends IdentityKind {
  readonly extends?: readonly string[]
}

/** An Identity of an in-memory directory, with what it matches beyond its name. */
export interface IdentityMemoryEntry extends Omit<Identity, 'members'> {
  /** Further text a search matches by prefix: an email, a family name. */
  readonly keywords?: readonly string[]
}

export interface IdentityMemoryDirectory {
  /** In display order. */
  readonly kinds: readonly IdentityMemoryKind[]
  readonly identities: readonly IdentityMemoryEntry[]
  /** `[member, identity]`: the member extends the identity (a group, a Role). */
  readonly memberships?: readonly (readonly [string, string])[]
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

/** Every word of `value` the search may start at, lower-cased. */
function words(value: string): string[] {
  const lower = value.toLocaleLowerCase()
  return [lower, ...lower.split(/[\s@._-]+/u).filter((word) => word !== '')]
}

/**
 * An identity source over a fixed directory, for previews and tests. A search matches the start of
 * any word of a name or keyword, ignoring case; Identities list by name, unnamed last.
 */
export function createMemoryIdentitySource(
  directory: IdentityMemoryDirectory,
): IdentityFinderSource {
  const { latency = 0 } = directory
  const kinds = new Map(directory.kinds.map((kind) => [kind.key, kind]))
  const ancestry = (key: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(key)) return seen
    seen.add(key)
    for (const parent of kinds.get(key)?.extends ?? []) ancestry(parent, seen)
    return seen
  }
  const membersOf = new Map<string, Set<string>>()
  for (const [member, identity] of directory.memberships ?? []) {
    const members = membersOf.get(identity) ?? new Set<string>()
    members.add(member)
    membersOf.set(identity, members)
  }
  const byName = (a: Identity, b: Identity) => {
    if (a.name === undefined || b.name === undefined)
      return a.name === b.name ? 0 : a.name === undefined ? 1 : -1
    return a.name.localeCompare(b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  }

  return {
    async kinds({ accepts, signal }) {
      await wait(latency, signal)
      // Only the kinds some Identity has are concrete; the others are what they extend.
      const concrete = new Set(directory.identities.map((identity) => identity.class))
      return directory.kinds
        .filter((kind) => concrete.has(kind.key))
        .filter(
          (kind) =>
            accepts === undefined ||
            accepts.length === 0 ||
            accepts.some((key) => ancestry(kind.key).has(key)),
        )
        .map(({ extends: _extends, ...kind }) => kind)
    },
    async identities({ kinds: wanted, text, within, after, size, signal }) {
      await wait(latency, signal)
      const prefix = text.trim().toLocaleLowerCase()
      const members = within === undefined ? undefined : (membersOf.get(within) ?? new Set())
      const matching = directory.identities
        .filter((identity) => wanted.includes(identity.class))
        .filter((identity) => members === undefined || members.has(identity.id))
        .filter(
          (identity) =>
            prefix === '' ||
            [identity.name ?? '', ...(identity.keywords ?? [])]
              .flatMap(words)
              .some((word) => word.startsWith(prefix)),
        )
        .map(({ keywords: _keywords, ...identity }): Identity => ({
          ...identity,
          ...((membersOf.get(identity.id)?.size ?? 0) > 0 ? { members: true } : {}),
        }))
        .sort(byName)
      const start = after === undefined ? 0 : Number(after)
      const page = matching.slice(start, start + size)
      const next = start + size < matching.length ? String(start + size) : undefined
      return next === undefined ? { identities: page } : { identities: page, next }
    },
  }
}
