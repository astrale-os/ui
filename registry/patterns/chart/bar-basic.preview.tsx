import { ChartBarBasic } from './bar-basic.js'
import { chartData } from './chart.fixture.js'

export const preview = { canvas: 'wide' } as const

export default function ChartBarBasicPreview() {
  return <ChartBarBasic data={chartData} label="Weekly graph operations" />
}
