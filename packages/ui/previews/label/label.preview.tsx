import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

export const preview = { source: '@shadcn/label' } as const

export default function LabelPreview() {
  return (
    <>
      <Label htmlFor="plain-label">Explicit native relationship</Label>
      <Input id="plain-label" defaultValue="kernel.Identity" />
    </>
  )
}
