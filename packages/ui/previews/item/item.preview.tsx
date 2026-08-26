import { Button } from '@astrale-os/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@astrale-os/ui/item'

export const preview = { source: '@shadcn/item' } as const

export default function ItemPreview() {
  return (
    <ItemGroup role="group">
      <Item variant="outline">
        <ItemMedia variant="icon">↗</ItemMedia>
        <ItemContent>
          <ItemTitle>Kernel host</ItemTitle>
          <ItemDescription>Healthy · 14 ms</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Inspect
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  )
}
