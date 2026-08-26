import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@astrale-os/ui'
import { ArrowLeftIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { PreviewCanvas } from './preview.js'
import { previewDescriptors, type PreviewDescriptor } from './previews.js'

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
const componentGroupOrder = new Map(
  [
    'Actions & inputs',
    'Content & feedback',
    'Menus & overlays',
    'Navigation & layout',
    'Registry components',
  ].map((group, index) => [group, index]),
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
    const group = groups.get(descriptor.group) ?? []
    group.push(descriptor)
    groups.set(descriptor.group, group)
  }
  return [...groups].sort(([left], [right]) => {
    const leftOrder = componentGroupOrder.get(left)
    const rightOrder = componentGroupOrder.get(right)
    if (leftOrder !== undefined || rightOrder !== undefined) {
      return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER)
    }
    return left.localeCompare(right)
  })
}

export function Catalog() {
  const [query, setQuery] = useState('')
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
  const sceneCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const descriptor of previewDescriptors) {
      counts.set(descriptor.address, (counts.get(descriptor.address) ?? 0) + 1)
    }
    return counts
  }, [])
  const descriptors = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let selected = previewDescriptors
    if (selectedPreview) selected = selected.filter((item) => item.id === selectedPreview)
    else if (selectedFamily) {
      selected = selected.filter((item) => `${item.kind}/${item.family}` === selectedFamily)
    } else {
      selected = selected.filter((item) => item.kind === activeKind)
      if (!needle) selected = selected.filter((item) => item.canonical)
    }
    if (!needle) return selected
    return selected.filter((item) =>
      [item.address, item.scene, item.title, item.group].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    )
  }, [activeKind, query, selectedFamily, selectedPreview])
  const groups = groupDescriptors(descriptors)
  const isolated = Boolean(selectedPreview)

  return (
    <Tabs
      value={activeKind}
      onValueChange={(value) => {
        if (!isCatalogKind(value) || value === activeKind) return
        setQuery('')
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
        <TabsList aria-label="Catalog sections">
          {catalogKinds.map((kind) => (
            <TabsTrigger key={kind} id={`catalog-tab-${kind}`} value={kind}>
              {catalogKindLabels[kind]}
            </TabsTrigger>
          ))}
        </TabsList>
        <Input
          className="catalog-search"
          aria-label="Search catalog"
          placeholder={`Search ${catalogKindLabels[activeKind].toLowerCase()}…`}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </div>

      <TabsContent value={activeKind} className="catalog-panel">
        {groups.length === 0 ? (
          <Alert>
            <AlertTitle>No previews found</AlertTitle>
            <AlertDescription>Check the catalog address or search.</AlertDescription>
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
                  <PreviewCanvas
                    key={descriptor.id}
                    descriptor={descriptor}
                    eager={isolated}
                    sceneCount={
                      !isolated && !selectedFamily ? sceneCounts.get(descriptor.address) : 1
                    }
                    showOpen={!isolated}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </TabsContent>
    </Tabs>
  )
}
