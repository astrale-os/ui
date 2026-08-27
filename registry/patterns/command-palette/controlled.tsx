import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@astrale-os/ui/command'

export function CommandPaletteControlled({
  className,
  style,
  open,
  query,
  groups,
  title = 'Command Palette',
  description = 'Search for a command to run...',
  placeholder = 'Type a command or search...',
  emptyLabel = 'No results found.',
  onOpenChange,
  onQueryChange,
  onAction,
  onActionIntent,
}: {
  className?: string
  style?: React.CSSProperties
  open: boolean
  query: string
  groups: readonly {
    label: string
    actions: readonly { id: string; label: string; keywords?: readonly string[] }[]
  }[]
  title?: string
  description?: string
  placeholder?: string
  emptyLabel?: string
  onOpenChange(open: boolean): void
  onQueryChange(query: string): void
  onAction(id: string): void
  onActionIntent?(id: string): void
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={className}
    >
      <Command
        data-slot="pattern-command-palette-controlled"
        style={style}
        onValueChange={onActionIntent}
      >
        <CommandInput placeholder={placeholder} value={query} onValueChange={onQueryChange} />
        <CommandList>
          <CommandEmpty>{emptyLabel}</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.actions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  keywords={action.keywords ? [...action.keywords] : undefined}
                  onSelect={() => onAction(action.id)}
                  onMouseEnter={() => onActionIntent?.(action.id)}
                  onFocus={() => onActionIntent?.(action.id)}
                >
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
