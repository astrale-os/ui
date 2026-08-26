import { ToggleGroup, ToggleGroupItem } from '@astrale-os/ui/toggle-group'

export const preview = { canvas: 'compact', source: '@shadcn/toggle-group' } as const

export default function ToggleGroupPreview() {
  return (
    <ToggleGroup defaultValue={['day']} variant="outline" spacing={0}>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  )
}
