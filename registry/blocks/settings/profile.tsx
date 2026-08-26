import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Input } from '@astrale-os/ui/input'
export function ProfileSettings({
  className,
  style,
  values,
  saving,
  error,
  onChange,
  onSave,
}: {
  className?: string
  style?: React.CSSProperties

  values: Readonly<Record<string, string | boolean>>
  saving?: boolean
  error?: string
  onChange(id: string, value: string): void
  onSave(): void
}) {
  return (
    <form
      data-slot="block-settings-profile"
      style={style}
      className={cn('grid max-w-2xl gap-5', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <header data-slot="blocks-settings-profile-header">
        <h1 data-slot="blocks-settings-profile-h1" className="font-heading text-3xl">
          Profile
        </h1>
      </header>
      <label data-slot="blocks-settings-profile-label">
        Display name
        <Input
          value={String(values['name'] ?? '')}
          onChange={(event) => onChange('name', event.currentTarget.value)}
        />
      </label>
      <label data-slot="blocks-settings-profile-label">
        Biography
        <Input
          value={String(values['bio'] ?? '')}
          onChange={(event) => onChange('bio', event.currentTarget.value)}
        />
      </label>
      {error && (
        <p data-slot="blocks-settings-profile-p" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
