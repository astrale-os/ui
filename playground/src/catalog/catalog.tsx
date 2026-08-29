import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Kbd,
  ScrollArea,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@astrale-os/ui'
import { ArrowLeftIcon, ListTreeIcon, SearchIcon } from 'lucide-react'
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { componentNames } from './inventory.js'
import { observeNearViewport, PreviewCanvas } from './preview.js'
import { prefetchPreviewFamily, previewDescriptors, type PreviewDescriptor } from './previews.js'

const CommandPaletteControlled = lazy(() =>
  import('../../../registry/patterns/command-palette/controlled.js').then((module) => ({
    default: module.CommandPaletteControlled,
  })),
)

class CommandPaletteBoundary extends Component<{ children: ReactNode }, { unavailable: boolean }> {
  state = { unavailable: false }

  static getDerivedStateFromError() {
    return { unavailable: true }
  }

  render() {
    if (!this.state.unavailable) return this.props.children
    return (
      <Alert>
        <AlertTitle>Search unavailable</AlertTitle>
        <AlertDescription>The search interface could not be loaded.</AlertDescription>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reload catalog
        </Button>
      </Alert>
    )
  }
}

function currentSearch() {
  return new URLSearchParams(window.location.search)
}

type CatalogKind = PreviewDescriptor['kind']

type CatalogHistoryState = {
  catalogEntry?: true
  catalogParent?: true
  catalogScrollY?: number
  catalogAnchorId?: string
  catalogAnchorTop?: number
  catalogFocusId?: string
}

const catalogKinds = ['component', 'pattern', 'block'] as const
const catalogKindLabels: Record<CatalogKind, string> = {
  component: 'Components',
  pattern: 'Patterns',
  block: 'Blocks',
}
const componentFamilyOrder = new Map<string, number>(
  componentNames.map((family, index) => [family, index]),
)

function isCatalogKind(value: string | null): value is CatalogKind {
  return catalogKinds.some((kind) => kind === value)
}

function historyState(): CatalogHistoryState {
  return (window.history.state ?? {}) as CatalogHistoryState
}

function kindUrl(kind: CatalogKind) {
  return `${window.location.pathname}?kind=${kind}`
}

function withoutSmoothScroll(scroll: () => void) {
  const previous = document.documentElement.style.scrollBehavior
  document.documentElement.style.scrollBehavior = 'auto'
  scroll()
  document.documentElement.style.scrollBehavior = previous
}

function groupDescriptors(descriptors: PreviewDescriptor[]) {
  const groups = new Map<string, PreviewDescriptor[]>()
  for (const descriptor of descriptors) {
    const key = `${descriptor.kind}/${descriptor.family}`
    const group = groups.get(key) ?? []
    group.push(descriptor)
    groups.set(key, group)
  }
  for (const items of groups.values()) {
    items.sort(
      (left, right) =>
        left.address.split('/').length - right.address.split('/').length ||
        left.id.localeCompare(right.id),
    )
  }
  return [...groups]
    .sort(([, leftItems], [, rightItems]) => {
      const left = leftItems[0]!
      const right = rightItems[0]!
      if (left.kind === 'component' && right.kind === 'component') {
        const leftOrder = componentFamilyOrder.get(left.family)
        const rightOrder = componentFamilyOrder.get(right.family)
        if (leftOrder !== undefined || rightOrder !== undefined) {
          return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER)
        }
      }
      return left.group.localeCompare(right.group)
    })
    .map(([, items]) => [items[0]!.group, items] as const)
}

function prefetchFamily(family: string) {
  void prefetchPreviewFamily(family).catch(() => undefined)
}

function CatalogFamilySection({
  family,
  id,
  labelledBy,
  children,
}: {
  family: string
  id: string
  labelledBy: string
  children: React.ReactNode
}) {
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    return observeNearViewport(section, () => prefetchFamily(family))
  }, [family])
  return (
    <section
      ref={sectionRef}
      id={id}
      className="specimen-section"
      aria-labelledby={labelledBy}
      onMouseEnter={() => prefetchFamily(family)}
      onFocusCapture={() => prefetchFamily(family)}
    >
      {children}
    </section>
  )
}

