import { Button } from '@astrale-os/ui/button'
import { ButtonGroup, ButtonGroupText } from '@astrale-os/ui/button-group'

export const preview = { canvas: 'compact', source: '@shadcn/button-group' } as const

export default function ButtonGroupPreview() {
  return (
    <ButtonGroup>
      <Button variant="outline">Preview</Button>
      <ButtonGroupText>⌘ K</ButtonGroupText>
    </ButtonGroup>
  )
}
