import * as React from 'react'

import { draftFor, ruleOf, type FinderRuleDraft } from './rules.js'
import {
  FINDER_ACCEPTED,
  type FinderChoice,
  type FinderClass,
  type FinderCount,
  type FinderDomain,
  type FinderNode,
  type FinderNodeDetail,
  type FinderOrder,
  type FinderPlace,
  type FinderProperty,
  type FinderRule,
  type FinderSource,
} from './source.js'

export type FinderRegion = 'domains' | 'classes' | 'nodes' | 'filters'

export interface FinderOptions {
  /**
   * The graph the Finder reads. Keep one object per graph (memoize it): another object is another
   * graph, read again from nothing. Another source, `accepts` or `maximum` drops the chosen Nodes.
   */
  readonly source: FinderSource
  /** Class keys the request accepts; each admits every Class that extends it. */
  readonly accepts?: readonly string[]
  /** How many Nodes the user may choose. Default 1. */
  readonly maximum?: number
  /** Where to open: usually the place `onPlaceChange` last reported. */
  readonly defaultPlace?: FinderPlace
  readonly onPlaceChange?: (place: FinderPlace) => void
  /**
   * Take the chosen Nodes. A promise holds the Finder `confirming` until it settles; a rejection
   * is kept as the confirmation's `error`, with the choices, so the user can change them and
   * confirm again.
   */
  readonly onConfirm: (choices: readonly FinderChoice[]) => void | Promise<void>
  readonly onCancel: () => void
  /** Picks each icon's `dark` image. Absent: the user's color-scheme preference decides. */
  readonly theme?: 'light' | 'dark'
  /** Nodes per page. Default 64. */
  readonly pageSize?: number
  /** The bound of the count. Default 1000. */
  readonly countBound?: number
  /** Milliseconds a rule edit waits before it reads. Default 250. */
  readonly ruleDelay?: number
}

export type FinderReadStatus = 'loading' | 'ready' | 'error'

export interface FinderList<Item> {
  readonly status: FinderReadStatus
  readonly items: readonly Item[]
  readonly error?: unknown
  readonly retry: () => void
}

export type FinderDomainEntry =
  | { readonly kind: 'accepted'; readonly key: string; readonly classes: readonly FinderClass[] }
  | { readonly kind: 'domain'; readonly key: string; readonly domain: FinderDomain }

export interface FinderTableColumn {
  /** `@name`, `@class`, or a property key. */
  readonly key: string
  readonly kind: 'name' | 'class' | 'property'
  readonly label: string
  readonly property?: FinderProperty
  readonly sortable: boolean
  readonly hideable: boolean
}

export interface FinderRow {
  readonly node: FinderNode
  readonly index: number
  readonly elementId: string
  readonly nodeClass?: FinderClass
  readonly chosen: boolean
  readonly active: boolean
  readonly unnamed: boolean
  readonly disabled: boolean
}

export interface FinderTable {
  /** `idle` until at least one Class is selected. */
  readonly status: 'idle' | FinderReadStatus
  readonly rows: readonly FinderRow[]
  /** The rows belong to the previous filters or order and the next ones are on their way. */
  readonly stale: boolean
  readonly loadingMore: boolean
  readonly complete: boolean
  readonly error?: unknown
  readonly moreError?: unknown
  readonly retry: () => void
  readonly loadMore: () => void
  readonly columns: readonly FinderTableColumn[]
  readonly hideableColumns: readonly (FinderTableColumn & { readonly shown: boolean })[]
  readonly order?: FinderOrder
}

export interface FinderPreviewState {
  readonly id: string
  readonly status: FinderReadStatus
  readonly detail?: FinderNodeDetail
  readonly error?: unknown
  readonly retry: () => void
}

export interface FinderCountState {
  readonly status: 'idle' | FinderReadStatus
  readonly value?: FinderCount
}

/** Where the last confirm stands: idle, waiting on the host, or refused by it. */
export type FinderConfirmation =
  | { readonly status: 'idle' }
  | { readonly status: 'confirming' }
  | { readonly status: 'error'; readonly error: unknown }

export interface FinderController {
  readonly source: FinderSource
  readonly accepts?: readonly string[]
  readonly maximum: number
  readonly theme?: 'light' | 'dark'
  readonly domains: FinderList<FinderDomainEntry>
  /** The open Domain id, or `FINDER_ACCEPTED`. */
  readonly domain?: string
  readonly classes: FinderList<FinderClass> & { readonly idle: boolean }
  readonly selectedClasses: readonly string[]
  /** The accepted Classes, described; empty without `accepts`. */
  readonly acceptedClasses: readonly FinderClass[]
  /** Filterable properties every selected Class shares, the name first. */
  readonly sharedProperties: readonly FinderProperty[]
  readonly table: FinderTable
  readonly count: FinderCountState
  readonly rules: readonly FinderRuleDraft[]
  readonly appliedRules: readonly FinderRule[]
  /** Whether the filter bar shows: opened, and holding a rule. Collapsed, its rules still apply. */
  readonly filtersOpen: boolean
  readonly chosen: readonly FinderChoice[]
  readonly maximumReached: boolean
  readonly confirmation: FinderConfirmation
  readonly preview?: FinderPreviewState
  readonly active: Readonly<Partial<Record<'domains' | 'classes' | 'nodes', string>>>
  classOf(key: string): FinderClass | undefined
  elementId(region: 'domains' | 'classes', index: number): string
  openDomain(key: string, options?: { readonly focus?: boolean }): void
  selectClass(key: string, options?: { readonly toggle?: boolean; readonly focus?: boolean }): void
  setActive(region: 'domains' | 'classes' | 'nodes', key: string): void
  focusRegion(region: FinderRegion): void
  registerRegion(region: FinderRegion): (element: HTMLElement | null) => void
  toggleChoice(node: FinderNode, options?: { readonly confirmSingle?: boolean }): void
  remove(id: string): void
  confirm(): void
  cancel(): void
  sortBy(columnKey: string): void
  setColumnShown(columnKey: string, shown: boolean): void
  addRule(property?: string): void
  updateRule(id: string, patch: Partial<Omit<FinderRuleDraft, 'id'>>): void
  removeRule(id: string): void
  clearRules(): void
  openFilters(): void
  closeFilters(): void
  openPreview(id: string): void
  closePreview(): void
  onRegionKeyDown(region: 'domains' | 'classes' | 'nodes', event: React.KeyboardEvent): void
  onRootKeyDown(event: React.KeyboardEvent): void
}

