import { chartData } from './chart.fixture.js'
import { ChartLineBasic } from './line-basic.js'

export const preview = { canvas: 'wide' } as const

export default function ChartLineBasicPreview() {
  return <ChartLineBasic data={chartData} label="Weekly graph operations" />
}
