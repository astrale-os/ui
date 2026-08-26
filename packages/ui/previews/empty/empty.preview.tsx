import { Button } from '@astrale-os/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@astrale-os/ui/empty'

export const preview = { source: '@shadcn/empty' } as const

export default function EmptyPreview() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">✦</EmptyMedia>
        <EmptyTitle>No pending admissions</EmptyTitle>
        <EmptyDescription>The graph is quiet.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">Open journal</Button>
      </EmptyContent>
    </Empty>
  )
}
