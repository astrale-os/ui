import { cn } from '@astrale-os/ui/class-name'
import { Input } from '@astrale-os/ui/input'
export type DatePickerRangeValue = { start?: string; end?: string }
export function DatePickerRange({
  className,
  style,
  value,
  onValueChange,
}: {
  className?: string
  style?: React.CSSProperties

  value: DatePickerRangeValue
  onValueChange(value: DatePickerRangeValue): void
}) {
  return (
    <fieldset
      data-slot="pattern-date-picker-range"
      style={style}
      className={cn('grid gap-3 sm:grid-cols-2', className)}
    >
      <legend data-slot="patterns-date-picker-range-legend" className="sr-only">
        Date range
      </legend>
      <label data-slot="patterns-date-picker-range-label">
        Start
        <Input
          type="date"
          value={value.start ?? ''}
          max={value.end}
          onChange={(event) => onValueChange({ ...value, start: event.currentTarget.value })}
        />
      </label>
      <label data-slot="patterns-date-picker-range-label">
        End
        <Input
          type="date"
          value={value.end ?? ''}
          min={value.start}
          onChange={(event) => onValueChange({ ...value, end: event.currentTarget.value })}
        />
      </label>
    </fieldset>
  )
}
