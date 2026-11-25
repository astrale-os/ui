/**
 * What the Finder reads, and the shape it reads it in. A host passes one `FinderSource`; the
 * Finder never knows what stands behind it (a Kernel, a fixture, another product's graph).
 *
 * Every read takes an `AbortSignal` the Finder aborts when the answer is no longer wanted. A read
 * that throws puts its column in the error state with a Retry; the other columns keep working.
 */

/** An image the Finder shows as `<img src>`, never inlined. `dark` replaces it in a dark theme. */
export interface FinderImage {
  readonly src: string
  readonly dark?: string
}

export interface FinderDomain {
  /** Stable identity, passed back to `classes`. */
  readonly id: string
  readonly name: string
  /** The Domain's origin, shown as secondary text when present. */
  readonly origin?: string
  /** Absent: the Finder shows the Domain's initials. */
  readonly icon?: FinderImage
}

/**
 * How the Finder offers a property's values. `instant` values are ISO 8601 date-time strings, in
 * the Nodes and in the rules. `choice` values are the strings of `FinderProperty.choices`.
 */
export type FinderValueKind = 'text' | 'number' | 'instant' | 'boolean' | 'choice'

export interface FinderProperty {
  /** Opaque to the Finder; it comes back in rules, orders and `FinderNode.values`. */
  readonly key: string
  readonly label: string
  readonly kind: FinderValueKind
  /** The closed set of values of a `choice` property. */
  readonly choices?: readonly string[]
}

export interface FinderClass {
  /** Stable identity, passed back to `nodes` and `count`. */
  readonly key: string
  readonly name: string
  readonly description?: string
  /** Absent: the Finder shows one neutral Class glyph. */
  readonly icon?: FinderImage
  /**
   * The properties a rule or a column may use, inherited ones included. A property two Classes
   * share has the same key in both.
   */
  readonly properties: readonly FinderProperty[]
  /** The key of the property that names its Nodes, when it has one. */
  readonly nameProperty?: string
}

/** One condition on a property. All rules of a read must match. */
export type FinderRule =
  | {
      readonly property: string
      readonly operator: 'is'
      readonly value: string | number | boolean
    }
  | { readonly property: string; readonly operator: 'isOneOf'; readonly values: readonly string[] }
  | { readonly property: string; readonly operator: 'startsWith'; readonly value: string }
  | {
      readonly property: string
      readonly operator: 'between'
      /** Inclusive bounds; at least one is present. */
      readonly from?: string | number
      readonly to?: string | number
    }
  | { readonly property: string; readonly operator: 'isSet' }

export type FinderOperator = FinderRule['operator']

/** Nodes without a value for `property` come last, in both directions. */
export interface FinderOrder {
  readonly property: string
  readonly direction: 'asc' | 'desc'
}

export interface FinderNode {
  readonly id: string
  /** The key of its concrete Class. */
  readonly class: string
  /** Absent: the Node is listed, marked unnamed, and cannot be chosen. */
  readonly name?: string
  /** Property values by `FinderProperty.key`; a missing key means no value. */
  readonly values: Readonly<Record<string, unknown>>
}

export interface FinderPage {
  readonly nodes: readonly FinderNode[]
  /** The cursor of the next page; absent on the last one. */
  readonly next?: string
  readonly stop?: 'budget' | 'preparing'
}

/** A bounded count: `more` means there are more than `value`. */
export interface FinderCount {
  readonly value: number
  readonly more: boolean
}

/** What the preview shows of one Node, read as the user. */
export interface FinderNodeDetail {
  readonly id: string
  readonly class: string
  readonly name?: string
  readonly properties: readonly (FinderProperty & { readonly value: unknown })[]
}

/** The Nodes a read covers: those of `classes` and of every Class that extends one of them. */
export interface FinderRange {
  readonly classes: readonly string[]
  readonly rules: readonly FinderRule[]
}

export interface FinderSource {
  /**
   * The Domains to browse, in display order. With `accepts`, only those that declare a Class that
   * is or extends one of them.
   */
  domains(input: {
    readonly accepts?: readonly string[]
    readonly signal: AbortSignal
  }): Promise<readonly FinderDomain[]>
  /**
   * The concrete Classes of one Domain, in display order. With `accepts`, only those that are or
   * extend one of them.
   */
  classes(input: {
    readonly domain: string
    readonly accepts?: readonly string[]
    readonly signal: AbortSignal
  }): Promise<readonly FinderClass[]>
  /**
   * The Classes with these keys, abstract ones included, in any order; a key the user cannot read
   * is left out. The Finder uses it for the accepted Classes and for the Class of a listed Node
   * it has not met in a column.
   */
  describe(input: {
    readonly classes: readonly string[]
    readonly signal: AbortSignal
  }): Promise<readonly FinderClass[]>
  /** One page of the Nodes in range, in `order`, then by id. */
  nodes(
    input: FinderRange & {
      /** Search the Names in this range in relevance order. */
      readonly text?: string
      readonly order: readonly FinderOrder[]
      readonly after?: string
      readonly size: number
      readonly signal: AbortSignal
    },
  ): Promise<FinderPage>
  /** How many Nodes are in range, up to `upTo`. */
  count(
    input: FinderRange & { readonly upTo: number; readonly signal: AbortSignal },
  ): Promise<FinderCount>
  /** The readable properties of one Node, for the preview. */
  node(input: { readonly id: string; readonly signal: AbortSignal }): Promise<FinderNodeDetail>
}

/** A Node the user confirmed: all a host passes on to the asking View. */
export interface FinderChoice {
  readonly id: string
  readonly class: string
  readonly name: string
}

/** Where the Finder stands, for a host to remember and reopen on. */
export interface FinderPlace {
  /** A Domain id, or `accepted` for the row that lists every accepted Node. */
  readonly domain?: string
  readonly classes?: readonly string[]
}

export const FINDER_ACCEPTED = 'accepted'
