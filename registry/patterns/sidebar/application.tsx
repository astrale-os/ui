import { Button } from '@astrale-os/ui/button'
export type SidebarRoute = { id: string; label: string }
export function ApplicationSidebar({
  className,
  style,
  routes,
  current,
  collapsed,
  onNavigate,
  onCollapsedChange,
}: {
  className?: string
  style?: React.CSSProperties

  routes: readonly SidebarRoute[]
  current: string
  collapsed: boolean
  onNavigate(id: string): void
  onCollapsedChange(collapsed: boolean): void
}) {
  return (
    <aside
      data-slot="pattern-sidebar-application"
      style={style}
      aria-label="Application navigation"
      data-collapsed={collapsed}
      className={className}
    >
      <Button
        variant="ghost"
        aria-expanded={!collapsed}
        onClick={() => onCollapsedChange(!collapsed)}
      >
        {collapsed ? 'Expand navigation' : 'Collapse navigation'}
      </Button>
      <nav data-slot="patterns-sidebar-application-nav">
        {routes.map((route) => (
          <Button
            key={route.id}
            variant={route.id === current ? 'secondary' : 'ghost'}
            aria-current={route.id === current ? 'page' : undefined}
            onClick={() => onNavigate(route.id)}
          >
            {collapsed ? route.label.slice(0, 1) : route.label}
          </Button>
        ))}
      </nav>
    </aside>
  )
}
