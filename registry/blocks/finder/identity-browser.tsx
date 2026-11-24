import { buttonVariants } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import {
  IdentityAvatar,
  IdentityFinder,
  IdentityFinderCancel,
  IdentityFinderConfirm,
  IdentityFinderInput,
  IdentityFinderList,
  IdentityFinderOption,
  useIdentityFinder,
  type Identity,
  type IdentityChoice,
  type IdentityFinderSource,
  type IdentityImage,
  type IdentityKind,
  type IdentityRow,
} from '@astrale-os/ui/identity-finder'
import { Skeleton } from '@astrale-os/ui/skeleton'
import { createContext, useContext, useEffect, useRef } from 'react'

export interface IdentityBrowserProps {
  /** What the finder reads: the host's Identities, read as the user. */
  source: IdentityFinderSource
  /** Class keys the request accepts; each admits every Class that extends it. Absent: any. */
  accepts?: readonly string[]
  /** How many Identities the user may choose. Default 1: choosing one confirms it. */
  maximum?: number
  /** Identities listed but not choosable, each with the reason its row shows. */
  unavailable?: ReadonlyMap<string, string>
  /** The user's own Identity, marked as such. */
  self?: string
  /**
   * Take the chosen Identities. While a returned promise runs, the finder waits; when it rejects,
   * the message of the `Error` shows above the buttons and the choices stay.
   */
  onConfirm(choices: readonly IdentityChoice[]): void | Promise<void>
  onCancel(): void
  /** Picks each picture's dark image; absent, the color-scheme preference decides. */
  theme?: 'light' | 'dark'
  /** The heading, in place of the default: Add members. */
  title?: React.ReactNode
  /** A line under the heading: who asks, or why. */
  description?: React.ReactNode
  /** The id of the title, for a dialog that names itself by it. */
  titleId?: string
  /** The id of the description, for a dialog that describes itself by it. */
  descriptionId?: string
  /** The words it shows, each in place of its English default. */
  messages?: Partial<IdentityBrowserMessages>
  className?: string
  style?: React.CSSProperties
}

/** The words the browser shows; a host in another language gives its own. */
export interface IdentityBrowserMessages {
  readonly selectOne: string
  readonly selectMany: string
  readonly search: string
  readonly kinds: string
  readonly everyKind: string
  /** A kind's tab and section heading, from its Class's name. */
  readonly kind: (kind: IdentityKind) => string
  /** The row that opens a kind to list all of it. */
  readonly showAll: (kind: IdentityKind) => string
  readonly everyone: string
  readonly path: string
  readonly back: string
  readonly identities: string
  readonly open: (name: string) => string
  readonly members: string
  readonly you: string
  readonly noName: string
  readonly nothingReadable: string
  readonly noMatch: (text: string) => string
  readonly noMembers: string
  readonly failed: string
  readonly kindsFailed: string
  readonly moreFailed: string
  readonly retry: string
  readonly loadMore: string
  readonly chosen: string
  readonly remove: (name: string) => string
  readonly confirmFailed: string
  readonly tally: (count: number, maximum: number) => string
  readonly hints: { readonly move: string; readonly choose: string; readonly open: string }
  readonly cancel: string
  readonly confirm: string
}

export const IDENTITY_BROWSER_MESSAGES: IdentityBrowserMessages = {
  selectOne: 'Select someone',
  selectMany: 'Select people',
  search: 'Search by name or email',
  kinds: 'Kinds',
  everyKind: 'All',
  kind: (kind) => kind.name,
  showAll: (kind) => `All ${kind.name}`,
  everyone: 'Everyone',
  path: 'Opened',
  back: 'Back',
  identities: 'People and groups',
  open: (name) => `Open ${name}`,
  members: 'Members',
  you: 'You',
  noName: 'No name',
  nothingReadable: 'No one here you can see',
  noMatch: (text) => `No one matches “${text}”`,
  noMembers: 'No members you can see',
  failed: 'Couldn’t load these',
  kindsFailed: 'Couldn’t load who you can see',
  moreFailed: 'Couldn’t load more',
  retry: 'Retry',
  loadMore: 'Load more',
  chosen: 'Chosen',
  remove: (name) => `Remove ${name}`,
  confirmFailed: 'Couldn’t select them',
  tally: (count, maximum) => `${count} of ${maximum}`,
  hints: { move: 'move', choose: 'select', open: 'open' },
  cancel: 'Cancel',
  confirm: 'Select',
}

