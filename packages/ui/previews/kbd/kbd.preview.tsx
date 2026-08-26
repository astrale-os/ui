import { Kbd } from '@astrale-os/ui/kbd'

export const preview = { canvas: 'compact', source: '@shadcn/kbd' } as const

export default function KbdPreview() {
  return (
    <div className="inline-cluster">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
      <span>opens the command surface</span>
    </div>
  )
}
