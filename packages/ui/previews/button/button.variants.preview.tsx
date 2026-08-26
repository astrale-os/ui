import { Button } from '@astrale-os/ui/button'

export const preview = { canvas: 'compact', source: '@shadcn/button' } as const

export default function ButtonVariantsPreview() {
  return (
    <div className="inline-cluster">
      <Button>Continue</Button>
      <Button variant="secondary">Queue</Button>
      <Button variant="outline">Inspect</Button>
      <Button variant="destructive">Revoke</Button>
    </div>
  )
}
