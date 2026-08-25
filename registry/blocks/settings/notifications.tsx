import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Switch } from '@astrale-os/ui/switch'
export function NotificationSettings({
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
      data-slot="block-settings-notifications"
      style={style}
      className={cn('grid max-w-2xl gap-5', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <header data-slot="blocks-settings-notifications-header">
        <h1 data-slot="blocks-settings-notifications-h1" className="font-heading text-3xl">
          Notifications
        </h1>
      </header>
      <label
        data-slot="blocks-settings-notifications-label"
        className="flex items-center justify-between"
      >
        Email notifications
        <Switch
          checked={Boolean(values['email'])}
          onCheckedChange={(value) => onToggle('email', value)}
        />
      </label>
      <label
        data-slot="blocks-settings-notifications-label"
        className="flex items-center justify-between"
      >
        Product updates
        <Switch
          checked={Boolean(values['product'])}
          onCheckedChange={(value) => onToggle('product', value)}
        />
      </label>
      {error && (
        <p data-slot="blocks-settings-notifications-p" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
