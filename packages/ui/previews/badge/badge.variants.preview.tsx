import { Badge } from '@astrale-os/ui/badge'

export const preview = { canvas: 'compact', source: '@shadcn/badge' } as const

export default function BadgeVariantsPreview() {
  return (
    <div className="inline-cluster">
      <Badge variant="success">Available</Badge>
      <Badge variant="info">Beta</Badge>
      <Badge variant="warning">Soon</Badge>
      <Badge variant="destructive">Failed</Badge>
      <Badge variant="secondary">Not yet</Badge>
    </div>
  )
}
