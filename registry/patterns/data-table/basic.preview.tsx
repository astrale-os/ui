import { DataTableBasic } from './basic.js'
import { domainColumns, domainRows } from './data-table.fixture.js'

export const preview = { canvas: 'wide' } as const

export default function DataTableBasicPreview() {
  return <DataTableBasic rows={domainRows} columns={domainColumns} caption="Domain readiness" />
}
