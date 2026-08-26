import { Button } from '@astrale-os/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@astrale-os/ui/empty'
export function EmptyToFirstValue({
  className,
  style,
  title,
  description,
  busy,
  error,
  onCreate,
}: {
  className?: string
  style?: React.CSSProperties

  title: string
  description: string
  busy?: boolean
  error?: string
  onCreate(): void
}) {
  return (
    <Empty data-slot="block-onboarding-empty-first-value" style={style} className={className}>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {error && (
          <p data-slot="blocks-onboarding-empty-first-value-p" role="alert">
            {error}
          </p>
        )}
        <Button disabled={busy} onClick={onCreate}>
          {busy ? 'Creating…' : 'Create first item'}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
