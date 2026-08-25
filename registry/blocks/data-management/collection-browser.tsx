import { Button } from '@astrale-os/ui/button'
import { Input } from '@astrale-os/ui/input'
export function CollectionBrowser({
  className,
  style,
  rows,
  query,
  selected,
  loading,
  onQueryChange,
  onSelect,
  onCreate,
}: {
  className?: string
  style?: React.CSSProperties

  rows: readonly { id: string; title: string; meta?: string }[]
  query: string
  selected?: string
  loading?: boolean
  onQueryChange(value: string): void
  onSelect(id: string): void
  onCreate(): void
}) {
  return (
    <section
      data-slot="block-data-management-collection-browser"
      style={style}
      aria-busy={loading}
      className={className}
    >
      <header data-slot="blocks-data-management-collection-browser-header" className="flex gap-2">
        <Input
          aria-label="Filter collection"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
        <Button onClick={onCreate}>Create</Button>
      </header>
      <ul data-slot="blocks-data-management-collection-browser-ul" className="mt-4 grid gap-2">
        {rows.map((row) => (
          <li data-slot="blocks-data-management-collection-browser-li" key={row.id}>
            <Button
              variant={row.id === selected ? 'secondary' : 'outline'}
              className="h-auto w-full justify-start p-3"
              onClick={() => onSelect(row.id)}
            >
              <span data-slot="blocks-data-management-collection-browser-span">
                {row.title}
                {row.meta && (
                  <span
                    data-slot="blocks-data-management-collection-browser-span"
                    className="block text-muted-foreground"
                  >
                    {row.meta}
                  </span>
                )}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
