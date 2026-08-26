import { Button } from '@astrale-os/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@astrale-os/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@astrale-os/ui/dialog'
export function CommandPaletteDialog({
  className,
  style,
  actions,
  onAction,
}: {
  className?: string
  style?: React.CSSProperties

  actions: readonly { id: string; label: string }[]
  onAction(id: string): void
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open command palette</DialogTrigger>
      <DialogContent
        data-slot="pattern-command-palette-dialog-basic"
        style={style}
        className={className}
      >
        <DialogTitle>Commands</DialogTitle>
        <DialogDescription>Search available actions.</DialogDescription>
        <Command>
          <CommandInput placeholder="Search commands" />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup>
              {actions.map((action) => (
                <CommandItem key={action.id} onSelect={() => onAction(action.id)}>
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
