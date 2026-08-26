import { Button } from '@astrale-os/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@astrale-os/ui/card'
import { cn } from '@astrale-os/ui/class-name'
import { Input } from '@astrale-os/ui/input'
import { useId } from 'react'
export function RecoveryCard({
  className,
  style,
  values,
  error,
  submitting,
  onChange,
  onSubmit,
}: {
  className?: string
  style?: React.CSSProperties

  values: Readonly<Record<string, string>>
  error?: string
  submitting?: boolean
  onChange(field: string, value: string): void
  onSubmit(): void
}) {
  const formId = useId()
  return (
    <Card
      data-slot="block-authentication-recovery"
      style={style}
      className={cn('mx-auto max-w-md', className)}
    >
      <CardHeader>
        <CardTitle>Recover access</CardTitle>
        <CardDescription>We will send recovery instructions if the account exists.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          data-slot="blocks-authentication-recovery-form"
          id={formId}
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label data-slot="blocks-authentication-recovery-label">
            Email
            <Input
              name="email"
              type="email"
              value={values['email'] ?? ''}
              required
              aria-invalid={Boolean(error)}
              onChange={(event) => onChange('email', event.currentTarget.value)}
            />
          </label>
          {error && (
            <p data-slot="blocks-authentication-recovery-p" role="alert">
              {error}
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button form={formId} type="submit" disabled={submitting}>
          {submitting ? 'Working…' : 'Recover access'}
        </Button>
      </CardFooter>
    </Card>
  )
}
