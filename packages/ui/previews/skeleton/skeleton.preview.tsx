import { Skeleton } from '@astrale-os/ui/skeleton'

export const preview = { source: '@shadcn/skeleton' } as const

export default function SkeletonPreview() {
  return (
    <div className="stack">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  )
}
