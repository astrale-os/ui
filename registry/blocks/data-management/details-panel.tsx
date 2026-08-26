import { Button } from '@astrale-os/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@astrale-os/ui/sheet'
export function DetailsPanel({
  className,
  style,
  open,
  title,
  description,
  fields,
  canEdit,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  className?: string
  style?: React.CSSProperties

  open: boolean
  title: string
  description?: string
  fields: readonly { label: string; value: React.ReactNode }[]
  canEdit?: boolean
  onOpenChange(open: boolean): void
  onEdit(): void
  onDelete(): void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="block-data-management-details-panel"
        style={style}
        className={className}
      >
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description ?? 'Record details'}</SheetDescription>
        <dl data-slot="blocks-data-management-details-panel-dl" className="grid gap-3">
          {fields.map((field) => (
            <div data-slot="blocks-data-management-details-panel-div" key={field.label}>
              <dt
                data-slot="blocks-data-management-details-panel-dt"
                className="text-muted-foreground"
              >
                {field.label}
              </dt>
              <dd data-slot="blocks-data-management-details-panel-dd">{field.value}</dd>
            </div>
          ))}
        </dl>
        {canEdit && (
          <div data-slot="blocks-data-management-details-panel-div" className="flex gap-2">
            <Button onClick={onEdit}>Edit</Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
