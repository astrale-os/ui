import { Badge } from '@astrale-os/ui/badge'

export const preview = { canvas: 'compact', source: '@shadcn/badge' } as const

export default function BadgePreview() {
  return (
    <div className="inline-cluster">
      <Badge>Ready</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">Inherited</Badge>
    </div>
  )
}
