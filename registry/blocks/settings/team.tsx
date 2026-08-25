import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Input } from '@astrale-os/ui/input'
import { Switch } from '@astrale-os/ui/switch'
export function TeamSettings({
  className,
  style,
  values,
  saving,
  error,
  onChange,
  onToggle,
  onSave,
}: {
  className?: string
  style?: React.CSSProperties

  values: Readonly<Record<string, string | boolean>>
  saving?: boolean
  error?: string
  onChange(id: string, value: string): void
  onToggle(id: string, value: boolean): void
  onSave(): void
}) {
  return (
    <form
      data-slot="block-settings-team"
      style={style}
      className={cn('grid max-w-2xl gap-5', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <header data-slot="blocks-settings-team-header">
        <h1 data-slot="blocks-settings-team-h1" className="font-heading text-3xl">
          Team
        </h1>
      </header>
      <label data-slot="blocks-settings-team-label">
        Team name
        <Input
          value={String(values['teamName'] ?? '')}
          onChange={(event) => onChange('teamName', event.currentTarget.value)}
        />
      </label>
      <label data-slot="blocks-settings-team-label" className="flex items-center justify-between">
        Discoverable
        <Switch
          checked={Boolean(values['discoverable'])}
          onCheckedChange={(value) => onToggle('discoverable', value)}
        />
      </label>
      {error && (
        <p data-slot="blocks-settings-team-p" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
