'use client'

import * as React from 'react'

import type {
  Identity,
  IdentityChoice,
  IdentityFinderSource,
  IdentityImage,
  IdentityKind,
  IdentityPage,
} from './source.js'

export interface IdentityFinderOptions {
  /** What the finder reads: the host's Identities, read as the user. */
  source: IdentityFinderSource
  /** Class keys the request accepts; each admits every Class that extends it. Absent: any. */
  accepts?: readonly string[]
  /** How many Identities the user may choose. Default 1: choosing one confirms it. */
  maximum?: number
  /**
   * Identities listed but not choosable, each with the reason its row shows: Already a member.
   */
  unavailable?: ReadonlyMap<string, string>
  /** The user's own Identity, which the finder marks as such. */
  self?: string
  /**
   * Take the chosen Identities. While a returned promise runs, the finder waits; when it rejects,
   * the message of the `Error` shows and the choices stay.
   */
  onConfirm(choices: readonly IdentityChoice[]): void | Promise<void>
  /** Cancel, or Escape with nothing left to clear. */
  onCancel(): void
  /** Picks each image's dark variant; absent, the color-scheme preference decides. */
  theme?: 'light' | 'dark'
  /** Identities per page of one kind's list. Default 30. */
  pageSize?: number
  /** Identities each kind shows when every kind is listed together. Default 4. */
  sectionSize?: number
  /** Milliseconds after the last keystroke before the finder reads. Default 120. */
  searchDelay?: number
}

export type IdentityReadStatus = 'loading' | 'ready' | 'error'

/** One kind's first Identities, when every kind is listed together. */
export interface IdentitySection {
  readonly kind: IdentityKind
  readonly status: IdentityReadStatus
  /** The last answer, kept while the next one loads. */
  readonly identities: readonly Identity[]
  /** The kind holds more than it shows: its row opens the kind. */
  readonly more: boolean
}

/** One kind, or the only one, listed page by page. */
export interface IdentityList {
  readonly status: IdentityReadStatus
  readonly identities: readonly Identity[]
  readonly more: boolean
  readonly loadingMore: boolean
  readonly moreFailed: boolean
}

export type IdentityRow =
  | {
      readonly type: 'identity'
      readonly key: string
      readonly identity: Identity
      readonly kind?: IdentityKind
      readonly chosen: boolean
      /** Why it cannot be chosen, when the host said. */
      readonly unavailable?: string
      /** Unnamed, unavailable, or the maximum is reached and it is not chosen. */
      readonly disabled: boolean
      readonly self: boolean
    }
  | {
      /** Opens a kind to list all its Identities. */
      readonly type: 'kind'
      readonly key: string
      readonly kind: IdentityKind
    }

export interface IdentityFinderController {
  readonly kinds: {
    readonly status: IdentityReadStatus
    readonly list: readonly IdentityKind[]
  }
  readonly text: string
  setText(text: string): void
  /** The kind the user opened; absent, every kind is listed in sections. */
  readonly kind?: IdentityKind
  setKind(key: string | undefined): void
  /** The groups and Roles the user opened, outermost first: the list shows the last one's members. */
  readonly path: readonly Identity[]
  open(identity: Identity): void
  /** Back to the depth given: 0 leaves every opened Identity. */
  goTo(depth: number): void
  /** `sections` lists every kind together; `list` lists one kind page by page. */
  readonly view: 'sections' | 'list'
  readonly sections: readonly IdentitySection[]
  readonly list?: IdentityList
  /** A read is running for what the user typed or opened. */
  readonly searching: boolean
  loadMore(): void
  retry(): void
  /** Every row, in the order the keyboard walks them. */
  readonly rows: readonly IdentityRow[]
  readonly active?: string
  setActive(key: string): void
  readonly chosen: readonly Identity[]
  readonly maximum: number
  readonly maximumReached: boolean
  toggle(identity: Identity): void
  remove(id: string): void
  readonly confirming: boolean
  /** The message of the last failed confirmation, or `true` when it had none. */
  readonly confirmError?: string | true
  confirm(): void
  cancel(): void
  readonly theme?: 'light' | 'dark'
  /** Its picture: the one its page gave, else the one `source.picture` read, once it lands. */
  imageOf(identity: Identity): IdentityImage | undefined
  kindOf(classKey: string): IdentityKind | undefined
  /** The id of a row's option element, for `aria-activedescendant`. */
  optionId(key: string): string
  readonly listboxId: string
  getInputProps(props?: React.ComponentProps<'input'>): React.ComponentProps<'input'>
  getListboxProps(props?: React.ComponentProps<'div'>): React.ComponentProps<'div'>
  getOptionProps(row: IdentityRow, props?: React.ComponentProps<'div'>): React.ComponentProps<'div'>
  onRootKeyDown(event: React.KeyboardEvent): void
}

