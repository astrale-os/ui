import { Button } from '@astrale-os/ui/button'
import { Input } from '@astrale-os/ui/input'
export function NativeForm({
  className,
  style,
  value,
  error,
  submitting,
  onValueChange,
  onSubmit,
}: {
  className?: string
  style?: React.CSSProperties

  value: string
  error?: string
  submitting?: boolean
  onValueChange(value: string): void
  onSubmit(): void
}) {
  const errorId = 'astrale-native-form-error'
  return (
    <form
      data-slot="pattern-form-native"
      className={className}
      style={style}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label data-slot="patterns-form-native-label" className="grid gap-1">
        Workspace name
        <Input
          required
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onValueChange(event.currentTarget.value)}
        />
      </label>
      {error && (
        <p data-slot="patterns-form-native-p" id={errorId} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
