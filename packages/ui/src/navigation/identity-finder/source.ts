/**
 * What the identity finder reads, and the shape it reads it in. A host passes one
 * `IdentityFinderSource`; the finder never knows what stands behind it (a Kernel read as the user,
 * a Domain's own Query, a fixture).
 *
 * An Identity is anything that can act or be granted: a person's account, a group, a Role, a
 * service account. Each concrete Class of Identity is one *kind*; a request names the Classes it
 * accepts, and each admits every Class that extends it.
 *
 * Every read takes an `AbortSignal` the finder aborts when the answer is no longer wanted. A read
 * that throws puts its list in the error state with a Retry; the other lists keep working.
 */

import type { FinderImage } from '../finder/source.js'

/** An image the finder shows as `<img src>`, never inlined. `dark` replaces it in a dark theme. */
export type IdentityImage = FinderImage

/** One concrete Class of Identity: people, groups, Roles, service accounts. */
export interface IdentityKind {
  /** The Class key: stable, passed back in `IdentitySearch.kinds`. */
  readonly key: string
  /** The Class's name, singular: User, Group, Role. */
  readonly name: string
  readonly description?: string
  /** Absent: the finder shows one neutral glyph. */
  readonly icon?: IdentityImage
}

export interface Identity {
  readonly id: string
  /** The key of its concrete Class, one of the listed kinds. */
  readonly class: string
  /** Absent: the Identity is listed, marked unnamed, and cannot be chosen. */
  readonly name?: string
  /** A second line that tells two of the same name apart: an email, a description. */
  readonly detail?: string
  /** A picture; absent, the finder shows the name's initials. */
  readonly image?: IdentityImage
  /**
   * It has a picture only a further read gives (stored bytes the host downloads): the finder asks
   * `IdentityFinderSource.picture` for it once its row shows, and shows the initials meanwhile.
   */
  readonly picture?: boolean
  /**
   * Other Identities extend it and the user may read at least one: the finder can open it to list
   * them, as it opens a group or a Role.
   */
  readonly members?: boolean
}

/** Which Identities one read covers. */
export interface IdentitySearch {
  /** Concrete kind keys: only Identities of these Classes. */
  readonly kinds: readonly string[]
  /**
   * What the user typed, trimmed; empty lists every Identity in range. The source matches it as far
   * as its store can (a prefix of a name, of a family name, of an email) and says nothing of how.
   */
  readonly text: string
  /** Only the Identities that directly extend this one: the members of a group or a Role. */
  readonly within?: string
}

export interface IdentityPage {
  /** In display order: by name, unnamed last. */
  readonly identities: readonly Identity[]
  /** The cursor of the next page; absent on the last one. */
  readonly next?: string
}

export interface IdentityFinderSource {
  /**
   * The concrete kinds to list, in display order (people first). With `accepts`, only the Classes
   * that are or extend one of them; absent, every kind of Identity.
   */
  kinds(input: {
    readonly accepts?: readonly string[]
    readonly signal: AbortSignal
  }): Promise<readonly IdentityKind[]>
  /** One page of the Identities in range. */
  identities(
    input: IdentitySearch & {
      readonly after?: string
      readonly size: number
      readonly signal: AbortSignal
    },
  ): Promise<IdentityPage>
  /**
   * The picture of an Identity its page marked `picture`, or none when it cannot be read. The
   * finder asks once per Identity it shows, a few at a time; the address stays valid as long as the
   * source does (an object URL the source revokes when its host is done with it).
   */
  picture?(input: {
    readonly identity: Identity
    readonly signal: AbortSignal
  }): Promise<IdentityImage | undefined>
}

/** An Identity the user confirmed: all a host passes on to the asking View. */
export interface IdentityChoice {
  readonly id: string
  readonly class: string
  readonly name: string
}
