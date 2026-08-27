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
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { componentNames } from './inventory.js'
import { PreviewCanvas } from './preview.js'
import { previewDescriptors, type PreviewDescriptor } from './previews.js'

const CommandPaletteControlled = lazy(() =>
  import('../../../registry/patterns/command-palette/controlled.js').then((module) => ({
    default: module.CommandPaletteControlled,
  })),
)

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
        document.querySelector(
          '[data-slot="dialog-content"][data-open], [data-slot="drawer-popup"][data-open], [data-slot="sheet-content"][data-open]',
        )
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
        actions: groupDescriptors(
          previewDescriptors.filter((item) => item.kind === kind && item.canonical),
        ).map(([group, items]) => ({
          id: `${items[0]!.kind}/${items[0]!.family}`,
          label: group,
          keywords: items.flatMap((item) => [item.address, item.title, item.scene]),
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
            onAction={(family) => {
              setCommandOpen(false)
              setCommandQuery('')
              navigate(
                `${window.location.pathname}?family=${encodeURIComponent(family)}`,
                `catalog-group-${family.replaceAll('/', '-')}`,
                'catalog-command-trigger',
              )
            }}
          />
        </Suspense>
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
            <section
              key={group}
              id={sectionId}
              className="specimen-section"
              aria-labelledby={`${sectionId}-heading`}
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
            </section>
          )
        })}
      </TabsContent>
    </Tabs>
  )
}
