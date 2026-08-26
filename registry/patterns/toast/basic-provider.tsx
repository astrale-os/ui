import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
export type ToastNotice = { id: string; message: string }
export function ToastRegion({
  className,
  style,
  notices,
  onDismiss,
}: {
  className?: string
  style?: React.CSSProperties
  notices: readonly ToastNotice[]
  onDismiss(id: string): void
}) {
  return (
    <aside
      data-slot="pattern-toast-basic-provider"
      style={style}
      aria-label="Notifications"
      aria-live="polite"
      className={cn('fixed bottom-4 right-4 grid gap-2', className)}
    >
      {notices.map((notice) => (
        <div
          data-slot="patterns-toast-basic-provider-div"
          key={notice.id}
          role="status"
          className="flex gap-3 rounded-xl border bg-popover p-3 shadow-lg"
        >
          <span data-slot="patterns-toast-basic-provider-span">{notice.message}</span>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(notice.id)}>
            Dismiss
          </Button>
        </div>
      ))}
    </aside>
  )
}
