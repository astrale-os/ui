import { Alert, AlertDescription, AlertTitle, Badge, Button, Input } from '@astrale-os/ui'
import { useEffect, useMemo, useState } from 'react'

import { PreviewCanvas } from './preview.js'
import { previewDescriptors, type PreviewDescriptor } from './previews.js'

function currentSearch() {
  return new URLSearchParams(window.location.search)
}

function groupDescriptors(descriptors: PreviewDescriptor[]) {
  const groups = new Map<string, PreviewDescriptor[]>()
  for (const descriptor of descriptors) {
    const group = groups.get(descriptor.group) ?? []
    group.push(descriptor)
    groups.set(descriptor.group, group)
  }
  return [...groups]
}

export function Catalog() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState(currentSearch)

  useEffect(() => {
    const update = () => setSearch(currentSearch())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const navigate = (url: string) => {
    window.history.pushState({}, '', url)
    setSearch(currentSearch())
    window.scrollTo({ top: 0 })
  }

  const selectedPreview = search.get('preview')
  const selectedFamily = search.get('family')
  const descriptors = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let selected = previewDescriptors
    if (selectedPreview) selected = selected.filter((item) => item.id === selectedPreview)
    else if (selectedFamily) {
      selected = selected.filter((item) => `${item.kind}/${item.family}` === selectedFamily)
    } else if (!needle) selected = selected.filter((item) => item.canonical)
    if (!needle) return selected
    return selected.filter((item) =>
      [item.address, item.scene, item.title, item.group].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    )
  }, [query, selectedFamily, selectedPreview])
  const groups = groupDescriptors(descriptors)
  const isolated = Boolean(selectedPreview)

  return (
    <div data-slot="component-catalog" data-catalog-view={isolated ? 'isolated' : 'catalog'}>
      <div className="catalog-controls">
        {selectedPreview || selectedFamily ? (
          <Button variant="outline" onClick={() => navigate(window.location.pathname)}>
            Back to catalog
          </Button>
        ) : null}
        <Input
          className="catalog-search"
          aria-label="Search catalog"
          placeholder="Search components, patterns, blocks…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </div>

      {groups.length === 0 ? (
        <Alert>
          <AlertTitle>No previews found</AlertTitle>
          <AlertDescription>Check the catalog address or search.</AlertDescription>
        </Alert>
      ) : null}

      {groups.map(([group, items]) => {
        const family = `${items[0]!.kind}/${items[0]!.family}`
        const familyUrl = `?family=${encodeURIComponent(family)}`
        return (
          <section
            key={group}
            className="specimen-section"
            aria-labelledby={`catalog-group-${family.replaceAll('/', '-')}`}
          >
            <div className="section-heading">
              <h2 id={`catalog-group-${family.replaceAll('/', '-')}`}>{group}</h2>
              <div className="inline-cluster">
                <Badge variant="outline">{items.length}</Badge>
                {!isolated && !selectedFamily ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<a href={familyUrl} />}
                    onClick={(event) => {
                      event.preventDefault()
                      navigate(familyUrl)
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
                  onNavigate={navigate}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
