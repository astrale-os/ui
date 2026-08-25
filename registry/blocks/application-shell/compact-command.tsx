import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@astrale-os/ui/command'
export function CompactCommandShell({
  className,
  style,
  actions,
  currentTitle,
  children,
  onAction,
}: {
  className?: string
  style?: React.CSSProperties

  actions: readonly { id: string; label: string }[]
  currentTitle: string
  children: React.ReactNode
  onAction(id: string): void
}) {
  return (
    <div
      data-slot="block-application-shell-compact-command"
      style={style}
      className={cn('min-h-screen bg-muted/30', className)}
    >
      <header
        data-slot="blocks-application-shell-compact-command-header"
        className="flex items-center gap-3 border-b bg-background p-3"
      >
        <Button variant="outline">⌘</Button>
        <h1
          data-slot="blocks-application-shell-compact-command-h1"
          className="text-sm font-semibold"
        >
          {currentTitle}
        </h1>
      </header>
      <main
        data-slot="blocks-application-shell-compact-command-main"
        className="grid gap-5 p-5 lg:grid-cols-[18rem_1fr]"
      >
        <Command>
          <CommandInput placeholder="Find an action" />
          <CommandList>
            <CommandGroup>
              {actions.map((action) => (
                <CommandItem key={action.id} onSelect={() => onAction(action.id)}>
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <section data-slot="blocks-application-shell-compact-command-section">{children}</section>
      </main>
    </div>
  )
}
