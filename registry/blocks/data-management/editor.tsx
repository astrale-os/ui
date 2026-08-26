import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
import { Input } from '@astrale-os/ui/input'
export function RecordEditor({
  className,
  style,
  title,
  fields,
  values,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  className?: string
  style?: React.CSSProperties

  title: string
  fields: readonly { id: string; label: string; required?: boolean }[]
  values: Readonly<Record<string, string>>
  errors?: Readonly<Record<string, string>>
  saving?: boolean
  onChange(id: string, value: string): void
  onCancel(): void
  onSave(): void
}) {
  return (
    <form
      data-slot="block-data-management-editor"
      style={style}
      className={cn('grid gap-4 rounded-xl border p-5', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <h2 data-slot="blocks-data-management-editor-h2" className="font-heading text-2xl">
        {title}
      </h2>
      {fields.map((field) => (
        <label data-slot="blocks-data-management-editor-label" key={field.id}>
          {field.label}
          <Input
            required={field.required}
            value={values[field.id] ?? ''}
            aria-invalid={Boolean(errors?.[field.id])}
            onChange={(event) => onChange(field.id, event.currentTarget.value)}
          />
          {errors?.[field.id] && (
            <span data-slot="blocks-data-management-editor-span" role="alert">
              {errors[field.id]}
            </span>
          )}
        </label>
      ))}
      <div data-slot="blocks-data-management-editor-div" className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
