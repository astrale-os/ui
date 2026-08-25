import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Switch } from '@astrale-os/ui/switch'
export function AppearanceSettings({
  className,
  style,
  values,
  saving,
  error,
  onToggle,
  onSave,
}: {
  className?: string
  style?: React.CSSProperties

  values: Readonly<Record<string, string | boolean>>
  saving?: boolean
  error?: string
  onToggle(id: string, value: boolean): void
  onSave(): void
}) {
  return (
    <form
      data-slot="block-settings-appearance"
      style={style}
      className={cn('grid max-w-2xl gap-5', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <header data-slot="blocks-settings-appearance-header">
        <h1 data-slot="blocks-settings-appearance-h1" className="font-heading text-3xl">
          Appearance
        </h1>
      </header>
      <label
        data-slot="blocks-settings-appearance-label"
        className="flex items-center justify-between"
      >
        Compact density
        <Switch
          checked={Boolean(values['compact'])}
          onCheckedChange={(value) => onToggle('compact', value)}
        />
      </label>
      <label
        data-slot="blocks-settings-appearance-label"
        className="flex items-center justify-between"
      >
        Enable motion
        <Switch
          checked={Boolean(values['motion'])}
          onCheckedChange={(value) => onToggle('motion', value)}
        />
      </label>
      {error && (
        <p data-slot="blocks-settings-appearance-p" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
