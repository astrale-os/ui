import { Button } from '@astrale-os/ui/button'
import { Spinner } from '@astrale-os/ui/spinner'

export const preview = { canvas: 'compact', source: '@shadcn/spinner' } as const

export default function SpinnerPreview() {
  return (
    <Button disabled>
      <Spinner data-icon="inline-start" />
      Qualifying
    </Button>
  )
}
