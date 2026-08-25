import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'

export type CalendarDay = { iso: string; label: string; disabled?: boolean }
export type CalendarSingleBasicProps = {
  days: readonly CalendarDay[]
  value?: string
  onValueChange(value: string): void
  label?: string
}
export function CalendarSingleBasic({
  className,
  style,
  days,
  value,
  onValueChange,
  label = 'Choose a date',
}: CalendarSingleBasicProps & { className?: string; style?: React.CSSProperties }) {
  return (
    <section
      data-slot="pattern-calendar-single-basic"
      style={style}
      aria-label={label}
      className={cn('grid grid-cols-7 gap-1', className)}
    >
      {days.map((day) => (
        <Button
          key={day.iso}
          type="button"
          variant={value === day.iso ? 'default' : 'ghost'}
          size="icon-sm"
          aria-pressed={value === day.iso}
          disabled={day.disabled}
          onClick={() => onValueChange(day.iso)}
        >
          <time data-slot="patterns-calendar-single-basic-time" dateTime={day.iso}>
            {day.label}
          </time>
        </Button>
      ))}
    </section>
  )
}
