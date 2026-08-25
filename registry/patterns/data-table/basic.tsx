export type DataColumn<Row> = { key: keyof Row; label: string; render?(row: Row): React.ReactNode }
export function DataTableBasic<Row extends { id: string }>({
  className,
  style,
  rows,
  columns,
  caption = 'Data',
}: {
  className?: string
  style?: React.CSSProperties

  rows: readonly Row[]
  columns: readonly DataColumn<Row>[]
  caption?: string
}) {
  return (
    <table data-slot="pattern-data-table-basic" style={style} className={className}>
      <caption data-slot="patterns-data-table-basic-caption" className="sr-only">
        {caption}
      </caption>
      <thead data-slot="patterns-data-table-basic-thead">
        <tr data-slot="patterns-data-table-basic-tr">
          {columns.map((column) => (
            <th data-slot="patterns-data-table-basic-th" key={String(column.key)} scope="col">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody data-slot="patterns-data-table-basic-tbody">
        {rows.map((row) => (
          <tr data-slot="patterns-data-table-basic-tr" key={row.id}>
            {columns.map((column) => (
              <td data-slot="patterns-data-table-basic-td" key={String(column.key)}>
                {column.render?.(row) ?? String(row[column.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
