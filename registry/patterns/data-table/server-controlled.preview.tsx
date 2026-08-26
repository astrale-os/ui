import { useState } from 'react'

import { domainColumns, domainRows } from './data-table.fixture.js'
import { DataTableServerControlled } from './server-controlled.js'

export const preview = { canvas: 'wide' } as const

export default function DataTableServerControlledPreview() {
  const [page, setPage] = useState(1)
  return (
    <DataTableServerControlled
      rows={domainRows}
      columns={domainColumns}
      page={page}
      pageCount={3}
      onPageChange={setPage}
    />
  )
}
