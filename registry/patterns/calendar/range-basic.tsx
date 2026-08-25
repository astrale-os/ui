import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'

export type DateRange = { start?: string; end?: string }
export type CalendarRangeBasicProps = {
  days: readonly { iso: string; label: string; disabled?: boolean }[]
  value: DateRange
  onValueChange(value: DateRange): void
}
export function CalendarRangeBasic({
  className,
  style,
  days,
  value,
  onValueChange,
}: CalendarRangeBasicProps & { className?: string; style?: React.CSSProperties }) {
  const choose = (iso: string) =>
    !value.start || value.end || iso < value.start
      ? onValueChange({ start: iso })
      : onValueChange({ start: value.start, end: iso })
  return (
    <section
      data-slot="pattern-calendar-range-basic"
      style={style}
      aria-label="Choose a date range"
      className={cn('grid grid-cols-7 gap-1', className)}
    >
      {days.map((day) => {
        const selected = day.iso === value.start || day.iso === value.end
        const within = Boolean(
          value.start && value.end && day.iso > value.start && day.iso < value.end,
        )
        return (
          <Button
            key={day.iso}
            type="button"
            size="icon-sm"
            variant={selected ? 'default' : within ? 'secondary' : 'ghost'}
            aria-pressed={selected || within}
            disabled={day.disabled}
            onClick={() => choose(day.iso)}
          >
            <time data-slot="patterns-calendar-range-basic-time" dateTime={day.iso}>
              {day.label}
            </time>
          </Button>
        )
      })}
    </section>
  )
}
