import { Button } from '@astrale-os/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@astrale-os/ui/sheet'
export function MobileSidebarControlled({
  className,
  style,
  open,
  links,
  onOpenChange,
  onNavigate,
}: {
  className?: string
  style?: React.CSSProperties

  open: boolean
  links: readonly { id: string; label: string }[]
  onOpenChange(open: boolean): void
  onNavigate(id: string): void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={<Button variant="outline" />}>Open navigation</SheetTrigger>
      <SheetContent
        data-slot="pattern-sidebar-mobile-controlled"
        style={style}
        side="left"
        className={className}
      >
        <SheetTitle>Navigation</SheetTitle>
        <SheetDescription>Choose a destination.</SheetDescription>
        <nav data-slot="patterns-sidebar-mobile-controlled-nav" className="grid">
          {links.map((link) => (
            <Button
              key={link.id}
              variant="ghost"
              onClick={() => {
                onNavigate(link.id)
                onOpenChange(false)
              }}
            >
              {link.label}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