const Messages = createContext<IdentityBrowserMessages>(IDENTITY_BROWSER_MESSAGES)

/**
 * The identity finder as a panel: a search over people, groups, Roles and every other kind of
 * Identity the source lists, each kind in its own section; a group or a Role opens to its members.
 */
export function IdentityBrowser({
  source,
  accepts,
  maximum = 1,
  unavailable,
  self,
  onConfirm,
  onCancel,
  theme,
  title,
  description,
  titleId,
  descriptionId,
  messages,
  className,
  style,
}: IdentityBrowserProps) {
  const m = { ...IDENTITY_BROWSER_MESSAGES, ...messages }
  return (
    <Messages.Provider value={m}>
      <IdentityFinder
        source={source}
        {...(accepts ? { accepts } : {})}
        maximum={maximum}
        {...(unavailable ? { unavailable } : {})}
        {...(self === undefined ? {} : { self })}
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...(theme ? { theme } : {})}
        data-slot="block-finder-identity-browser"
        className={cn(
          'flex h-full min-h-0 flex-col bg-popover text-sm text-popover-foreground',
          className,
        )}
        style={style}
      >
        <header
          data-slot="block-finder-identity-browser-header"
          className="grid gap-0.5 px-4 pt-4 pb-3"
        >
          <h2
            data-slot="block-finder-identity-browser-title"
            id={titleId}
            className="text-base font-semibold"
          >
            {title ?? (maximum > 1 ? m.selectMany : m.selectOne)}
          </h2>
          {description ? (
            <p
              data-slot="block-finder-identity-browser-description"
              id={descriptionId}
              className="text-xs text-muted-foreground"
            >
              {description}
            </p>
          ) : null}
        </header>
        <SearchField />
        <Kinds />
        <Path />
        <Results />
        <Footer />
      </IdentityFinder>
    </Messages.Provider>
  )
}

// ── Glyphs ────────────────────────────────────────────────────────────────────────────────────

function Glyph({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      data-slot="block-finder-identity-browser-glyph"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-3.5 shrink-0', className)}
      aria-hidden="true"
    >
      <path data-slot="block-finder-identity-browser-glyph-path" d={path} />
    </svg>
  )
}

const SEARCH = 'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM13.5 13.5 10.6 10.6'
const CLOSE = 'M4.5 4.5l7 7M11.5 4.5l-7 7'
const CHEVRON = 'M6 3.5 10.5 8 6 12.5'
const BACK = 'M10 3.5 5.5 8l4.5 4.5'
const CHECK = 'M3.5 8.5 6.5 11.5 12.5 4.5'
const PEOPLE =
  'M6 7.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM2 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M10.5 3.2a2.25 2.25 0 0 1 0 4.1M12 9.7c1.2.4 2 1.5 2 3.3'

const iconButton =
  'grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50'

// ── Search and kinds ──────────────────────────────────────────────────────────────────────────

function SearchField() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  return (
    <div data-slot="block-finder-identity-browser-search" className="px-4 pb-2">
      <label
        data-slot="block-finder-identity-browser-search-field"
        className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 dark:bg-input/30"
      >
        <Glyph path={SEARCH} className="size-4 text-muted-foreground" />
        <IdentityFinderInput
          autoFocus
          aria-label={m.search}
          placeholder={m.search}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {finder.searching ? (
          <span
            data-slot="block-finder-identity-browser-spinner"
            aria-hidden="true"
            className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
          />
        ) : finder.text !== '' ? (
          <button
            data-slot="block-finder-identity-browser-search-clear"
            type="button"
            aria-label={m.cancel}
            className={cn(iconButton, 'size-5')}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => finder.setText('')}
          >
            <Glyph path={CLOSE} className="size-3" />
          </button>
        ) : null}
      </label>
    </div>
  )
}

