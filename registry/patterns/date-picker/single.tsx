import { cn } from '@astrale-os/ui/class-name'
import { Input } from '@astrale-os/ui/input'
export function DatePickerSingle({
  className,
  style,
  value,
  min,
  max,
  disabled,
  onValueChange,
}: {
  className?: string
  style?: React.CSSProperties

  value?: string
  min?: string
  max?: string
  disabled?: boolean
  onValueChange(value: string): void
}) {
  return (
    <label
      data-slot="pattern-date-picker-single"
      style={style}
      className={cn('grid gap-1', className)}
    >
      <span data-slot="patterns-date-picker-single-span">Date</span>
      <Input
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
    </label>
  )
}
