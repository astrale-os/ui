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
export function SignInCard({
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
  const errorId = useId()
  return (
    <Card
      data-slot="block-authentication-sign-in-card"
      style={style}
      className={cn('mx-auto max-w-md', className)}
    >
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your details to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          data-slot="blocks-authentication-sign-in-card-form"
          id={formId}
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label data-slot="blocks-authentication-sign-in-card-label">
            Email
            <Input
              name="email"
              type="email"
              value={values['email'] ?? ''}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onChange('email', event.currentTarget.value)}
            />
          </label>
          <label data-slot="blocks-authentication-sign-in-card-label">
            Password
            <Input
              name="password"
              type="password"
              value={values['password'] ?? ''}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onChange('password', event.currentTarget.value)}
            />
          </label>
          {error && (
            <p data-slot="blocks-authentication-sign-in-card-p" id={errorId} role="alert">
              {error}
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button form={formId} type="submit" disabled={submitting}>
          {submitting ? 'Working…' : 'Sign in'}
        </Button>
      </CardFooter>
    </Card>
  )
}
