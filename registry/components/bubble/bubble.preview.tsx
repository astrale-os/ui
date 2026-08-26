import { Bubble, BubbleContent, BubbleGroup } from './bubble.js'

export const preview = { source: '@shadcn/bubble' } as const

export default function BubblePreview() {
  return (
    <BubbleGroup>
      <Bubble variant="muted">
        <BubbleContent>Runtime source matches its provider proof.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  )
}