export function Catalog() {
  const [commandMounted, setCommandMounted] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [search, setSearch] = useState(currentSearch)
  const pendingRestoration = useRef<CatalogHistoryState | undefined>(undefined)

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.history.replaceState(
      { ...historyState(), catalogEntry: true, catalogScrollY: window.scrollY },
      '',
    )
    const update = (event: PopStateEvent) => {
      pendingRestoration.current = (event.state ?? {}) as CatalogHistoryState
      setSearch(currentSearch())
    }
    let scrollFrame: number | undefined
    const rememberScroll = () => {
      if (scrollFrame !== undefined) return
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = undefined
        window.history.replaceState(
          { ...historyState(), catalogEntry: true, catalogScrollY: window.scrollY },
          '',
        )
      })
    }
    window.addEventListener('popstate', update)
    window.addEventListener('scroll', rememberScroll, { passive: true })
    return () => {
      window.history.scrollRestoration = previousScrollRestoration
      window.removeEventListener('popstate', update)
      window.removeEventListener('scroll', rememberScroll)
      if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
    }
  }, [])

  useEffect(() => {
    const toggleCommand = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.key.toLowerCase() !== 'k' ||
        (!event.metaKey && !event.ctrlKey)
      )
        return
      if (
        !commandOpen &&
        document.querySelector('[role="dialog"][data-open], [data-slot="sheet-content"][data-open]')
      )
        return
      event.preventDefault()
      if (commandOpen) setCommandOpen(false)
      else {
        setCommandMounted(true)
        setCommandOpen(true)
      }
    }
    document.addEventListener('keydown', toggleCommand)
    return () => document.removeEventListener('keydown', toggleCommand)
  }, [commandOpen])

  useLayoutEffect(() => {
    const restoration = pendingRestoration.current
    if (!restoration) return
    pendingRestoration.current = undefined
    let focusTimer: number | undefined
    let deadlineTimer: number | undefined
    let observer: ResizeObserver | undefined
    const restore = () => {
      const anchor = restoration.catalogAnchorId
        ? document.getElementById(restoration.catalogAnchorId)
        : null
      if (anchor && restoration.catalogAnchorTop !== undefined) {
        const delta = anchor.getBoundingClientRect().top - restoration.catalogAnchorTop
        withoutSmoothScroll(() => window.scrollBy({ top: delta }))
      } else {
        withoutSmoothScroll(() => window.scrollTo({ top: restoration.catalogScrollY ?? 0 }))
      }
    }
    const restoreFocus = () => {
      if (restoration.catalogFocusId) {
        document.getElementById(restoration.catalogFocusId)?.focus({ preventScroll: true })
      }
    }
    const respondToLayout = () => {
      restore()
      if (focusTimer !== undefined) window.clearTimeout(focusTimer)
      focusTimer = window.setTimeout(restoreFocus, 200)
    }
    const stop = () => {
      restore()
      restoreFocus()
      observer?.disconnect()
      if (focusTimer !== undefined) window.clearTimeout(focusTimer)
      if (deadlineTimer !== undefined) window.clearTimeout(deadlineTimer)
    }
    const frame = window.requestAnimationFrame(() => {
      respondToLayout()
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(respondToLayout)
        observer.observe(document.body)
      }
      deadlineTimer = window.setTimeout(stop, 1_500)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (focusTimer !== undefined) window.clearTimeout(focusTimer)
      if (deadlineTimer !== undefined) window.clearTimeout(deadlineTimer)
      observer?.disconnect()
    }
  }, [search])

  const navigate = (url: string, anchorId?: string, focusId?: string) => {
    const anchor = anchorId ? document.getElementById(anchorId) : null
    window.history.replaceState(
      {
        ...historyState(),
        catalogEntry: true,
        catalogScrollY: window.scrollY,
        catalogAnchorId: anchorId,
        catalogAnchorTop: anchor?.getBoundingClientRect().top,
        catalogFocusId: focusId,
      },
      '',
    )
    window.history.pushState(
      { catalogEntry: true, catalogParent: true, catalogScrollY: 0 },
      '',
      url,
    )
    setSearch(currentSearch())
    withoutSmoothScroll(() => window.scrollTo({ top: 0 }))
  }

  const navigateBack = () => {
    if (historyState().catalogParent) {
      window.history.back()
      return
    }
    const fallbackKind = activeKind
    window.history.replaceState(
      { catalogEntry: true, catalogScrollY: 0 },
      '',
      kindUrl(fallbackKind),
    )
    setSearch(currentSearch())
    withoutSmoothScroll(() => window.scrollTo({ top: 0 }))
  }

  const selectedPreview = search.get('preview')
  const selectedFamily = search.get('family')
  const selectedDescriptor = selectedPreview
    ? previewDescriptors.find((item) => item.id === selectedPreview)
    : undefined
  useEffect(() => {
    const family = selectedDescriptor
      ? `${selectedDescriptor.kind}/${selectedDescriptor.family}`
      : selectedFamily
    if (family) prefetchFamily(family)
  }, [selectedDescriptor, selectedFamily])
  const familyKind = selectedFamily?.split('/')[0] ?? null
  const requestedKind = search.get('kind')
  const activeKind: CatalogKind =
    selectedDescriptor?.kind ??
    (isCatalogKind(familyKind) ? familyKind : undefined) ??
    (isCatalogKind(requestedKind) ? requestedKind : 'component')
  const outlineGroups = useMemo(
    () =>
      groupDescriptors(
        previewDescriptors.filter((item) => item.kind === activeKind && item.canonical),
      ),
    [activeKind],
  )
  const commandGroups = useMemo(
    () =>
      catalogKinds.map((kind) => ({
        label: catalogKindLabels[kind],
        actions: previewDescriptors
          .filter((item) => item.kind === kind && item.canonical)
          .map((item) => ({
            id: item.id,
            label: item.title,
            keywords: [item.address, item.group, item.family, item.scene],
          })),
      })),
    [],
  )
  const descriptors = useMemo(() => {
    let selected = previewDescriptors
    if (selectedPreview) selected = selected.filter((item) => item.id === selectedPreview)
    else if (selectedFamily) {
      selected = selected.filter((item) => `${item.kind}/${item.family}` === selectedFamily)
    } else selected = selected.filter((item) => item.kind === activeKind && item.canonical)
    return selected
  }, [activeKind, selectedFamily, selectedPreview])
  const groups = groupDescriptors(descriptors)
  const isolated = Boolean(selectedPreview)

  return (
    <Tabs
      value={activeKind}
      onValueChange={(value) => {
        if (!isCatalogKind(value) || value === activeKind) return
        navigate(kindUrl(value), 'catalog-controls', `catalog-tab-${activeKind}`)
      }}
      data-slot="component-catalog"
      data-catalog-view={isolated ? 'isolated' : 'catalog'}
      className="catalog-tabs"
    >
      <div id="catalog-controls" className="catalog-controls">
        {selectedPreview || selectedFamily ? (
          <Button variant="ghost" size="sm" onClick={navigateBack}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
        ) : null}
        <Sheet>
          <SheetTrigger
            render={<Button id="catalog-outline-trigger" variant="outline" size="sm" />}
          >
            <ListTreeIcon data-icon="inline-start" />
            Outline
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{catalogKindLabels[activeKind]}</SheetTitle>
              <SheetDescription>Jump to a catalog family.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="catalog-outline-scroll">
              <nav
                className="catalog-outline-list"
                aria-label={`${catalogKindLabels[activeKind]} outline`}
              >
                {outlineGroups.map(([group, items]) => {
                  const family = `${items[0]!.kind}/${items[0]!.family}`
                  const familyUrl = `${window.location.pathname}?family=${encodeURIComponent(family)}`
                  const sectionId = `catalog-group-${family.replaceAll('/', '-')}`
                  return (
                    <SheetClose
                      key={family}
                      render={<Button variant="ghost" className="w-full justify-between" />}
                      onMouseEnter={() => prefetchFamily(family)}
                      onFocus={() => prefetchFamily(family)}
                      onClick={() => navigate(familyUrl, sectionId, 'catalog-outline-trigger')}
                    >
                      {group}
                      <Badge variant="outline">{items.length}</Badge>
                    </SheetClose>
                  )
                })}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <TabsList aria-label="Catalog sections">
          {catalogKinds.map((kind) => (
            <TabsTrigger key={kind} id={`catalog-tab-${kind}`} value={kind}>
              {catalogKindLabels[kind]}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          id="catalog-command-trigger"
          className="catalog-search"
          variant="outline"
          aria-haspopup="dialog"
          aria-expanded={commandOpen}
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => {
            setCommandMounted(true)
            setCommandOpen(true)
          }}
        >
          <SearchIcon data-icon="inline-start" />
          Search components
          <Kbd className="ml-auto">⌘K</Kbd>
        </Button>
      </div>

      {commandMounted ? (
        <CommandPaletteBoundary>
          <Suspense fallback={null}>
            <CommandPaletteControlled
              className="w-full max-w-lg!"
              open={commandOpen}
              query={commandQuery}
              groups={commandGroups}
              title="Search catalog"
              description="Search components, patterns, and blocks."
              placeholder="Search components, patterns, and blocks…"
              emptyLabel="No catalog family found."
              onOpenChange={(open) => {
                setCommandOpen(open)
                if (!open) setCommandQuery('')
              }}
              onQueryChange={setCommandQuery}
              onActionIntent={(id) => {
                const descriptor = previewDescriptors.find((item) => item.id === id)
                if (descriptor) prefetchFamily(`${descriptor.kind}/${descriptor.family}`)
              }}
              onAction={(id) => {
                const descriptor = previewDescriptors.find((item) => item.id === id)
                if (!descriptor) return
                setCommandOpen(false)
                setCommandQuery('')
                prefetchFamily(`${descriptor.kind}/${descriptor.family}`)
                navigate(
                  `${window.location.pathname}?preview=${encodeURIComponent(descriptor.id)}`,
                  `catalog-group-${descriptor.kind}-${descriptor.family}`,
                  'catalog-command-trigger',
                )
              }}
            />
          </Suspense>
        </CommandPaletteBoundary>
      ) : null}

      <TabsContent value={activeKind} className="catalog-panel">
        {groups.length === 0 ? (
          <Alert>
            <AlertTitle>No previews found</AlertTitle>
            <AlertDescription>Check the catalog address.</AlertDescription>
          </Alert>
        ) : null}

        {groups.map(([group, items]) => {
          const family = `${items[0]!.kind}/${items[0]!.family}`
          const familyUrl = `${window.location.pathname}?family=${encodeURIComponent(family)}`
          const sectionId = `catalog-group-${family.replaceAll('/', '-')}`
          return (
            <CatalogFamilySection
              key={group}
              family={family}
              id={sectionId}
              labelledBy={`${sectionId}-heading`}
            >
              <div className="section-heading">
                <h2 id={`${sectionId}-heading`}>{group}</h2>
                <div className="inline-cluster">
                  <Badge variant="outline">{items.length}</Badge>
                  {!isolated && !selectedFamily ? (
                    <Button
                      id={`${sectionId}-view`}
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<a href={familyUrl} />}
                      onMouseEnter={() => prefetchFamily(family)}
                      onFocus={() => prefetchFamily(family)}
                      onClick={(event) => {
                        event.preventDefault()
                        navigate(familyUrl, sectionId, `${sectionId}-view`)
                      }}
                    >
                      View family
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className={isolated ? 'preview-grid preview-grid--isolated' : 'preview-grid'}>
                {items.map((descriptor) => (
                  <PreviewCanvas key={descriptor.id} descriptor={descriptor} eager={isolated} />
                ))}
              </div>
            </CatalogFamilySection>
          )
        })}
      </TabsContent>
    </Tabs>
  )
}
