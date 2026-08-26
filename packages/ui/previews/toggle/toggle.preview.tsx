import { Toggle } from '@astrale-os/ui/toggle'

export const preview = { canvas: 'compact', source: '@shadcn/toggle' } as const

export default function TogglePreview() {
  return (
    <Toggle variant="outline" defaultPressed>
      Pin telemetry
    </Toggle>
  )
}
