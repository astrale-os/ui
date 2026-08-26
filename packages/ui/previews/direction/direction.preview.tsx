import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { DirectionProvider } from '@astrale-os/ui/direction'

export const preview = { canvas: 'compact', source: '@shadcn/direction' } as const

export default function DirectionPreview() {
  return (
    <DirectionProvider direction="rtl">
      <ButtonGroup>
        <Button variant="outline">First</Button>
        <Button variant="outline">Second</Button>
      </ButtonGroup>
    </DirectionProvider>
  )
}
