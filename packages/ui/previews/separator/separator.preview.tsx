import { Separator } from '@astrale-os/ui/separator'

export const preview = { source: '@shadcn/separator' } as const

export default function SeparatorPreview() {
  return (
    <div className="stack">
      <span>Current generation</span>
      <Separator />
      <span>Previous generation</span>
    </div>
  )
}
