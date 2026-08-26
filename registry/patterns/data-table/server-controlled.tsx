import { Button } from '@astrale-os/ui/button'
export function DataTableServerControlled<Row extends { id: string }>({
  className,
  style,
  rows,
  columns,
  page,
  pageCount,
  loading,
  onPageChange,
}: {
  className?: string
  style?: React.CSSProperties

  rows: readonly Row[]
  columns: readonly { key: keyof Row; label: string }[]
  page: number
  pageCount: number
  loading?: boolean
  onPageChange(page: number): void
}) {
  return (
    <section
      data-slot="pattern-data-table-server-controlled"
      style={style}
      aria-busy={loading}
      className={className}
    >
      <table data-slot="patterns-data-table-server-controlled-table">
        <thead data-slot="patterns-data-table-server-controlled-thead">
          <tr data-slot="patterns-data-table-server-controlled-tr">
            {columns.map((column) => (
              <th data-slot="patterns-data-table-server-controlled-th" key={String(column.key)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-slot="patterns-data-table-server-controlled-tbody">
          {rows.map((row) => (
            <tr data-slot="patterns-data-table-server-controlled-tr" key={row.id}>
              {columns.map((column) => (
                <td data-slot="patterns-data-table-server-controlled-td" key={String(column.key)}>
                  {String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <nav
        data-slot="patterns-data-table-server-controlled-nav"
        aria-label="Table pages"
        className="flex items-center gap-2"
      >
        <Button disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span data-slot="patterns-data-table-server-controlled-span">
          Page {page} of {pageCount}
        </span>
        <Button disabled={page >= pageCount || loading} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </nav>
    </section>
  )
}
