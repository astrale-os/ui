import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@astrale-os/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@astrale-os/ui/dialog'
export function CommandPaletteControlled({
  className,
  style,
  open,
  query,
  groups,
  onOpenChange,
  onQueryChange,
  onAction,
}: {
  className?: string
  style?: React.CSSProperties

  open: boolean
  query: string
  groups: readonly { label: string; actions: readonly { id: string; label: string }[] }[]
  onOpenChange(open: boolean): void
  onQueryChange(query: string): void
  onAction(id: string): void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="pattern-command-palette-controlled"
        style={style}
        className={className}
      >
        <DialogTitle>Commands</DialogTitle>
        <DialogDescription>Choose an action.</DialogDescription>
        <Command value={query}>
          <CommandInput value={query} onValueChange={onQueryChange} />
          <CommandList>
            <CommandEmpty>No result.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.actions.map((action) => (
                  <CommandItem key={action.id} onSelect={() => onAction(action.id)}>
                    {action.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