const NAME_COLUMN = '@name'
const CLASS_COLUMN = '@class'
const SORTABLE = new Set(['text', 'number', 'instant'])
const DEFAULT_SHOWN_PROPERTIES = 3
const TYPEAHEAD_MILLISECONDS = 700
const LOAD_AHEAD_ROWS = 8
const IDLE: FinderConfirmation = Object.freeze({ status: 'idle' })
const NO_CLASSES: ReadonlyMap<string, FinderClass> = new Map()
const NO_CHOICES: readonly FinderChoice[] = Object.freeze([])
const CONFIRMING: FinderConfirmation = Object.freeze({ status: 'confirming' })

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { readonly then?: unknown }).then === 'function'
  )
}

const sourceScopes = new WeakMap<FinderSource, number>()
let sourceSequence = 0

/** One number per source object: what a source answered never stands for another's answer. */
function scopeOf(source: FinderSource): number {
  let scope = sourceScopes.get(source)
  if (scope === undefined) {
    sourceSequence += 1
    scope = sourceSequence
    sourceScopes.set(source, scope)
  }
  return scope
}

/**
 * State that names Nodes of one request: another request reads it as `initial`, and a change made
 * under the new request starts from `initial`. `initial` must keep its identity across renders.
 */
function useRequestState<Value>(
  request: string,
  initial: Value,
): readonly [Value, (change: Value | ((current: Value) => Value)) => void] {
  const [held, setHeld] = React.useState({ request, value: initial })
  const value = held.request === request ? held.value : initial
  // Like a state setter, the change keeps its identity: it applies to the request rendered last.
  const latest = React.useRef(request)
  latest.current = request
  const change = React.useCallback(
    (update: Value | ((current: Value) => Value)) =>
      setHeld((previous) => {
        const now = latest.current
        const current = previous.request === now ? previous.value : initial
        const next =
          typeof update === 'function' ? (update as (current: Value) => Value)(current) : update
        return next === current && previous.request === now
          ? previous
          : { request: now, value: next }
      }),
    [initial],
  )
  return [value, change] as const
}

interface Read<Value> {
  readonly scope?: number
  readonly key?: string
  readonly status: FinderReadStatus
  readonly value?: Value
  readonly error?: unknown
}

const LOADING: Read<never> = Object.freeze({ status: 'loading' })

/**
 * One read per source and key: a new key aborts the previous read and keeps its value until it
 * lands; a new source reads again from nothing.
 */
function useRead<Value>(
  scope: number,
  key: string | undefined,
  run: (signal: AbortSignal) => Promise<Value>,
): Read<Value> & { readonly retry: () => void } {
  const [state, setState] = React.useState<Read<Value>>(LOADING)
  const [attempt, setAttempt] = React.useState(0)
  const runRef = React.useRef(run)
  runRef.current = run

  React.useEffect(() => {
    if (key === undefined) {
      setState(LOADING)
      return
    }
    const controller = new AbortController()
    setState((previous) => ({
      scope,
      key,
      status: 'loading',
      ...(previous.scope === scope && previous.value !== undefined
        ? { value: previous.value }
        : {}),
    }))
    runRef.current(controller.signal).then(
      (value) => {
        if (!controller.signal.aborted) setState({ scope, key, status: 'ready', value })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ scope, key, status: 'error', error })
      },
    )
    return () => controller.abort()
  }, [scope, key, attempt])

  const retry = React.useCallback(() => setAttempt((value) => value + 1), [])
  return { ...(state.scope === scope ? state : LOADING), retry }
}

function sameList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function shared(classes: readonly FinderClass[]): FinderProperty[] {
  const [first, ...rest] = classes
  if (!first) return []
  const keys = rest.map((item) => new Set(item.properties.map((property) => property.key)))
  const common = first.properties.filter((property) => keys.every((set) => set.has(property.key)))
  const name = first.nameProperty
  const sharedName =
    name !== undefined && rest.every((item) => item.nameProperty === name) ? name : undefined
  if (sharedName === undefined) return common
  const nameProperty = common.find((property) => property.key === sharedName)
  return nameProperty
    ? [nameProperty, ...common.filter((property) => property !== nameProperty)]
    : common
}

interface NodesState {
  readonly scope?: number
  readonly key?: string
  readonly status: 'idle' | FinderReadStatus
  readonly items: readonly FinderNode[]
  readonly next?: string
  readonly error?: unknown
  readonly loadingMore: boolean
  readonly moreError?: unknown
}

const NO_NODES: NodesState = Object.freeze({ status: 'idle', items: [], loadingMore: false })
const LOADING_NODES: NodesState = Object.freeze({
  status: 'loading',
  items: [],
  loadingMore: false,
})

let ruleSequence = 0

