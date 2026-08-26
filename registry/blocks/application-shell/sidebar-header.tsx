import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
export function ApplicationShellSidebarHeader({
  className,
  style,
  navigation,
  current,
  identity,
  children,
  onNavigate,
  onIdentityAction,
}: {
  className?: string
  style?: React.CSSProperties

  navigation: readonly { id: string; label: string }[]
  current: string
  identity: string
  children: React.ReactNode
  onNavigate(id: string): void
  onIdentityAction(): void
}) {
  return (
    <div
      data-slot="block-application-shell-sidebar-header"
      style={style}
      className={cn('grid min-h-screen md:grid-cols-[15rem_1fr]', className)}
    >
      <aside data-slot="blocks-application-shell-sidebar-header-aside" className="border-r p-4">
        <strong data-slot="blocks-application-shell-sidebar-header-strong">Astrale</strong>
        <nav data-slot="blocks-application-shell-sidebar-header-nav" className="mt-6 grid">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={item.id === current ? 'secondary' : 'ghost'}
              aria-current={item.id === current ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>
      <div data-slot="blocks-application-shell-sidebar-header-div">
        <header
          data-slot="blocks-application-shell-sidebar-header-header"
          className="flex items-center justify-end border-b p-3"
        >
          <Button variant="ghost" onClick={onIdentityAction}>
            {identity}
          </Button>
        </header>
        <main data-slot="blocks-application-shell-sidebar-header-main" className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