const NO_UNAVAILABLE: ReadonlyMap<string, string> = new Map()

/** Pictures read at once: a long list does not open dozens of downloads. */
const PICTURE_READS = 4

/** A section, with the text and opened Identity its last answer was read for. */
interface AnsweredSection extends IdentitySection {
  readonly answered?: string
}

interface PictureReads {
  readonly source: IdentityFinderSource
  readonly controller: AbortController
  /** The Identities whose picture was asked, once each per source. */
  readonly started: Set<string>
  queue: Identity[]
  running: number
}

/** An aborted read's rejection, which the finder ignores. */
function aborted(signal: AbortSignal): boolean {
  return signal.aborted
}

function useDebounced(value: string, delay: number): string {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    if (value === debounced) return
    if (delay <= 0) {
      setDebounced(value)
      return
    }
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, debounced, delay])
  return debounced
}

export function useIdentityFinderController(
  options: IdentityFinderOptions,
): IdentityFinderController {
  const {
    source,
    accepts,
    maximum: requested = 1,
    unavailable = NO_UNAVAILABLE,
    self,
    onConfirm,
    onCancel,
    theme,
    pageSize = 30,
    sectionSize = 4,
    searchDelay = 120,
  } = options
  const maximum = Math.max(1, Math.floor(requested))
  const baseId = React.useId()
  const listboxId = `${baseId}-identities`
  const acceptsKey = accepts === undefined ? '' : [...accepts].sort().join('\n')

  // ── Kinds ──
  const [kindsAttempt, setKindsAttempt] = React.useState(0)
  const [kinds, setKinds] = React.useState<{
    status: IdentityReadStatus
    list: readonly IdentityKind[]
  }>({ status: 'loading', list: [] })
  React.useEffect(() => {
    const reading = new AbortController()
    setKinds((current) => ({ status: 'loading', list: current.list }))
    source
      .kinds({
        ...(acceptsKey === '' ? {} : { accepts: acceptsKey.split('\n') }),
        signal: reading.signal,
      })
      .then(
        (list) => {
          if (!aborted(reading.signal)) setKinds({ status: 'ready', list })
        },
        () => {
          if (!aborted(reading.signal)) setKinds((current) => ({ ...current, status: 'error' }))
        },
      )
    return () => reading.abort()
  }, [source, acceptsKey, kindsAttempt])
  const kindByKey = React.useMemo(
    () => new Map(kinds.list.map((kind) => [kind.key, kind])),
    [kinds.list],
  )

  // ── Where the user stands ──
  const [text, setTextState] = React.useState('')
  const query = useDebounced(text.trim(), searchDelay)
  const [kindKey, setKindKey] = React.useState<string>()
  const [path, setPath] = React.useState<readonly Identity[]>([])
  const within = path.at(-1)?.id
  const kind = kindKey === undefined ? undefined : kindByKey.get(kindKey)
  const view: 'sections' | 'list' =
    kind !== undefined || kinds.list.length === 1 ? 'list' : 'sections'
  const listKinds = React.useMemo(
    () => (kind !== undefined ? [kind.key] : kinds.list.map((each) => each.key)),
    [kind, kinds.list],
  )
  const listKindsKey = listKinds.join('\n')
  const [attempt, setAttempt] = React.useState(0)

  // ── Sections: every kind, its first Identities ──
  const [sections, setSections] = React.useState<readonly AnsweredSection[]>([])
  const sectionsKey = `${query}\u0000${within ?? ''}`
  React.useEffect(() => {
    if (view !== 'sections' || kinds.status !== 'ready') return
    const reading = new AbortController()
    const previous = new Map<string, AnsweredSection>()
    setSections((current) => {
      for (const section of current) previous.set(section.kind.key, section)
      return kinds.list.map((each) => ({
        kind: each,
        status: 'loading',
        identities: previous.get(each.key)?.identities ?? [],
        more: previous.get(each.key)?.more ?? false,
      }))
    })
    const settle = (key: string, next: Partial<AnsweredSection>) =>
      setSections((current) =>
        current.map((section) => (section.kind.key === key ? { ...section, ...next } : section)),
      )
    for (const each of kinds.list) {
      source
        .identities({
          kinds: [each.key],
          text: query,
          ...(within === undefined ? {} : { within }),
          size: sectionSize,
          signal: reading.signal,
        })
        .then(
          (page) => {
            if (aborted(reading.signal)) return
            settle(each.key, {
              status: 'ready',
              identities: page.identities,
              more: page.next !== undefined,
              answered: sectionsKey,
            })
          },
          () => {
            if (!aborted(reading.signal))
              settle(each.key, { status: 'error', answered: sectionsKey })
          },
        )
    }
    return () => reading.abort()
    // `sectionsKey` stands for the text and the opened Identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, kinds, source, sectionsKey, sectionSize, attempt])

  // ── List: one kind, page by page ──
  const [list, setList] = React.useState<
    IdentityList & { readonly next?: string; readonly answered?: string }
  >({
    status: 'loading',
    identities: [],
    more: false,
    loadingMore: false,
    moreFailed: false,
  })
  const listRead = React.useRef<{ controller: AbortController; key: string } | null>(null)
  const listKey = `${listKindsKey}\u0000${query}\u0000${within ?? ''}`
  React.useEffect(() => {
    if (view !== 'list' || kinds.status !== 'ready') return
    const controller = new AbortController()
    listRead.current = { controller, key: listKey }
    setList((current) => ({
      status: 'loading',
      identities: current.identities,
      more: false,
      loadingMore: false,
      moreFailed: false,
    }))
    source
      .identities({
        kinds: listKindsKey === '' ? [] : listKindsKey.split('\n'),
        text: query,
        ...(within === undefined ? {} : { within }),
        size: pageSize,
        signal: controller.signal,
      })
      .then(
        (page: IdentityPage) => {
          if (aborted(controller.signal)) return
          setList({
            status: 'ready',
            identities: page.identities,
            more: page.next !== undefined,
            ...(page.next === undefined ? {} : { next: page.next }),
            loadingMore: false,
            moreFailed: false,
            answered: listKey,
          })
        },
        () => {
          if (!aborted(controller.signal))
            setList((current) => ({ ...current, status: 'error', more: false, answered: listKey }))
        },
      )
    return () => controller.abort()
    // `listKey` stands for the kinds, the text and the opened Identity.
  }, [view, kinds.status, source, listKey, pageSize, attempt])

  const loadMore = React.useCallback(() => {
    const read = listRead.current
    if (read === null || read.key !== listKey) return
    if (list.status !== 'ready' || list.next === undefined || list.loadingMore) return
    const after = list.next
    setList((current) => ({ ...current, loadingMore: true, moreFailed: false }))
    source
      .identities({
        kinds: listKinds,
        text: query,
        ...(within === undefined ? {} : { within }),
        after,
        size: pageSize,
        signal: read.controller.signal,
      })
      .then(
        (page) => {
          if (aborted(read.controller.signal)) return
          setList((current) => {
            const seen = new Set(current.identities.map((identity) => identity.id))
            const { next: _previous, ...rest } = current
            return {
              ...rest,
              identities: [
                ...current.identities,
                ...page.identities.filter((identity) => !seen.has(identity.id)),
              ],
              more: page.next !== undefined,
              ...(page.next === undefined ? {} : { next: page.next }),
              loadingMore: false,
            }
          })
        },
        () => {
          if (!aborted(read.controller.signal))
            setList((current) => ({ ...current, loadingMore: false, moreFailed: true }))
        },
      )
  }, [list, listKey, listKinds, pageSize, query, source, within])

  // ── Choices ──
  const [chosen, setChosen] = React.useState<readonly Identity[]>([])
  const [confirming, setConfirming] = React.useState(false)
  const [confirmError, setConfirmError] = React.useState<string | true>()
  const chosenIds = React.useMemo(() => new Set(chosen.map((each) => each.id)), [chosen])
  const maximumReached = chosen.length >= maximum
  const confirmingRef = React.useRef(false)

  const confirmWith = React.useCallback(
    (identities: readonly Identity[]) => {
      if (confirmingRef.current || identities.length === 0) return
      const choices = identities.flatMap((identity): IdentityChoice[] =>
        identity.name === undefined
          ? []
          : [{ id: identity.id, class: identity.class, name: identity.name }],
      )
      confirmingRef.current = true
      setConfirming(true)
      setConfirmError(undefined)
      Promise.resolve()
        .then(() => onConfirm(choices))
        .then(
          () => {
            confirmingRef.current = false
            setConfirming(false)
          },
          (error: unknown) => {
            confirmingRef.current = false
            setConfirming(false)
            setConfirmError(error instanceof Error && error.message !== '' ? error.message : true)
          },
        )
    },
    [onConfirm],
  )

  const choosable = React.useCallback(
    (identity: Identity) => identity.name !== undefined && !unavailable.has(identity.id),
    [unavailable],
  )

  const toggle = React.useCallback(
    (identity: Identity) => {
      if (confirmingRef.current || !choosable(identity)) return
      setConfirmError(undefined)
      if (maximum === 1) {
        setChosen([identity])
        confirmWith([identity])
        return
      }
      setChosen((current) => {
        if (current.some((each) => each.id === identity.id))
          return current.filter((each) => each.id !== identity.id)
        return current.length >= maximum ? current : [...current, identity]
      })
    },
    [choosable, confirmWith, maximum],
  )

  const remove = React.useCallback((id: string) => {
    if (confirmingRef.current) return
    setConfirmError(undefined)
    setChosen((current) => current.filter((each) => each.id !== id))
  }, [])

  // ── Rows and the active one ──
  const rowOf = React.useCallback(
    (identity: Identity): IdentityRow => {
      const isChosen = chosenIds.has(identity.id)
      const reason = unavailable.get(identity.id)
      const identityKind = kindByKey.get(identity.class)
      return {
        type: 'identity',
        key: identity.id,
        identity,
        ...(identityKind === undefined ? {} : { kind: identityKind }),
        chosen: isChosen,
        ...(reason === undefined ? {} : { unavailable: reason }),
        disabled: !choosable(identity) || (!isChosen && maximum > 1 && maximumReached),
        self: identity.id === self,
      }
    },
    [chosenIds, choosable, kindByKey, maximum, maximumReached, self, unavailable],
  )

  // A failed read shows its error, not the rows it kept: none of them can be walked or chosen.
  const rows = React.useMemo((): readonly IdentityRow[] => {
    if (kinds.status === 'error') return []
    if (view === 'list') return list.status === 'error' ? [] : list.identities.map(rowOf)
    return sections.flatMap((section): IdentityRow[] =>
      section.status === 'error'
        ? []
        : [
            ...section.identities.map(rowOf),
            ...(section.more
              ? [{ type: 'kind', key: `kind:${section.kind.key}`, kind: section.kind } as const]
              : []),
          ],
    )
  }, [kinds.status, view, list.status, list.identities, sections, rowOf])

  // ── Pictures read on demand ──
  // Each Identity's picture is asked once per source, a few at a time, for the rows shown and the
  // choices; a read not started yet is dropped when its row goes.
  const [pictures, setPictures] = React.useState<ReadonlyMap<string, IdentityImage | null>>(
    () => new Map(),
  )
  const pictureReads = React.useRef<PictureReads | null>(null)
  const wantedPictures = React.useMemo(() => {
    const wanted = new Map<string, Identity>()
    const consider = (identity: Identity) => {
      if (identity.picture === true && identity.image === undefined)
        wanted.set(identity.id, identity)
    }
    for (const row of rows) if (row.type === 'identity') consider(row.identity)
    for (const identity of chosen) consider(identity)
    return wanted
  }, [rows, chosen])
  const wantedPicturesKey = [...wantedPictures.keys()].join('\n')
  React.useEffect(() => {
    const read = source.picture
    if (read === undefined) return
    let reads = pictureReads.current
    // A new source, or a remount after the reads were aborted, starts afresh.
    if (reads === null || reads.source !== source || reads.controller.signal.aborted) {
      reads?.controller.abort()
      reads = {
        source,
        controller: new AbortController(),
        started: new Set(),
        queue: [],
        running: 0,
      }
      pictureReads.current = reads
      setPictures(new Map())
    }
    const current = reads
    const { signal } = current.controller
    current.queue = [...wantedPictures.values()].filter(
      (identity) => !current.started.has(identity.id),
    )
    const settle = (id: string, image: IdentityImage | null) => {
      if (!signal.aborted) setPictures((held) => new Map(held).set(id, image))
    }
    const pump = () => {
      while (current.running < PICTURE_READS && current.queue.length > 0 && !signal.aborted) {
        const identity = current.queue.shift()!
        current.started.add(identity.id)
        current.running++
        read
          .call(source, { identity, signal })
          .then(
            (image) => settle(identity.id, image ?? null),
            () => settle(identity.id, null),
          )
          .finally(() => {
            current.running--
            pump()
          })
      }
    }
    pump()
    // `wantedPicturesKey` names exactly the Identities `wantedPictures` holds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, wantedPicturesKey])
  React.useEffect(() => () => pictureReads.current?.controller.abort(), [])
  const imageOf = React.useCallback(
    (identity: Identity) => identity.image ?? pictures.get(identity.id) ?? undefined,
    [pictures],
  )

  const [activeKey, setActiveKey] = React.useState<string>()
  const [pendingEnter, setPendingEnter] = React.useState(false)
  const active = rows.some((row) => row.key === activeKey) ? activeKey : rows[0]?.key
  const scrollActive = React.useRef(false)
  const optionId = React.useCallback(
    // Every character but a letter, a digit or `-` is spelled by its code point: two keys never
    // share an id.
    (key: string) =>
      `${baseId}-option-${key.replace(/[^a-zA-Z0-9-]/gu, (character) => `_${character.codePointAt(0)!.toString(16)}_`)}`,
    [baseId],
  )
  React.useEffect(() => {
    if (!scrollActive.current || active === undefined) return
    scrollActive.current = false
    const element = document.getElementById(optionId(active))
    element?.scrollIntoView?.({ block: 'nearest' })
  }, [active, optionId])

  const move = (delta: number) => {
    if (rows.length === 0) return
    const index = rows.findIndex((row) => row.key === active)
    const next = Math.min(rows.length - 1, Math.max(0, (index < 0 ? -1 : index) + delta))
    scrollActive.current = true
    setActiveKey(rows[next]!.key)
  }

  // ── Navigation ──
  const setText = React.useCallback((next: string) => {
    setTextState(next)
    setActiveKey(undefined)
    setPendingEnter(false)
  }, [])
  const setKind = React.useCallback((key: string | undefined) => {
    setKindKey(key)
    setActiveKey(undefined)
    setPendingEnter(false)
  }, [])
  const open = React.useCallback((identity: Identity) => {
    if (identity.members !== true) return
    setPath((current) => [...current, identity])
    setTextState('')
    setKindKey(undefined)
    setActiveKey(undefined)
    setPendingEnter(false)
  }, [])
  const goTo = React.useCallback((depth: number) => {
    setPath((current) => current.slice(0, Math.max(0, depth)))
    setTextState('')
    setActiveKey(undefined)
    setPendingEnter(false)
  }, [])

  const activate = (row: IdentityRow) => {
    if (row.type === 'kind') setKind(row.kind.key)
    else toggle(row.identity)
  }

  const confirm = React.useCallback(() => confirmWith(chosen), [chosen, confirmWith])

  const retry = React.useCallback(() => {
    if (kinds.status === 'error') setKindsAttempt((count) => count + 1)
    else setAttempt((count) => count + 1)
  }, [kinds.status])

  const searching =
    kinds.status === 'loading' ||
    (view === 'list'
      ? list.status === 'loading'
      : sections.some((section) => section.status === 'loading'))
  /** The rows answer what the input holds now, and what is open: no read is still due. */
  const fresh =
    !searching &&
    text.trim() === query &&
    (view === 'list'
      ? list.answered === listKey
      : sections.every((section) => section.answered === sectionsKey))

  // Enter on the first row before its read answered waits for the answer, then takes its first
  // row: never the first row of what an earlier text found.
  React.useEffect(() => {
    if (!pendingEnter || !fresh) return
    setPendingEnter(false)
    const first = rows[0]
    if (first !== undefined) activate(first)
    // `activate` reads the rows of this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEnter, fresh, rows])

  /** Cancel, unless a confirmation runs: its outcome is the host's to take. */
  const cancel = React.useCallback(() => {
    if (!confirmingRef.current) onCancel()
  }, [onCancel])

  const onRootKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    if (text !== '') setText('')
    else if (path.length > 0) goTo(path.length - 1)
    else if (kindKey !== undefined && kinds.list.length > 1) setKind(undefined)
    else cancel()
  }

  const activeRow = rows.find((row) => row.key === active)

  const getInputProps = (props: React.ComponentProps<'input'> = {}) => ({
    type: 'text',
    role: 'combobox',
    autoComplete: 'off',
    spellCheck: false,
    'aria-autocomplete': 'list' as const,
    'aria-expanded': true,
    'aria-controls': listboxId,
    ...(active === undefined ? {} : { 'aria-activedescendant': optionId(active) }),
    ...props,
    value: text,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(event)
      if (!event.defaultPrevented) setText(event.target.value)
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      props.onKeyDown?.(event)
      // A key that commits composed text (an input method) is the composition's, not the finder's.
      if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return
      const input = event.currentTarget
      const atEnd = input.selectionStart === text.length && input.selectionEnd === text.length
      const atStart = input.selectionStart === 0 && input.selectionEnd === 0
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          move(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          move(-1)
          break
        case 'PageDown':
          event.preventDefault()
          move(8)
          break
        case 'PageUp':
          event.preventDefault()
          move(-8)
          break
        case 'Enter':
          event.preventDefault()
          if (event.metaKey || event.ctrlKey) confirm()
          // A row the user walked to is the one they see; the first row stands for the text only
          // once its read answered.
          else if (activeKey !== undefined && activeRow !== undefined) activate(activeRow)
          else if (fresh) {
            if (activeRow !== undefined) activate(activeRow)
          } else setPendingEnter(true)
          break
        case 'ArrowRight':
          if (atEnd && activeRow?.type === 'identity' && activeRow.identity.members === true) {
            event.preventDefault()
            open(activeRow.identity)
          }
          break
        case 'ArrowLeft':
          if (atStart && path.length > 0) {
            event.preventDefault()
            goTo(path.length - 1)
          }
          break
        case 'Backspace':
          if (text !== '') break
          if (path.length > 0) goTo(path.length - 1)
          else if (kindKey !== undefined && kinds.list.length > 1) setKind(undefined)
          else if (maximum > 1 && chosen.length > 0) remove(chosen.at(-1)!.id)
          else break
          event.preventDefault()
          break
      }
    },
  })

  const getListboxProps = (props: React.ComponentProps<'div'> = {}) => ({
    role: 'listbox',
    id: listboxId,
    ...(maximum > 1 ? { 'aria-multiselectable': true } : {}),
    'aria-busy': searching,
    ...props,
  })

  const getOptionProps = (row: IdentityRow, props: React.ComponentProps<'div'> = {}) => ({
    role: 'option',
    id: optionId(row.key),
    'aria-selected': row.type === 'identity' ? row.chosen : false,
    ...(row.type === 'identity' && row.disabled ? { 'aria-disabled': true } : {}),
    'data-active': row.key === active ? '' : undefined,
    'data-chosen': row.type === 'identity' && row.chosen ? '' : undefined,
    'data-disabled': row.type === 'identity' && row.disabled ? '' : undefined,
    ...props,
    onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => {
      props.onMouseDown?.(event)
      // The input keeps the focus, so typing goes on where it was.
      event.preventDefault()
    },
    onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => {
      props.onMouseMove?.(event)
      if (row.key !== active) setActiveKey(row.key)
    },
    onClick: (event: React.MouseEvent<HTMLDivElement>) => {
      props.onClick?.(event)
      if (!event.defaultPrevented) activate(row)
    },
  })

  return {
    kinds,
    text,
    setText,
    ...(kind === undefined ? {} : { kind }),
    setKind,
    path,
    open,
    goTo,
    view,
    sections: sections.filter(
      (section) => section.status !== 'ready' || section.identities.length > 0,
    ),
    ...(view === 'list' ? { list } : {}),
    searching,
    loadMore,
    retry,
    rows,
    ...(active === undefined ? {} : { active }),
    setActive: setActiveKey,
    chosen,
    maximum,
    maximumReached,
    toggle,
    remove,
    confirming,
    ...(confirmError === undefined ? {} : { confirmError }),
    confirm,
    cancel,
    ...(theme === undefined ? {} : { theme }),
    imageOf,
    kindOf: (classKey) => kindByKey.get(classKey),
    optionId,
    listboxId,
    getInputProps,
    getListboxProps,
    getOptionProps,
    onRootKeyDown,
  }
}