export function useFinderController(options: FinderOptions): FinderController {
  const {
    source,
    maximum: requestedMaximum = 1,
    defaultPlace,
    onPlaceChange,
    onConfirm,
    onCancel,
    theme,
    pageSize = 64,
    countBound = 1000,
    ruleDelay = 250,
  } = options
  const maximum = Math.max(1, Math.floor(requestedMaximum))
  const acceptsKey = options.accepts?.length ? options.accepts.join('\n') : undefined
  const accepts = React.useMemo(
    () => (acceptsKey === undefined ? undefined : acceptsKey.split('\n')),
    [acceptsKey],
  )
  const base = React.useId()

  // ── Place ────────────────────────────────────────────────────────────────────────────────────
  const [domain, setDomain] = React.useState<string | undefined>(() => {
    if (defaultPlace?.domain === FINDER_ACCEPTED) return accepts ? FINDER_ACCEPTED : undefined
    return defaultPlace?.domain ?? (accepts ? FINDER_ACCEPTED : undefined)
  })
  const [selectedClasses, setSelectedClasses] = React.useState<readonly string[]>(() => {
    if (
      defaultPlace?.domain !== undefined &&
      defaultPlace.domain === domain &&
      defaultPlace.classes
    ) {
      return defaultPlace.classes
    }
    return domain === FINDER_ACCEPTED && accepts ? accepts : []
  })
  /** The selection to restore once its Domain's Classes arrive, then dropped. */
  const restoring = React.useRef(domain !== undefined && domain !== FINDER_ACCEPTED)

  // ── Class index ──────────────────────────────────────────────────────────────────────────────
  // Every Class the source described, kept for its source only.
  const scope = scopeOf(source)
  const [described, setDescribed] = React.useState<{
    readonly scope: number
    readonly classes: ReadonlyMap<string, FinderClass>
  }>(() => ({ scope, classes: new Map() }))
  const classIndex = described.scope === scope ? described.classes : NO_CLASSES
  const remember = React.useCallback(
    (classes: readonly FinderClass[]) => {
      if (classes.length === 0) return
      setDescribed((previous) => {
        const known = previous.scope === scope ? previous.classes : NO_CLASSES
        if (known === previous.classes && classes.every((item) => known.get(item.key) === item)) {
          return previous
        }
        const next = new Map(known)
        for (const item of classes) next.set(item.key, item)
        return { scope, classes: next }
      })
    },
    [scope],
  )
  const classOf = React.useCallback((key: string) => classIndex.get(key), [classIndex])

  // ── Reads ────────────────────────────────────────────────────────────────────────────────────
  const domainsRead = useRead(scope, `domains\n${acceptsKey ?? ''}`, (signal) =>
    source.domains({ ...(accepts ? { accepts } : {}), signal }),
  )
  const acceptedRead = useRead(scope, acceptsKey, async (signal) => {
    const classes = await source.describe({ classes: accepts ?? [], signal })
    // Keep the request's order, whatever order the source answers in.
    return (accepts ?? []).flatMap((key) => classes.filter((item) => item.key === key))
  })
  const classDomain = domain !== undefined && domain !== FINDER_ACCEPTED ? domain : undefined
  const classesRead = useRead(
    scope,
    classDomain === undefined ? undefined : `${classDomain}\n${acceptsKey ?? ''}`,
    (signal) =>
      source.classes({ domain: classDomain ?? '', ...(accepts ? { accepts } : {}), signal }),
  )

  const acceptedClasses = React.useMemo(
    () => (acceptedRead.status === 'ready' && acceptedRead.value ? acceptedRead.value : []),
    [acceptedRead.status, acceptedRead.value],
  )
  React.useEffect(() => remember(acceptedClasses), [acceptedClasses, remember])
  // The accepted row selects only the accepted Classes the user can read; once they arrive, it
  // keeps the selection still accepted, or all of them (another request accepts other Classes).
  React.useEffect(() => {
    if (domain !== FINDER_ACCEPTED || acceptedRead.status !== 'ready') return
    const readable = acceptedClasses.map((item) => item.key)
    setSelectedClasses((previous) => {
      const kept = previous.filter((key) => readable.includes(key))
      const next = kept.length === 0 ? readable : kept
      return sameList(next, previous) ? previous : next
    })
  }, [domain, acceptedRead.status, acceptedClasses])
  const domainClasses = React.useMemo(
    () =>
      classDomain !== undefined &&
      classesRead.key?.startsWith(`${classDomain}\n`) &&
      classesRead.value
        ? classesRead.value
        : [],
    [classDomain, classesRead.key, classesRead.value],
  )
  React.useEffect(() => remember(domainClasses), [domainClasses, remember])

  // A remembered Domain the user can no longer open falls back to the start.
  const domainList = domainsRead.status === 'ready' ? (domainsRead.value ?? []) : undefined
  React.useEffect(() => {
    if (!domainList || domain === undefined || domain === FINDER_ACCEPTED) return
    if (domainList.some((item) => item.id === domain)) return
    restoring.current = false
    setDomain(accepts ? FINDER_ACCEPTED : undefined)
    setSelectedClasses(accepts ?? [])
  }, [domainList, domain, accepts])

  // Once a Domain's Classes arrive, keep the selection that still exists, or the only Class.
  React.useEffect(() => {
    if (classesRead.status !== 'ready' || classDomain === undefined) return
    if (!classesRead.key?.startsWith(`${classDomain}\n`)) return
    const keys = new Set(domainClasses.map((item) => item.key))
    setSelectedClasses((previous) => {
      const kept = previous.filter((key) => keys.has(key))
      if (kept.length === 0 && domainClasses.length === 1) return [domainClasses[0]!.key]
      return sameList(kept, previous) ? previous : kept
    })
    restoring.current = false
  }, [classesRead.status, classesRead.key, classDomain, domainClasses])

  const placeChange = React.useRef(onPlaceChange)
  placeChange.current = onPlaceChange
  const placeOf = (open: string | undefined, classes: readonly string[]): FinderPlace => ({
    ...(open === undefined ? {} : { domain: open }),
    ...(classes.length === 0 ? {} : { classes }),
  })
  const lastPlace = React.useRef(JSON.stringify(placeOf(domain, selectedClasses)))
  React.useEffect(() => {
    if (restoring.current) return
    const place = placeOf(domain, selectedClasses)
    const serial = JSON.stringify(place)
    if (serial === lastPlace.current) return
    lastPlace.current = serial
    placeChange.current?.(place)
  }, [domain, selectedClasses])

  // ── Properties, columns, rules, order ────────────────────────────────────────────────────────
  const describedSelection = React.useMemo(
    () => selectedClasses.map((key) => classIndex.get(key)).filter((item) => item !== undefined),
    [selectedClasses, classIndex],
  )
  const sharedProperties = React.useMemo(
    () => (describedSelection.length === selectedClasses.length ? shared(describedSelection) : []),
    [describedSelection, selectedClasses.length],
  )
  const nameProperty = React.useMemo(() => {
    const first = describedSelection[0]?.nameProperty
    return first !== undefined && sharedProperties[0]?.key === first
      ? sharedProperties[0]
      : undefined
  }, [describedSelection, sharedProperties])

  const [columnChoice, setColumnChoice] = React.useState<Readonly<Record<string, boolean>>>({})
  const [orderChoice, setOrderChoice] = React.useState<FinderOrder | undefined>(undefined)
  const [rules, setRules] = React.useState<readonly FinderRuleDraft[]>([])
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  // With no rule left there is nothing to show: the bar hides with its last rule.
  const filtersShown = filtersOpen && rules.length > 0

  const propertyByKey = React.useMemo(
    () => new Map(sharedProperties.map((property) => [property.key, property])),
    [sharedProperties],
  )

  // Rules on a property the selection no longer shares go away with it.
  React.useEffect(() => {
    if (describedSelection.length !== selectedClasses.length) return
    setRules((previous) => {
      const kept = previous.filter((rule) => propertyByKey.has(rule.property))
      return kept.length === previous.length ? previous : kept
    })
  }, [propertyByKey, describedSelection.length, selectedClasses.length])

  const columns = React.useMemo(() => {
    const several = domain === FINDER_ACCEPTED || selectedClasses.length > 1
    const nameColumn: FinderTableColumn = {
      key: NAME_COLUMN,
      kind: 'name',
      label: nameProperty?.label ?? 'Name',
      ...(nameProperty ? { property: nameProperty } : {}),
      sortable: nameProperty !== undefined && SORTABLE.has(nameProperty.kind),
      hideable: false,
    }
    const classColumn: FinderTableColumn = {
      key: CLASS_COLUMN,
      kind: 'class',
      label: 'Class',
      sortable: false,
      hideable: false,
    }
    const propertyColumns = sharedProperties
      .filter((property) => property !== nameProperty)
      .map((property): FinderTableColumn => ({
        key: property.key,
        kind: 'property',
        label: property.label,
        property,
        sortable: SORTABLE.has(property.kind),
        hideable: true,
      }))
    const hideable = propertyColumns.map((column, index) => ({
      ...column,
      shown: columnChoice[column.key] ?? index < DEFAULT_SHOWN_PROPERTIES,
    }))
    const visible: FinderTableColumn[] = [
      nameColumn,
      ...(several ? [classColumn] : []),
      ...hideable.filter((column) => column.shown).map(({ shown: _shown, ...column }) => column),
    ]
    return { visible, hideable }
  }, [domain, selectedClasses.length, nameProperty, sharedProperties, columnChoice])

  const order = React.useMemo((): FinderOrder | undefined => {
    if (orderChoice) {
      const property = propertyByKey.get(orderChoice.property)
      if (property && SORTABLE.has(property.kind)) return orderChoice
    }
    return nameProperty && SORTABLE.has(nameProperty.kind)
      ? { property: nameProperty.key, direction: 'asc' }
      : undefined
  }, [orderChoice, propertyByKey, nameProperty])

  const [settledRules, setSettledRules] = React.useState<readonly FinderRuleDraft[]>([])
  React.useEffect(() => {
    if (ruleDelay <= 0) {
      setSettledRules(rules)
      return
    }
    const timer = setTimeout(() => setSettledRules(rules), ruleDelay)
    return () => clearTimeout(timer)
  }, [rules, ruleDelay])
  const appliedRules = React.useMemo(
    () =>
      settledRules.flatMap((draft) => {
        const property = propertyByKey.get(draft.property)
        const rule = property ? ruleOf(draft, property) : undefined
        return rule ? [rule] : []
      }),
    [settledRules, propertyByKey],
  )

  // ── Nodes and count ──────────────────────────────────────────────────────────────────────────
  const describedAll = describedSelection.length === selectedClasses.length
  // Nodes are listed only for Classes this request offers: the accepted row's once these accepted
  // Classes arrived, a Domain's once its Classes arrived under them. Until then no row is listed,
  // so none of another request's Nodes can be chosen.
  const offered =
    domain === FINDER_ACCEPTED
      ? acceptedRead.status === 'ready' && acceptedRead.key === acceptsKey
        ? acceptedClasses
        : undefined
      : classesRead.status === 'ready' &&
          classDomain !== undefined &&
          classesRead.key === `${classDomain}\n${acceptsKey ?? ''}`
        ? domainClasses
        : undefined
  const selectionOffered =
    offered !== undefined &&
    selectedClasses.every((key) => offered.some((item) => item.key === key))
  const rangeKey =
    selectedClasses.length === 0 || !describedAll || !selectionOffered
      ? undefined
      : JSON.stringify({ classes: selectedClasses, rules: appliedRules, order: order ?? null })
  const [nodesState, setNodes] = React.useState<NodesState>({
    status: 'idle',
    items: [],
    loadingMore: false,
  })
  // With no range, no Node is listed from this render on; another source's Nodes are not this
  // source's, even for the same range.
  const nodes: NodesState =
    rangeKey === undefined
      ? selectedClasses.length === 0
        ? NO_NODES
        : LOADING_NODES
      : nodesState.scope === undefined || nodesState.scope === scope
        ? nodesState
        : LOADING_NODES
  const [nodesAttempt, setNodesAttempt] = React.useState(0)
  const moreController = React.useRef<AbortController | undefined>(undefined)
  const range = React.useRef({ classes: selectedClasses, rules: appliedRules, order })
  range.current = { classes: selectedClasses, rules: appliedRules, order }

  React.useEffect(() => {
    moreController.current?.abort()
    if (rangeKey === undefined) {
      setNodes({
        status: selectedClasses.length === 0 ? 'idle' : 'loading',
        items: [],
        loadingMore: false,
      })
      return
    }
    const controller = new AbortController()
    const { classes, rules: activeRules, order: activeOrder } = range.current
    setNodes((previous) => ({
      scope,
      key: rangeKey,
      status: 'loading',
      items: previous.status === 'idle' || previous.scope !== scope ? [] : previous.items,
      loadingMore: false,
    }))
    source
      .nodes({
        classes,
        rules: activeRules,
        order: activeOrder ? [activeOrder] : [],
        size: pageSize,
        signal: controller.signal,
      })
      .then(
        (page) => {
          if (controller.signal.aborted) return
          setNodes({
            scope,
            key: rangeKey,
            status: 'ready',
            items: page.nodes,
            ...(page.next === undefined ? {} : { next: page.next }),
            loadingMore: false,
          })
        },
        (error: unknown) => {
          if (!controller.signal.aborted) {
            setNodes({
              scope,
              key: rangeKey,
              status: 'error',
              items: [],
              error,
              loadingMore: false,
            })
          }
        },
      )
    return () => controller.abort()
    // `range.current` is read for this key only.
  }, [rangeKey, nodesAttempt, source, scope, pageSize, selectedClasses.length])

  const nodesRef = React.useRef(nodes)
  nodesRef.current = nodes
  const loadMore = React.useCallback(() => {
    const current = nodesRef.current
    if (current.status !== 'ready' || current.next === undefined || current.loadingMore) return
    const controller = new AbortController()
    moreController.current = controller
    const key = current.key
    const after = current.next
    const { classes, rules: activeRules, order: activeOrder } = range.current
    nodesRef.current = { ...current, loadingMore: true }
    setNodes((latest) => {
      if (latest.key !== key) return latest
      const { moreError: _moreError, ...rest } = latest
      return { ...rest, loadingMore: true }
    })
    source
      .nodes({
        classes,
        rules: activeRules,
        order: activeOrder ? [activeOrder] : [],
        after,
        size: pageSize,
        signal: controller.signal,
      })
      .then(
        (page) => {
          if (controller.signal.aborted) return
          setNodes((latest) => {
            if (latest.key !== key) return latest
            const seen = new Set(latest.items.map((node) => node.id))
            const { next: _next, moreError: _error, ...rest } = latest
            return {
              ...rest,
              items: [...latest.items, ...page.nodes.filter((node) => !seen.has(node.id))],
              ...(page.next === undefined ? {} : { next: page.next }),
              loadingMore: false,
            }
          })
        },
        (error: unknown) => {
          if (controller.signal.aborted) return
          setNodes((latest) =>
            latest.key === key ? { ...latest, loadingMore: false, moreError: error } : latest,
          )
        },
      )
  }, [source, pageSize])

  const countRead = useRead(
    scope,
    rangeKey === undefined ? undefined : `${rangeKey}\n${nodesAttempt}`,
    (signal) =>
      source.count({
        classes: range.current.classes,
        rules: range.current.rules,
        upTo: countBound,
        signal,
      }),
  )

  // A listed Node of a Class no column described yet: describe it, once per source.
  const describing = React.useRef<{ readonly keys: Set<string>; readonly signal?: AbortSignal }>({
    keys: new Set(),
  })
  React.useEffect(() => {
    const controller = new AbortController()
    describing.current = { keys: new Set(), signal: controller.signal }
    return () => controller.abort()
  }, [source])
  React.useEffect(() => {
    const { keys, signal } = describing.current
    if (signal === undefined) return
    const missing = [
      ...new Set(nodes.items.map((node) => node.class).filter((key) => !classIndex.has(key))),
    ].filter((key) => !keys.has(key))
    if (missing.length === 0) return
    for (const key of missing) keys.add(key)
    source.describe({ classes: missing, signal }).then(
      (classes) => {
        if (!signal.aborted) remember(classes)
      },
      () => {
        for (const key of missing) keys.delete(key)
      },
    )
  }, [nodes.items, classIndex, source, remember])

  // ── Choice ───────────────────────────────────────────────────────────────────────────────────
  // Choices answer one request: its source, the Classes it accepts and its maximum. Another
  // request starts with none, so a confirm never returns a Node the current one would not offer.
  const request = `${scope}\n${maximum}\n${acceptsKey ?? ''}`
  const [chosen, setChosen] = useRequestState(request, NO_CHOICES)
  const maximumReached = chosen.length >= maximum
  const confirmRef = React.useRef(onConfirm)
  confirmRef.current = onConfirm
  const cancelRef = React.useRef(onCancel)
  cancelRef.current = onCancel

  const chosenRef = React.useRef(chosen)
  chosenRef.current = chosen
  const [answered, setConfirmation] = React.useState<FinderConfirmation>(IDLE)
  // A refusal answered choices, never none: with no choice (another request) it no longer stands.
  const confirmation = answered.status === 'error' && chosen.length === 0 ? IDLE : answered
  const confirming = React.useRef(false)
  const submitted = React.useRef(0)
  const submit = React.useCallback((choices: readonly FinderChoice[]) => {
    if (choices.length === 0 || confirming.current) return
    const result: unknown = confirmRef.current(choices)
    if (!isPromiseLike(result)) return
    const attempt = (submitted.current += 1)
    confirming.current = true
    setConfirmation(CONFIRMING)
    result.then(
      () => {
        if (submitted.current !== attempt) return
        confirming.current = false
        setConfirmation(IDLE)
      },
      (error: unknown) => {
        if (submitted.current !== attempt) return
        confirming.current = false
        setConfirmation({ status: 'error', error })
      },
    )
  }, [])
  React.useEffect(
    () => () => {
      // An answer that lands after the Finder closed changes nothing.
      submitted.current += 1
    },
    [],
  )
  const confirm = React.useCallback(() => submit(chosenRef.current), [submit])
  /** A refusal describes the choices it answered: a change to them clears it. */
  const changeChoices = React.useCallback(
    (change: (current: readonly FinderChoice[]) => readonly FinderChoice[]) => {
      if (confirming.current) return
      setConfirmation((current) => (current.status === 'error' ? IDLE : current))
      setChosen(change)
    },
    [setChosen],
  )
  const cancel = React.useCallback(() => cancelRef.current(), [])

  const toggleChoice = React.useCallback(
    (node: FinderNode, choiceOptions?: { readonly confirmSingle?: boolean }) => {
      if (node.name === undefined || confirming.current) return
      const choice: FinderChoice = { id: node.id, class: node.class, name: node.name }
      if (maximum === 1) {
        changeChoices(() => [choice])
        if (choiceOptions?.confirmSingle) queueMicrotask(() => submit([choice]))
        return
      }
      changeChoices((current) => {
        if (current.some((item) => item.id === node.id)) {
          return current.filter((item) => item.id !== node.id)
        }
        return current.length >= maximum ? current : [...current, choice]
      })
    },
    [maximum, changeChoices, submit],
  )
  const remove = React.useCallback(
    (id: string) => changeChoices((current) => current.filter((item) => item.id !== id)),
    [changeChoices],
  )

  // ── Focus and activity ───────────────────────────────────────────────────────────────────────
  const regions = React.useRef<Partial<Record<FinderRegion, HTMLElement>>>({})
  const registerRegion = React.useCallback(
    (region: FinderRegion) => (element: HTMLElement | null) => {
      if (element) regions.current[region] = element
      else delete regions.current[region]
    },
    [],
  )
  const focusRegion = React.useCallback((region: FinderRegion) => {
    const element = regions.current[region]
    if (!element) return
    if (region === 'filters') {
      const target = element.querySelector<HTMLElement>(
        'input, select, button, [tabindex]:not([tabindex="-1"])',
      )
      ;(target ?? element).focus()
      return
    }
    element.focus()
  }, [])

  const [active, setActiveState] = React.useState<
    Partial<Record<'domains' | 'classes' | 'nodes', string>>
  >({})
  const setActive = React.useCallback((region: 'domains' | 'classes' | 'nodes', key: string) => {
    setActiveState((current) => (current[region] === key ? current : { ...current, [region]: key }))
  }, [])

  const domainEntries = React.useMemo((): readonly FinderDomainEntry[] => {
    const list = domainsRead.value ?? []
    const entries: FinderDomainEntry[] = list.map((item) => ({
      kind: 'domain',
      key: item.id,
      domain: item,
    }))
    return accepts
      ? [{ kind: 'accepted', key: FINDER_ACCEPTED, classes: acceptedClasses }, ...entries]
      : entries
  }, [domainsRead.value, accepts, acceptedClasses])

  const classEntries = domain === FINDER_ACCEPTED ? acceptedClasses : domainClasses

  // ── Preview ──────────────────────────────────────────────────────────────────────────────────
  // The previewed Node is one the request listed: another request closes the preview.
  const [previewId, setPreviewId] = useRequestState<string | undefined>(request, undefined)
  const previewRead = useRead(scope, previewId, (signal) =>
    source.node({ id: previewId ?? '', signal }),
  )

  // ── Navigation ───────────────────────────────────────────────────────────────────────────────
  const openDomain = React.useCallback(
    (key: string, navigation?: { readonly focus?: boolean }) => {
      restoring.current = false
      setActive('domains', key)
      if (key !== domain) {
        setDomain(key)
        setSelectedClasses(key === FINDER_ACCEPTED ? (accepts ?? []) : [])
        setActiveState({ domains: key })
        setPreviewId(undefined)
      }
      if (navigation?.focus) focusRegion('classes')
    },
    [domain, accepts, setActive, focusRegion],
  )

  const selectClass = React.useCallback(
    (key: string, selection?: { readonly toggle?: boolean; readonly focus?: boolean }) => {
      restoring.current = false
      setActive('classes', key)
      setSelectedClasses((current) => {
        if (!selection?.toggle) return current.length === 1 && current[0] === key ? current : [key]
        if (current.includes(key))
          return current.length === 1 ? current : current.filter((item) => item !== key)
        const order = classEntries.map((item) => item.key)
        return [...current, key].sort((left, right) => order.indexOf(left) - order.indexOf(right))
      })
      if (selection?.focus) focusRegion('nodes')
    },
    [setActive, focusRegion, classEntries],
  )

  const sortBy = React.useCallback(
    (columnKey: string) => {
      const column = columns.visible.find((item) => item.key === columnKey)
      if (!column?.sortable || !column.property) return
      const property = column.property.key
      setOrderChoice(
        order?.property === property
          ? { property, direction: order.direction === 'asc' ? 'desc' : 'asc' }
          : { property, direction: 'asc' },
      )
    },
    [columns.visible, order],
  )

  const setColumnShown = React.useCallback((columnKey: string, shown: boolean) => {
    setColumnChoice((current) => ({ ...current, [columnKey]: shown }))
  }, [])

  const addRule = React.useCallback(
    (propertyKey?: string) => {
      const property =
        (propertyKey === undefined ? undefined : propertyByKey.get(propertyKey)) ??
        sharedProperties[0]
      if (!property) return
      ruleSequence += 1
      setRules((current) => [...current, draftFor(`rule-${ruleSequence}`, property)])
      setFiltersOpen(true)
    },
    [propertyByKey, sharedProperties],
  )
  const updateRule = React.useCallback(
    (id: string, patch: Partial<Omit<FinderRuleDraft, 'id'>>) => {
      setRules((current) =>
        current.map((rule) => {
          if (rule.id !== id) return rule
          if (patch.property !== undefined && patch.property !== rule.property) {
            const property = propertyByKey.get(patch.property)
            return property ? draftFor(rule.id, property) : rule
          }
          const next = { ...rule, ...patch }
          if (patch.operator !== undefined && patch.operator !== rule.operator) {
            const { preset: _preset, ...reset } = next
            return { ...reset, text: '', values: [], from: '', to: '' }
          }
          return next
        }),
      )
    },
    [propertyByKey],
  )
  const removeRule = React.useCallback(
    (id: string) => {
      setRules((current) => current.filter((rule) => rule.id !== id))
      if (rules.every((rule) => rule.id === id)) {
        // The bar hides with its last rule: the keyboard goes back to the Nodes.
        setFiltersOpen(false)
        focusRegion('nodes')
      }
    },
    [rules, focusRegion],
  )
  const clearRules = React.useCallback(() => {
    setRules([])
    setSettledRules([])
  }, [])

  // ── Rows ─────────────────────────────────────────────────────────────────────────────────────
  const chosenIds = React.useMemo(() => new Set(chosen.map((item) => item.id)), [chosen])
  const rows = React.useMemo(
    () =>
      nodes.items.map((node, index): FinderRow => {
        const unnamed = node.name === undefined
        const isChosen = chosenIds.has(node.id)
        const nodeClass = classIndex.get(node.class)
        return {
          node,
          index,
          elementId: `${base}-nodes-${index}`,
          ...(nodeClass ? { nodeClass } : {}),
          chosen: isChosen,
          active: active.nodes === node.id,
          unnamed,
          disabled: unnamed || (maximum > 1 && maximumReached && !isChosen),
        }
      }),
    [nodes.items, chosenIds, classIndex, base, active.nodes, maximum, maximumReached],
  )

  const elementId = React.useCallback(
    (region: 'domains' | 'classes', index: number) => `${base}-${region}-${index}`,
    [base],
  )

  // Keep the active row in view, and read ahead near the end.
  React.useEffect(() => {
    const index = rows.findIndex((row) => row.active)
    if (index < 0) return
    document.getElementById(rows[index]!.elementId)?.scrollIntoView?.({ block: 'nearest' })
    if (index >= rows.length - LOAD_AHEAD_ROWS) loadMore()
  }, [active.nodes, rows, loadMore])
  React.useEffect(() => {
    for (const region of ['domains', 'classes'] as const) {
      const key = active[region]
      if (key === undefined) continue
      const list = region === 'domains' ? domainEntries : classEntries
      const index = list.findIndex((item) => item.key === key)
      if (index >= 0)
        document.getElementById(elementId(region, index))?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [active, domainEntries, classEntries, elementId])

  // The preview follows the active row.
  React.useEffect(() => {
    if (previewId !== undefined && active.nodes !== undefined && active.nodes !== previewId) {
      setPreviewId(active.nodes)
    }
  }, [active.nodes, previewId])

  // ── Keyboard ─────────────────────────────────────────────────────────────────────────────────
  const typeahead = React.useRef({ text: '', at: 0 })

  const onRegionKeyDown = React.useCallback(
    (region: 'domains' | 'classes' | 'nodes', event: React.KeyboardEvent) => {
      if (event.target !== event.currentTarget) return
      const command = event.metaKey || event.ctrlKey
      const keys: readonly string[] =
        region === 'domains'
          ? domainEntries.map((item) => item.key)
          : region === 'classes'
            ? classEntries.map((item) => item.key)
            : rows.map((row) => row.node.id)
      const labels: readonly string[] =
        region === 'domains'
          ? domainEntries.map((item) => (item.kind === 'domain' ? item.domain.name : ''))
          : region === 'classes'
            ? classEntries.map((item) => item.name)
            : rows.map((row) => row.node.name ?? '')
      const fallback =
        region === 'domains' ? domain : region === 'classes' ? selectedClasses[0] : undefined
      const current = active[region] ?? fallback
      const index = current === undefined ? -1 : keys.indexOf(current)
      const move = (target: number) => {
        if (keys.length === 0) return
        const bounded = Math.max(0, Math.min(keys.length - 1, target))
        setActive(region, keys[bounded]!)
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          move(index < 0 ? 0 : index + 1)
          return
        case 'ArrowUp':
          event.preventDefault()
          move(index < 0 ? 0 : index - 1)
          return
        case 'Home':
          event.preventDefault()
          move(0)
          return
        case 'End':
          event.preventDefault()
          move(keys.length - 1)
          return
        case 'PageDown':
          event.preventDefault()
          move(index + 10)
          return
        case 'PageUp':
          event.preventDefault()
          move(index - 10)
          return
        case 'ArrowLeft':
          if (region === 'classes') {
            event.preventDefault()
            focusRegion('domains')
          } else if (region === 'nodes') {
            event.preventDefault()
            focusRegion('classes')
          }
          return
        case 'ArrowRight':
        case 'Enter': {
          if (command) return
          if (current === undefined || index < 0) return
          event.preventDefault()
          if (region === 'domains') openDomain(current, { focus: true })
          else if (region === 'classes') {
            if (!selectedClasses.includes(current)) selectClass(current)
            focusRegion('nodes')
          } else if (event.key === 'Enter') {
            const row = rows[index]
            if (row && !row.disabled) toggleChoice(row.node, { confirmSingle: true })
          }
          return
        }
        case ' ': {
          if (current === undefined || index < 0) return
          event.preventDefault()
          if (region === 'classes') selectClass(current, { toggle: true })
          else if (region === 'nodes')
            setPreviewId((open) => (open === current ? undefined : current))
          else openDomain(current)
          return
        }
        default: {
          if (command || event.altKey || event.key.length !== 1) return
          const now = Date.now()
          const text =
            now - typeahead.current.at < TYPEAHEAD_MILLISECONDS
              ? typeahead.current.text + event.key.toLowerCase()
              : event.key.toLowerCase()
          typeahead.current = { text, at: now }
          const found = labels.findIndex((label) => label.toLowerCase().startsWith(text))
          if (found >= 0) {
            event.preventDefault()
            move(found)
          }
        }
      }
    },
    [
      domainEntries,
      classEntries,
      rows,
      active,
      domain,
      selectedClasses,
      setActive,
      focusRegion,
      openDomain,
      selectClass,
      toggleChoice,
    ],
  )

  const onRootKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey
      if (command && event.key === 'Enter') {
        event.preventDefault()
        confirm()
        return
      }
      if (command && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        if (rules.length === 0) addRule()
        setFiltersOpen(true)
        queueMicrotask(() => focusRegion('filters'))
        return
      }
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      if (previewId !== undefined) {
        setPreviewId(undefined)
        return
      }
      if (filtersShown) {
        // The rules keep applying; the path bar shows them and reopens the bar.
        setFiltersOpen(false)
        focusRegion('nodes')
        return
      }
      cancel()
    },
    [confirm, cancel, rules.length, addRule, focusRegion, previewId, filtersShown],
  )

  // ── Result ───────────────────────────────────────────────────────────────────────────────────
  const domainsList: FinderList<FinderDomainEntry> = {
    status: domainsRead.status,
    items: domainEntries,
    ...(domainsRead.error === undefined ? {} : { error: domainsRead.error }),
    retry: domainsRead.retry,
  }
  const classesList: FinderList<FinderClass> & { readonly idle: boolean } =
    domain === FINDER_ACCEPTED
      ? {
          idle: false,
          status: acceptedRead.status,
          items: acceptedClasses,
          ...(acceptedRead.error === undefined ? {} : { error: acceptedRead.error }),
          retry: acceptedRead.retry,
        }
      : {
          idle: domain === undefined,
          status: classesRead.status,
          items: domainClasses,
          ...(classesRead.error === undefined ? {} : { error: classesRead.error }),
          retry: classesRead.retry,
        }

  const table: FinderTable = {
    status: nodes.status,
    rows,
    stale: nodes.status === 'loading' && nodes.items.length > 0,
    loadingMore: nodes.loadingMore,
    complete: nodes.status === 'ready' && nodes.next === undefined,
    ...(nodes.error === undefined ? {} : { error: nodes.error }),
    ...(nodes.moreError === undefined ? {} : { moreError: nodes.moreError }),
    retry: () => setNodesAttempt((value) => value + 1),
    loadMore,
    columns: columns.visible,
    hideableColumns: columns.hideable,
    ...(order ? { order } : {}),
  }

  const count: FinderCountState =
    rangeKey === undefined
      ? { status: 'idle' }
      : {
          status: countRead.status,
          ...(countRead.status === 'ready' && countRead.value ? { value: countRead.value } : {}),
        }

  const preview: FinderPreviewState | undefined =
    previewId === undefined
      ? undefined
      : {
          id: previewId,
          status: previewRead.key === previewId ? previewRead.status : 'loading',
          ...(previewRead.key === previewId && previewRead.value
            ? { detail: previewRead.value }
            : {}),
          ...(previewRead.key === previewId && previewRead.error !== undefined
            ? { error: previewRead.error }
            : {}),
          retry: previewRead.retry,
        }

  return {
    source,
    ...(accepts ? { accepts } : {}),
    maximum,
    ...(theme ? { theme } : {}),
    domains: domainsList,
    ...(domain === undefined ? {} : { domain }),
    classes: classesList,
    selectedClasses,
    acceptedClasses,
    sharedProperties,
    table,
    count,
    rules,
    appliedRules,
    filtersOpen: filtersShown,
    chosen,
    maximumReached,
    confirmation,
    ...(preview ? { preview } : {}),
    active,
    classOf,
    elementId,
    openDomain,
    selectClass,
    setActive,
    focusRegion,
    registerRegion,
    toggleChoice,
    remove,
    confirm,
    cancel,
    sortBy,
    setColumnShown,
    addRule,
    updateRule,
    removeRule,
    clearRules,
    openFilters: () => {
      if (rules.length === 0) addRule()
      setFiltersOpen(true)
    },
    closeFilters: () => {
      setFiltersOpen(false)
      clearRules()
    },
    openPreview: setPreviewId,
    closePreview: () => setPreviewId(undefined),
    onRegionKeyDown,
    onRootKeyDown,
  }
}