function KindIcon({ icon, className }: { icon?: IdentityImage; className?: string }) {
  const { theme } = useIdentityFinder()
  if (icon === undefined) return <Glyph path={PEOPLE} className={cn('size-4', className)} />
  return (
    <img
      data-slot="block-finder-identity-browser-kind-icon"
      src={theme === 'dark' && icon.dark ? icon.dark : icon.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('size-4 shrink-0 object-contain', className)}
    />
  )
}

function Kinds() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  if (finder.kinds.list.length < 2) return null
  const tab = (selected: boolean) =>
    cn(
      'flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
      selected
        ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90'
        : 'bg-background text-muted-foreground',
    )
  return (
    <div
      data-slot="block-finder-identity-browser-kinds"
      role="group"
      aria-label={m.kinds}
      className="flex gap-1.5 overflow-x-auto px-4 pb-2"
    >
      <button
        data-slot="block-finder-identity-browser-kind-tab"
        type="button"
        aria-pressed={finder.kind === undefined}
        className={tab(finder.kind === undefined)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => finder.setKind(undefined)}
      >
        {m.everyKind}
      </button>
      {finder.kinds.list.map((kind) => (
        <button
          data-slot="block-finder-identity-browser-kind-tab"
          key={kind.key}
          type="button"
          title={kind.description}
          aria-pressed={finder.kind?.key === kind.key}
          className={tab(finder.kind?.key === kind.key)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => finder.setKind(kind.key)}
        >
          <KindIcon icon={kind.icon} className="size-3.5" />
          {m.kind(kind)}
        </button>
      ))}
    </div>
  )
}

