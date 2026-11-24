import {
  Finder,
  FinderCancel,
  FinderCell,
  FinderChip,
  FinderChipRemove,
  FinderClasses,
  FinderConfirm,
  FinderDomains,
  FinderHeader,
  FinderColumnHeader,
  FinderNodeRow,
  FinderOption,
  FinderRows,
  FinderTable,
  FinderTray,
  createMemoryFinderSource,
  useFinder,
  type FinderRow,
} from '@astrale-os/ui/finder'

export const preview = { canvas: 'wide' } as const

const source = createMemoryFinderSource({
  domains: [
    { id: 'library', name: 'Library' },
    { id: 'people', name: 'People' },
  ],
  classes: {
    library: [
      {
        key: 'library:Book',
        name: 'Book',
        properties: [
          { key: 'name', label: 'Title', kind: 'text' },
          { key: 'year', label: 'Year', kind: 'number' },
        ],
        nameProperty: 'name',
      },
    ],
    people: [
      {
        key: 'people:Author',
        name: 'Author',
        properties: [{ key: 'name', label: 'Name', kind: 'text' }],
        nameProperty: 'name',
      },
    ],
  },
  nodes: [
    {
      id: 'b1',
      class: 'library:Book',
      name: 'Middlemarch',
      values: { name: 'Middlemarch', year: 1871 },
    },
    {
      id: 'b2',
      class: 'library:Book',
      name: 'Dubliners',
      values: { name: 'Dubliners', year: 1914 },
    },
    { id: 'b3', class: 'library:Book', name: 'Kindred', values: { name: 'Kindred', year: 1979 } },
    { id: 'a1', class: 'people:Author', name: 'George Eliot', values: { name: 'George Eliot' } },
  ],
})

const option = 'cursor-default rounded px-2 py-1 data-active:bg-muted/60 data-selected:bg-muted'

function Row({ row }: { row: FinderRow }) {
  const { table } = useFinder()
  return (
    <FinderNodeRow
      row={row}
      className="flex cursor-default border-t data-active:bg-muted data-chosen:font-medium"
    >
      {table.columns.map((column) => (
        <FinderCell
          key={column.key}
          row={row}
          column={column}
          className="flex-1 truncate px-2 py-1"
        />
      ))}
    </FinderNodeRow>
  )
}

/** The headless Finder with a minimal look of the host's own; `block/finder/*` is the full one. */
export default function FinderPreview() {
  return (
    <Finder
      source={source}
      maximum={2}
      defaultPlace={{ domain: 'library', classes: ['library:Book'] }}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      className="grid h-72 w-full grid-cols-[8rem_8rem_1fr] grid-rows-[1fr_auto] overflow-hidden rounded-lg border text-sm"
    >
      <FinderDomains aria-label="Domains" className="overflow-y-auto border-r p-1 outline-none">
        {(entry) => (
          <FinderOption className={option}>
            {entry.kind === 'domain' ? entry.domain.name : 'All accepted'}
          </FinderOption>
        )}
      </FinderDomains>
      <FinderClasses aria-label="Classes" className="overflow-y-auto border-r p-1 outline-none">
        {(item) => <FinderOption className={option}>{item.name}</FinderOption>}
      </FinderClasses>
      <FinderTable aria-label="Nodes" className="overflow-y-auto outline-none">
        <FinderHeader className="flex text-xs text-muted-foreground">
          {(column) => (
            <FinderColumnHeader column={column} className="flex-1 px-2 py-1 text-left" />
          )}
        </FinderHeader>
        <FinderRows>{(row) => <Row row={row} />}</FinderRows>
      </FinderTable>
      <div className="col-span-3 flex items-center gap-2 border-t p-2">
        <FinderTray className="flex flex-1 gap-1">
          {(choice) => (
            <FinderChip
              choice={choice}
              className="flex items-center gap-1 rounded border px-1.5 text-xs"
            >
              {choice.name}
              <FinderChipRemove choice={choice}>×</FinderChipRemove>
            </FinderChip>
          )}
        </FinderTray>
        <FinderCancel className="rounded border px-2 py-1">Cancel</FinderCancel>
        <FinderConfirm className="rounded bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50">
          Select
        </FinderConfirm>
      </div>
    </Finder>
  )
}
