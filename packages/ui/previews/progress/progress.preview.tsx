import { Progress } from '@astrale-os/ui/progress'

export const preview = { source: '@shadcn/progress' } as const

export default function ProgressPreview() {
  return <Progress value={72} aria-label="Release qualification" />
}
