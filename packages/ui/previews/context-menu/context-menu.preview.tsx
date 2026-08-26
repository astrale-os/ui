import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@astrale-os/ui/context-menu'

export const preview = { source: '@shadcn/context-menu' } as const

export default function ContextMenuPreview() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="context-target">Right-click this surface</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem>Inspect node</ContextMenuItem>
          <ContextMenuItem>Copy path</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
