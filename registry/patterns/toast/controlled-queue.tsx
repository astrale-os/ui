import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
export type QueueToast = {
  id: string
  title: string
  description?: string
  tone?: 'info' | 'error'
}
export function ToastControlledQueue({
  className,
  style,
  queue,
  onDismiss,
  onAction,
}: {
  className?: string
  style?: React.CSSProperties

  queue: readonly QueueToast[]
  onDismiss(id: string): void
  onAction?(id: string): void
}) {
  const current = queue[0]
  if (!current)
    return (
      <div
        data-slot="pattern-toast-controlled-queue"
        className={className}
        style={style}
        aria-live="polite"
      />
    )
  return (
    <div
      data-slot="pattern-toast-controlled-queue"
      style={style}
      role={current.tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-xl border bg-popover p-4', className)}
    >
      <strong data-slot="patterns-toast-controlled-queue-strong">{current.title}</strong>
      {current.description && (
        <p data-slot="patterns-toast-controlled-queue-p">{current.description}</p>
      )}
      <div data-slot="patterns-toast-controlled-queue-div" className="flex gap-2">
        {onAction && (
          <Button size="sm" onClick={() => onAction(current.id)}>
            Action
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDismiss(current.id)}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
