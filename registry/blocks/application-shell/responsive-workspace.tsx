import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
export function ResponsiveWorkspaceShell({
  className,
  style,
  title,
  panels,
  activePanel,
  onActivePanelChange,
}: {
  className?: string
  style?: React.CSSProperties

  title: string
  panels: readonly { id: string; label: string; content: React.ReactNode }[]
  activePanel: string
  onActivePanelChange(id: string): void
}) {
  const active = panels.find((panel) => panel.id === activePanel)
  return (
    <div
      data-slot="block-application-shell-responsive-workspace"
      style={style}
      className={cn('min-h-screen', className)}
    >
      <header
        data-slot="blocks-application-shell-responsive-workspace-header"
        className="border-b p-4"
      >
        <h1
          data-slot="blocks-application-shell-responsive-workspace-h1"
          className="font-heading text-2xl"
        >
          {title}
        </h1>
      </header>
      <nav
        data-slot="blocks-application-shell-responsive-workspace-nav"
        aria-label="Workspace panels"
        className="flex overflow-auto border-b p-2"
      >
        {panels.map((panel) => (
          <Button
            key={panel.id}
            variant={panel.id === activePanel ? 'secondary' : 'ghost'}
            aria-current={panel.id === activePanel ? 'page' : undefined}
            onClick={() => onActivePanelChange(panel.id)}
          >
            {panel.label}
          </Button>
        ))}
      </nav>
      <main data-slot="blocks-application-shell-responsive-workspace-main" className="p-4">
        {active?.content}
      </main>
    </div>
  )
}
