import { Line, LineChart } from 'recharts'

import { ChartContainer } from './chart.js'

export const preview = { canvas: 'wide', source: '@shadcn/chart' } as const

export default function ChartPreview() {
  return (
    <ChartContainer
      className="w-full"
      config={{ value: { label: 'Value', color: 'var(--ui-chart-1)' } }}
      initialDimension={{ width: 320, height: 160 }}
    >
      <LineChart accessibilityLayer={false} data={[{ value: 12 }, { value: 28 }, { value: 21 }]}>
        <Line dataKey="value" stroke="var(--color-value)" />
      </LineChart>
    </ChartContainer>
  )
}
