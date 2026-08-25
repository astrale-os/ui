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
export function VerificationCard({
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
      data-slot="block-authentication-verification"
      style={style}
      className={cn('mx-auto max-w-md', className)}
    >
      <CardHeader>
        <CardTitle>Verify account</CardTitle>
        <CardDescription>Enter the code from your verification message.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          data-slot="blocks-authentication-verification-form"
          id={formId}
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label data-slot="blocks-authentication-verification-label">
            Verification code
            <Input
              name="code"
              type="text"
              value={values['code'] ?? ''}
              required
              aria-invalid={Boolean(error)}
              onChange={(event) => onChange('code', event.currentTarget.value)}
            />
          </label>
          {error && (
            <p data-slot="blocks-authentication-verification-p" role="alert">
              {error}
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button form={formId} type="submit" disabled={submitting}>
          {submitting ? 'Working…' : 'Verify account'}
        </Button>
      </CardFooter>
    </Card>
  )
}
