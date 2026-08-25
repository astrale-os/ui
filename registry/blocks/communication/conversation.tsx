import { Button } from '@astrale-os/ui/button'
export function ConversationBlock({
  className,
  style,
  title,
  messages,
  loading,
  error,
  onRetry,
}: {
  className?: string
  style?: React.CSSProperties

  title: string
  messages: readonly { id: string; author: string; body: React.ReactNode }[]
  loading?: boolean
  error?: string
  onRetry(): void
}) {
  return (
    <section
      data-slot="block-communication-conversation"
      style={style}
      aria-busy={loading}
      className={className}
    >
      <header data-slot="blocks-communication-conversation-header" className="border-b pb-3">
        <h2 data-slot="blocks-communication-conversation-h2" className="font-heading text-2xl">
          {title}
        </h2>
      </header>
      {error && (
        <div data-slot="blocks-communication-conversation-div" role="alert" className="my-4">
          <p data-slot="blocks-communication-conversation-p">{error}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      )}
      <ol data-slot="blocks-communication-conversation-ol" className="grid gap-4 py-4">
        {messages.map((message) => (
          <li data-slot="blocks-communication-conversation-li" key={message.id}>
            <article
              data-slot="blocks-communication-conversation-article"
              className="rounded-xl border p-4"
            >
              <strong data-slot="blocks-communication-conversation-strong">{message.author}</strong>
              <div data-slot="blocks-communication-conversation-div">{message.body}</div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
