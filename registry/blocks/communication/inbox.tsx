import { Button } from '@astrale-os/ui/button'
export function InboxBlock({
  className,
  style,
  conversations,
  selected,
  loading,
  onSelect,
  onLoadMore,
}: {
  className?: string
  style?: React.CSSProperties

  conversations: readonly { id: string; sender: string; subject: string; unread?: boolean }[]
  selected?: string
  loading?: boolean
  onSelect(id: string): void
  onLoadMore(): void
}) {
  return (
    <section
      data-slot="block-communication-inbox"
      style={style}
      aria-busy={loading}
      className={className}
    >
      <header data-slot="blocks-communication-inbox-header" className="flex justify-between">
        <h2 data-slot="blocks-communication-inbox-h2" className="font-heading text-2xl">
          Inbox
        </h2>
        <Button variant="outline" disabled={loading} onClick={onLoadMore}>
          Load more
        </Button>
      </header>
      <ol data-slot="blocks-communication-inbox-ol" className="mt-4 divide-y rounded-xl border">
        {conversations.map((item) => (
          <li data-slot="blocks-communication-inbox-li" key={item.id}>
            <Button
              variant={item.id === selected ? 'secondary' : 'ghost'}
              className="h-auto w-full justify-start p-4 text-left"
              onClick={() => onSelect(item.id)}
            >
              <span data-slot="blocks-communication-inbox-span">
                <strong
                  data-slot="blocks-communication-inbox-strong"
                  className={item.unread ? '' : 'font-normal'}
                >
                  {item.sender}
                </strong>
                <span
                  data-slot="blocks-communication-inbox-span"
                  className="block text-muted-foreground"
                >
                  {item.subject}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ol>
    </section>
  )
}
