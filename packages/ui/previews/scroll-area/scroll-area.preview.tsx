import { Item, ItemContent, ItemTitle } from '@astrale-os/ui/item'
import { ScrollArea } from '@astrale-os/ui/scroll-area'

export const preview = { source: '@shadcn/scroll-area' } as const

export default function ScrollAreaPreview() {
  return (
    <ScrollArea className="scroll-specimen">
      {Array.from({ length: 12 }, (_, index) => (
        <Item key={index} size="xs">
          <ItemContent>
            <ItemTitle>Graph event {String(index + 1).padStart(2, '0')}</ItemTitle>
          </ItemContent>
        </Item>
      ))}
    </ScrollArea>
  )
}
