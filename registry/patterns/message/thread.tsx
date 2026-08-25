import { Button } from '@astrale-os/ui/button'
export type ThreadMessage = {
  id: string
  author: string
  content: React.ReactNode
  failed?: boolean
}
export function MessageThread({
  className,
  style,
  messages,
  loading,
  onRetry,
}: {
  className?: string
  style?: React.CSSProperties

  messages: readonly ThreadMessage[]
  loading?: boolean
  onRetry?(id: string): void
}) {
  return (
    <section
      data-slot="pattern-message-thread"
      style={style}
      aria-label="Conversation"
      aria-busy={loading}
      className={className}
    >
      <ol data-slot="patterns-message-thread-ol" className="grid gap-3">
        {messages.map((message) => (
          <li data-slot="patterns-message-thread-li" key={message.id}>
            <article data-slot="patterns-message-thread-article" className="rounded-xl border p-3">
              <strong data-slot="patterns-message-thread-strong">{message.author}</strong>
              <div data-slot="patterns-message-thread-div">{message.content}</div>
              {message.failed && (
                <Button variant="outline" onClick={() => onRetry?.(message.id)}>
                  Retry
                </Button>
              )}
            </article>
          </li>
        ))}
      </ol>
      {loading && (
        <p data-slot="patterns-message-thread-p" role="status">
          Loading messages…
        </p>
      )}
    </section>
  )
}
