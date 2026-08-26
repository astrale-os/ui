import { cn } from '@astrale-os/ui/class-name'
export function MessageBubble({
  className,
  style,
  role,
  name,
  timestamp,
  children,
}: {
  className?: string
  style?: React.CSSProperties

  role: 'user' | 'assistant' | 'system'
  name: string
  timestamp?: string
  children: React.ReactNode
}) {
  return (
    <article
      data-slot="pattern-message-bubble-basic"
      style={style}
      data-role={role}
      className={cn('max-w-prose rounded-xl border bg-card p-3', className)}
    >
      <header
        data-slot="patterns-message-bubble-basic-header"
        className="flex justify-between gap-4"
      >
        <strong data-slot="patterns-message-bubble-basic-strong">{name}</strong>
        {timestamp && <time data-slot="patterns-message-bubble-basic-time">{timestamp}</time>}
      </header>
      <div data-slot="patterns-message-bubble-basic-div">{children}</div>
    </article>
  )
}