function Path() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  if (finder.path.length === 0) return null
  return (
    <nav
      data-slot="block-finder-identity-browser-path"
      aria-label={m.path}
      className="flex min-w-0 items-center gap-1 px-4 pb-2 text-xs text-muted-foreground"
    >
      <button
        data-slot="block-finder-identity-browser-path-back"
        type="button"
        aria-label={m.back}
        className={iconButton}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => finder.goTo(finder.path.length - 1)}
      >
        <Glyph path={BACK} />
      </button>
      <button
        data-slot="block-finder-identity-browser-path-root"
        type="button"
        className="shrink-0 rounded px-1 hover:text-foreground"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => finder.goTo(0)}
      >
        {m.everyone}
      </button>
      {finder.path.map((identity, index) => (
        <span
          data-slot="block-finder-identity-browser-path-step"
          key={identity.id}
          className="flex min-w-0 items-center gap-1"
        >
          <Glyph path={CHEVRON} className="size-3" />
          {index === finder.path.length - 1 ? (
            <span
              data-slot="block-finder-identity-browser-path-current"
              aria-current="location"
              className="truncate font-medium text-foreground"
            >
              {identity.name ?? m.noName}
            </span>
          ) : (
            <button
              data-slot="block-finder-identity-browser-path-link"
              type="button"
              className="truncate rounded px-1 hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => finder.goTo(index + 1)}
            >
              {identity.name ?? m.noName}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────────────────────

function Results() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  const rowsOf = (identities: readonly Identity[]) =>
    identities.flatMap((identity) => finder.rows.find((row) => row.key === identity.id) ?? [])

  let body: React.ReactNode
  if (finder.kinds.status === 'error') {
    body = <Failure retry={finder.retry}>{m.kindsFailed}</Failure>
  } else if (finder.kinds.status === 'loading' && finder.kinds.list.length === 0) {
    body = <RowsSkeleton rows={5} />
  } else if (finder.kinds.list.length === 0) {
    body = <Note>{m.nothingReadable}</Note>
  } else if (finder.view === 'list' && finder.list) {
    const { list } = finder
    body =
      list.status === 'error' ? (
        <Failure retry={finder.retry}>{m.failed}</Failure>
      ) : list.status === 'loading' && list.identities.length === 0 ? (
        <RowsSkeleton rows={6} />
      ) : list.identities.length === 0 ? (
        <Empty />
      ) : (
        <>
          {finder.rows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
          {list.more || list.loadingMore || list.moreFailed ? <More /> : null}
        </>
      )
  } else {
    const settled = finder.sections.every((section) => section.status !== 'loading')
    body =
      finder.sections.length === 0 && settled ? (
        <Empty />
      ) : (
        finder.sections.map((section) => (
          <section
            key={section.kind.key}
            data-slot="block-finder-identity-browser-section"
            role="group"
            aria-label={m.kind(section.kind)}
            className="pb-1"
          >
            <h3
              data-slot="block-finder-identity-browser-section-heading"
              className="sticky top-0 z-1 flex items-center gap-1.5 bg-popover px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
            >
              <KindIcon icon={section.kind.icon} className="size-3.5" />
              {m.kind(section.kind)}
            </h3>
            {section.status === 'error' ? (
              <Failure retry={finder.retry}>{m.failed}</Failure>
            ) : section.status === 'loading' && section.identities.length === 0 ? (
              <RowsSkeleton rows={2} />
            ) : (
              <>
                {rowsOf(section.identities).map((row) => (
                  <Row key={row.key} row={row} />
                ))}
                {section.more ? (
                  <Row
                    row={
                      finder.rows.find((row) => row.key === `kind:${section.kind.key}`) ?? {
                        type: 'kind',
                        key: `kind:${section.kind.key}`,
                        kind: section.kind,
                      }
                    }
                  />
                ) : null}
              </>
            )}
          </section>
        ))
      )
  }

  return (
    <IdentityFinderList
      aria-label={m.identities}
      className="min-h-0 flex-1 overflow-y-auto border-t px-2 pb-2 outline-none"
    >
      {body}
    </IdentityFinderList>
  )
}

function Empty() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  const text = finder.text.trim()
  return (
    <Note>
      {text !== '' ? m.noMatch(text) : finder.path.length > 0 ? m.noMembers : m.nothingReadable}
    </Note>
  )
}

const row =
  'group/row flex min-h-11 cursor-default items-center gap-3 rounded-md px-2 py-1.5 select-none data-active:bg-accent data-active:text-accent-foreground data-disabled:opacity-55'

function Row({ row: item }: { row: IdentityRow }) {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  if (item.type === 'kind') {
    return (
      <IdentityFinderOption row={item} className={cn(row, 'min-h-9 text-xs text-muted-foreground')}>
        <span
          data-slot="block-finder-identity-browser-show-all-icon"
          className="grid size-8 shrink-0 place-items-center"
        >
          <Glyph path={CHEVRON} />
        </span>
        <span data-slot="block-finder-identity-browser-show-all-label" className="flex-1 truncate">
          {m.showAll(item.kind)}
        </span>
      </IdentityFinderOption>
    )
  }
  const { identity } = item
  const roundAvatar = item.kind === undefined || finder.kinds.list[0]?.key === item.kind.key
  return (
    <IdentityFinderOption row={item} className={row} title={item.unavailable}>
      <span data-slot="block-finder-identity-browser-avatar-frame" className="relative shrink-0">
        {identity.image === undefined && !roundAvatar ? (
          <span
            data-slot="block-finder-identity-browser-kind-avatar"
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground"
          >
            <KindIcon icon={item.kind?.icon} />
          </span>
        ) : (
          <IdentityAvatar
            {...(identity.name === undefined ? {} : { name: identity.name })}
            {...(identity.image === undefined ? {} : { image: identity.image })}
            className={cn(
              'grid size-8 place-items-center overflow-hidden bg-muted text-[11px] font-medium text-muted-foreground [&_img]:size-full [&_img]:object-cover',
              roundAvatar ? 'rounded-full' : 'rounded-md',
            )}
          />
        )}
        {item.chosen ? (
          <span
            data-slot="block-finder-identity-browser-chosen-badge"
            aria-hidden="true"
            className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-popover"
          >
            <Glyph path={CHECK} className="size-2.5" />
          </span>
        ) : null}
      </span>
      <span data-slot="block-finder-identity-browser-row-text" className="grid min-w-0 flex-1">
        <span
          data-slot="block-finder-identity-browser-row-title"
          className="flex min-w-0 items-center gap-1.5"
        >
          <span
            data-slot="block-finder-identity-browser-row-name"
            className={cn(
              'truncate',
              identity.name === undefined && 'text-muted-foreground italic',
            )}
          >
            {identity.name === undefined ? m.noName : <Match text={identity.name} />}
          </span>
          {item.self ? (
            <span
              data-slot="block-finder-identity-browser-self-badge"
              className="shrink-0 rounded bg-muted px-1 text-[10px] text-muted-foreground"
            >
              {m.you}
            </span>
          ) : null}
        </span>
        {identity.detail ? (
          <span
            data-slot="block-finder-identity-browser-row-detail"
            className="truncate text-xs text-muted-foreground"
          >
            <Match text={identity.detail} />
          </span>
        ) : null}
      </span>
      {item.unavailable ? (
        <span
          data-slot="block-finder-identity-browser-unavailable-reason"
          className="shrink-0 text-xs text-muted-foreground"
        >
          {item.unavailable}
        </span>
      ) : null}
      {identity.members ? (
        <button
          data-slot="block-finder-identity-browser-open-members"
          type="button"
          tabIndex={-1}
          aria-label={m.open(identity.name ?? m.noName)}
          title={`${m.members} →`}
          className={cn(iconButton, 'size-7')}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            finder.open(identity)
          }}
        >
          <Glyph path={CHEVRON} />
        </button>
      ) : null}
    </IdentityFinderOption>
  )
}

/** The text, its first word that starts with what the user typed set in bold. */
function Match({ text }: { text: string }) {
  const { text: typed } = useIdentityFinder()
  const query = typed.trim().toLocaleLowerCase()
  if (query === '') return text
  const lower = text.toLocaleLowerCase()
  let at = -1
  for (let index = 0; index <= lower.length - query.length; index += 1) {
    const boundary = index === 0 || /[\s@._-]/u.test(lower[index - 1]!)
    if (boundary && lower.startsWith(query, index)) {
      at = index
      break
    }
  }
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark
        data-slot="block-finder-identity-browser-match"
        className="bg-transparent font-semibold text-current"
      >
        {text.slice(at, at + query.length)}
      </mark>
      {text.slice(at + query.length)}
    </>
  )
}

/** Reads the next page once the end of the list scrolls into view, or on a click. */
function More() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  const sentinel = useRef<HTMLDivElement>(null)
  const { loadMore } = finder
  const list = finder.list
  useEffect(() => {
    const element = sentinel.current
    if (element === null || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [loadMore])
  if (list === undefined) return null
  return (
    <div
      ref={sentinel}
      data-slot="block-finder-identity-browser-more"
      className="grid place-items-center py-2"
    >
      {list.loadingMore ? (
        <RowsSkeleton rows={2} />
      ) : list.moreFailed ? (
        <Failure retry={loadMore}>{m.moreFailed}</Failure>
      ) : (
        <button
          data-slot="block-finder-identity-browser-load-more"
          type="button"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          onMouseDown={(event) => event.preventDefault()}
          onClick={loadMore}
        >
          {m.loadMore}
        </button>
      )}
    </div>
  )
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div
      data-slot="block-finder-identity-browser-loading"
      aria-hidden="true"
      className="grid w-full"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          data-slot="block-finder-identity-browser-skeleton-row"
          key={index}
          className="flex h-11 items-center gap-3 px-2"
        >
          <Skeleton className="size-8 rounded-full" />
          <div
            data-slot="block-finder-identity-browser-skeleton-text"
            className="grid flex-1 gap-1.5"
          >
            <Skeleton className="h-3" style={{ width: `${44 - (index % 3) * 8}%` }} />
            <Skeleton className="h-2.5" style={{ width: `${30 - (index % 3) * 5}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p
      data-slot="block-finder-identity-browser-note"
      className="px-3 py-8 text-center text-sm text-muted-foreground"
    >
      {children}
    </p>
  )
}

function Failure({ retry, children }: { retry: () => void; children: React.ReactNode }) {
  const m = useContext(Messages)
  return (
    <div
      data-slot="block-finder-identity-browser-failure"
      className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-muted-foreground"
    >
      <span data-slot="block-finder-identity-browser-failure-message">{children}</span>
      <button
        data-slot="block-finder-identity-browser-retry"
        type="button"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
        onMouseDown={(event) => event.preventDefault()}
        onClick={retry}
      >
        {m.retry}
      </button>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────────────────────

function Footer() {
  const finder = useIdentityFinder()
  const m = useContext(Messages)
  const many = finder.maximum > 1
  return (
    <div
      data-slot="block-finder-identity-browser-footer"
      className="flex shrink-0 items-center gap-3 border-t px-4 py-2.5"
    >
      {many ? (
        <ul
          data-slot="block-finder-identity-browser-chips"
          aria-label={m.chosen}
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
        >
          {finder.chosen.map((identity) => (
            <li
              data-slot="block-finder-identity-browser-chip"
              key={identity.id}
              className="flex h-7 max-w-48 shrink-0 items-center gap-1.5 rounded-full border bg-background pr-0.5 pl-0.5 text-xs"
            >
              <IdentityAvatar
                {...(identity.name === undefined ? {} : { name: identity.name })}
                {...(identity.image === undefined ? {} : { image: identity.image })}
                className="grid size-5 place-items-center overflow-hidden rounded-full bg-muted text-[9px] font-medium text-muted-foreground [&_img]:size-full [&_img]:object-cover"
              />
              <span data-slot="block-finder-identity-browser-chip-name" className="truncate">
                {identity.name}
              </span>
              <button
                data-slot="block-finder-identity-browser-chip-remove"
                type="button"
                aria-label={m.remove(identity.name ?? m.noName)}
                className={cn(iconButton, 'size-5 rounded-full')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => finder.remove(identity.id)}
              >
                <Glyph path={CLOSE} className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p
          data-slot="block-finder-identity-browser-hints"
          aria-hidden="true"
          className="flex min-w-0 flex-1 items-center gap-3 truncate text-[11px] text-muted-foreground"
        >
          <span data-slot="block-finder-identity-browser-hint">
            <Key>↑</Key>
            <Key>↓</Key> {m.hints.move}
          </span>
          <span data-slot="block-finder-identity-browser-hint">
            <Key>↵</Key> {m.hints.choose}
          </span>
          {finder.rows.some((row) => row.type === 'identity' && row.identity.members) ? (
            <span data-slot="block-finder-identity-browser-hint">
              <Key>→</Key> {m.hints.open}
            </span>
          ) : null}
        </p>
      )}
      {finder.confirmError === undefined ? null : (
        <p
          data-slot="block-finder-identity-browser-confirm-error"
          role="alert"
          className="max-w-72 shrink truncate text-xs text-destructive"
          title={finder.confirmError === true ? undefined : finder.confirmError}
        >
          {finder.confirmError === true ? m.confirmFailed : finder.confirmError}
        </p>
      )}
      {many ? (
        <span
          data-slot="block-finder-identity-browser-tally"
          className={cn(
            'shrink-0 text-xs text-muted-foreground tabular-nums',
            finder.maximumReached && 'text-foreground',
          )}
        >
          {m.tally(finder.chosen.length, finder.maximum)}
        </span>
      ) : null}
      <IdentityFinderCancel className={buttonVariants({ variant: 'outline' })}>
        {m.cancel}
      </IdentityFinderCancel>
      {many ? (
        <IdentityFinderConfirm className={buttonVariants()} title={`${m.confirm} (⌘↵)`}>
          {m.confirm}
        </IdentityFinderConfirm>
      ) : null}
    </div>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      data-slot="block-finder-identity-browser-key"
      className="mr-0.5 inline-grid h-4 min-w-4 place-items-center rounded border bg-muted px-0.5 font-sans text-[10px]"
    >
      {children}
    </kbd>
  )
}
