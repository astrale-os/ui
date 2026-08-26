import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Textarea } from '@astrale-os/ui/textarea'
import { useId } from 'react'
export function ComposerBlock({
  className,
  style,
  value,
  attachments,
  sending,
  error,
  onValueChange,
  onRemoveAttachment,
  onSubmit,
}: {
  className?: string
  style?: React.CSSProperties

  value: string
  attachments: readonly { id: string; name: string }[]
  sending?: boolean
  error?: string
  onValueChange(value: string): void
  onRemoveAttachment(id: string): void
  onSubmit(): void
}) {
  const messageId = useId()
  return (
    <form
      data-slot="block-communication-composer"
      style={style}
      className={cn('rounded-xl border p-4', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label
        data-slot="blocks-communication-composer-label"
        className="sr-only"
        htmlFor={messageId}
      >
        Message
      </label>
      <Textarea
        id={messageId}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
      {attachments.length > 0 && (
        <ul data-slot="blocks-communication-composer-ul">
          {attachments.map((item) => (
            <li data-slot="blocks-communication-composer-li" key={item.id}>
              {item.name}{' '}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onRemoveAttachment(item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p data-slot="blocks-communication-composer-p" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={sending || !value.trim()}>
        {sending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  )
}
