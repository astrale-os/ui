'use client'

import React from 'react'

import { CalTimezonePicker, offsetLabel } from './timezone-picker.js'

// The provider-local automation type module is outside the accepted source set, so the exact
// upstream schedule contract that this editor reads and writes is declared with the surface.
export interface ScheduleDefinition {
  schedule_type: 'interval' | 'daily' | 'weekly' | 'monthly' | 'specific_dates' | 'one_time'
  interval_minutes: number
  time_of_day: string
  repeat_every: number
  days_of_week: string[]
  days_of_month: number[]
  specific_dates: string[]
  run_at: string
  timezone: string
  end_condition: 'never' | 'on_date' | 'after_occurrences'
  end_date: string
  max_occurrences: number
}

const SCHEDULE_TYPES = [
  { value: 'interval', label: 'Interval' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'specific_dates', label: 'Specific Dates' },
  { value: 'one_time', label: 'One-Time' },
] as const

const DAY_LABELS = [
  { key: 'Sun', label: 'S' },
  { key: 'Mon', label: 'M' },
  { key: 'Tue', label: 'T' },
  { key: 'Wed', label: 'W' },
  { key: 'Thu', label: 'T' },
  { key: 'Fri', label: 'F' },
  { key: 'Sat', label: 'S' },
]

const END_CONDITIONS = [
  { value: 'never', label: 'Never' },
  { value: 'on_date', label: 'On date' },
  { value: 'after_occurrences', label: 'After' },
] as const

export interface ScheduleEditorProps {
  value: Partial<ScheduleDefinition>
  onChange(value: Partial<ScheduleDefinition>): void
  compact?: boolean
  zones?: readonly string[] | null
  locale?: string
}

const inputClass =
  'w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-[11px] text-foreground outline-none focus:border-primary/50 transition-colors'
const selectClass = inputClass + ' cursor-pointer'
const labelClass = 'text-[11px] font-bold text-muted-foreground'

// Supporting recurrence semantics of the MIT ascentspark recurrence editor: an incomplete
// recurrence is reported instead of being serialized, and the last valid value is retained.
const SCHEDULE_TYPE_LABELS = new Map(SCHEDULE_TYPES.map((t) => [t.value, t.label]))

function incompleteField(value: Partial<ScheduleDefinition>): string | null {
  const schedType = value.schedule_type || 'interval'
  const endCondition = value.end_condition || 'never'
  if (schedType === 'weekly' && (value.days_of_week || []).length === 0) return 'days_of_week'
  if (schedType === 'monthly' && (value.days_of_month || []).length === 0) return 'days_of_month'
  if (schedType === 'specific_dates' && (value.specific_dates || []).filter(Boolean).length === 0) {
    return 'specific_dates'
  }
  if (schedType === 'one_time' && !value.run_at) return 'run_at'
  if (
    schedType !== 'one_time' &&
    schedType !== 'specific_dates' &&
    endCondition === 'on_date' &&
    !value.end_date
  ) {
    return 'end_date'
  }
  return null
}

function describeSchedule(value: Partial<ScheduleDefinition>, locale: string): string {
  const schedType = value.schedule_type || 'interval'
  const zone = value.timezone || 'UTC'
  const summary: string[] = [SCHEDULE_TYPE_LABELS.get(schedType) ?? '']

  if (schedType === 'interval') {
    const minutes = value.interval_minutes || 60
    const hoursMode = minutes >= 60 && minutes % 60 === 0
    const unit = hoursMode ? 'hours' : 'minutes'
    summary.push(`Repeat every ${hoursMode ? minutes / 60 : minutes} ${unit}`)
  }
  if (schedType === 'weekly') {
    summary.push(`Repeat every ${value.repeat_every || 1} week(s)`)
    summary.push(`Repeat on ${(value.days_of_week || []).join(', ')}`)
  }
  if (schedType === 'monthly') {
    summary.push(`On day(s) of month ${(value.days_of_month || []).join(', ')}`)
  }
  if (schedType === 'specific_dates') {
    summary.push(`Dates ${(value.specific_dates || []).filter(Boolean).join(', ')}`)
  }
  if (schedType === 'one_time') {
    summary.push(`Date & Time ${value.run_at || ''}`)
  } else if (schedType !== 'interval') {
    summary.push(`At time ${value.time_of_day || '09:00'}`)
  }
  summary.push(`Time zone ${zone.replace(/_/g, ' ')} (${offsetLabel(zone, locale)})`)

  if (schedType !== 'one_time' && schedType !== 'specific_dates') {
    const endCondition = value.end_condition || 'never'
    if (endCondition === 'never') summary.push('Ends Never')
    if (endCondition === 'on_date') summary.push(`Ends On date ${value.end_date || ''}`)
    if (endCondition === 'after_occurrences') {
      summary.push(`Ends After ${value.max_occurrences || 10} occurrences`)
    }
  }

  return summary.filter(Boolean).join(' · ')
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  value,
  onChange,
  compact,
  zones = null,
  locale = 'en-US',
}) => {
  const schedType = value.schedule_type || 'interval'

  const update = (patch: Partial<ScheduleDefinition>) => {
    onChange({ ...value, ...patch })
  }

  // For interval: allow toggling between minutes and hours in the UI
  const intervalMinutes = value.interval_minutes || 60
  const isHoursMode = intervalMinutes >= 60 && intervalMinutes % 60 === 0
  const displayInterval = isHoursMode ? intervalMinutes / 60 : intervalMinutes
  const intervalUnit = isHoursMode ? 'hours' : 'minutes'

  const daysOfWeek = value.days_of_week || []
  const daysOfMonth = value.days_of_month || []
  const specificDates = value.specific_dates || []
  const endCondition = value.end_condition || 'never'

  const showEndCondition = schedType !== 'one_time' && schedType !== 'specific_dates'

  const radioGroupName = React.useId()

  // Two-way `value`: the last valid schedule is retained and resynced whenever the prop changes,
  // so an incomplete recurrence reports itself without discarding what the host already accepted.
  const field = React.useId()
  const incomplete = incompleteField(value)
  const [lastValid, setLastValid] = React.useState(value)
  const [prevValue, setPrevValue] = React.useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!incomplete) setLastValid(value)
  }
  const summary = describeSchedule(incomplete ? lastValid : value, locale)
  const invalidProps = (name: string) =>
    incomplete === name ? { 'aria-invalid': true, 'aria-describedby': `${field}-validation` } : {}

  return (
    <div className={`space-y-3 ${compact ? '' : 'p-3'}`}>
      {/* Schedule Type Selector */}
      <div className="space-y-1">
        <label className={labelClass} htmlFor={`${field}-type`}>
          Schedule Type
        </label>
        <select
          id={`${field}-type`}
          value={schedType}
          onChange={(e) =>
            update({ schedule_type: e.target.value as ScheduleDefinition['schedule_type'] })
          }
          className={selectClass}
        >
          {SCHEDULE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* === INTERVAL === */}
      {schedType === 'interval' && (
        <div className="space-y-1">
          <label
            className={labelClass}
            id={`${field}-interval-label`}
            htmlFor={`${field}-interval`}
          >
            Repeat every
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              id={`${field}-interval`}
              type="number"
              min={1}
              value={displayInterval}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 1
                update({ interval_minutes: intervalUnit === 'hours' ? num * 60 : num })
              }}
              className={inputClass + ' w-20'}
            />
            <select
              aria-labelledby={`${field}-interval-label`}
              value={intervalUnit}
              onChange={(e) => {
                const newUnit = e.target.value
                if (newUnit === 'hours') {
                  update({ interval_minutes: Math.max(1, Math.round(intervalMinutes / 60)) * 60 })
                } else {
                  update({ interval_minutes: isHoursMode ? intervalMinutes : intervalMinutes })
                }
              }}
              className={selectClass + ' w-24'}
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        </div>
      )}

      {/* === DAILY === */}
      {schedType === 'daily' && (
        <div className="space-y-1">
          <label className={labelClass} htmlFor={`${field}-time`}>
            At time
          </label>
          <input
            id={`${field}-time`}
            type="time"
            value={value.time_of_day || '09:00'}
            onChange={(e) => update({ time_of_day: e.target.value })}
            className={inputClass}
          />
        </div>
      )}

      {/* === WEEKLY === */}
      {schedType === 'weekly' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={labelClass} htmlFor={`${field}-repeat-every`}>
              Repeat every
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                id={`${field}-repeat-every`}
                type="number"
                min={1}
                value={value.repeat_every || 1}
                onChange={(e) => update({ repeat_every: parseInt(e.target.value) || 1 })}
                className={inputClass + ' w-16'}
              />
              <span className="text-[11px] text-muted-foreground">week(s)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Repeat on</label>
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label="Days of week"
              {...invalidProps('days_of_week')}
            >
              {DAY_LABELS.map(({ key, label }) => {
                const active = daysOfWeek.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? daysOfWeek.filter((d) => d !== key)
                        : [...daysOfWeek, key]
                      update({ days_of_week: next })
                    }}
                    className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                    }`}
                    aria-label={key}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass} htmlFor={`${field}-time`}>
              At time
            </label>
            <input
              id={`${field}-time`}
              type="time"
              value={value.time_of_day || '09:00'}
              onChange={(e) => update({ time_of_day: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* === MONTHLY === */}
      {schedType === 'monthly' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={labelClass} id={`${field}-month-days-label`}>
              On day(s) of month
            </label>
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-labelledby={`${field}-month-days-label`}
              {...invalidProps('days_of_month')}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const active = daysOfMonth.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? daysOfMonth.filter((d) => d !== day)
                        : [...daysOfMonth, day].sort((a, b) => a - b)
                      update({ days_of_month: next })
                    }}
                    className={`w-7 h-7 rounded-md text-[9px] font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                    }`}
                    aria-pressed={active}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass} htmlFor={`${field}-time`}>
              At time
            </label>
            <input
              id={`${field}-time`}
              type="time"
              value={value.time_of_day || '09:00'}
              onChange={(e) => update({ time_of_day: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* === SPECIFIC DATES === */}
      {schedType === 'specific_dates' && (
        <div className="space-y-3">
          <div
            className="space-y-1.5"
            role="group"
            aria-labelledby={`${field}-dates-label`}
            {...invalidProps('specific_dates')}
          >
            <label className={labelClass} id={`${field}-dates-label`}>
              Dates
            </label>
            {specificDates.map((date, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="date"
                  aria-labelledby={`${field}-dates-label`}
                  value={date}
                  onChange={(e) => {
                    const next = [...specificDates]
                    next[i] = e.target.value
                    update({ specific_dates: next })
                  }}
                  className={inputClass + ' flex-1'}
                />
                <button
                  type="button"
                  aria-label={`Remove ${date}`}
                  onClick={() =>
                    update({ specific_dates: specificDates.filter((_, j) => j !== i) })
                  }
                  className="text-destructive hover:bg-destructive/10 p-1 rounded transition-all cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                update({ specific_dates: [...specificDates, today] })
              }}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Date
            </button>
          </div>

          <div className="space-y-1">
            <label className={labelClass} htmlFor={`${field}-time`}>
              At time
            </label>
            <input
              id={`${field}-time`}
              type="time"
              value={value.time_of_day || '09:00'}
              onChange={(e) => update({ time_of_day: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* === ONE-TIME === */}
      {schedType === 'one_time' && (
        <div className="space-y-1">
          <label className={labelClass} htmlFor={`${field}-run-at`}>
            Date &amp; Time
          </label>
          <input
            id={`${field}-run-at`}
            type="datetime-local"
            value={value.run_at || ''}
            onChange={(e) => update({ run_at: e.target.value })}
            className={inputClass}
            {...invalidProps('run_at')}
          />
        </div>
      )}

      {/* === TIME ZONE === */}
      <div className="space-y-1">
        <CalTimezonePicker
          id={`${field}-timezone`}
          value={value.timezone || 'UTC'}
          valueChange={(zone) => update({ timezone: zone })}
          zones={zones}
          locale={locale}
        />
      </div>

      {/* === END CONDITION === */}
      {showEndCondition && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          <label className={labelClass}>Ends</label>
          <div className="space-y-2" role="radiogroup" aria-label="Ends">
            {END_CONDITIONS.map(({ value: ec, label }) => (
              <div key={ec} className="flex flex-wrap items-center gap-2">
                <input
                  type="radio"
                  name={`end_condition_${radioGroupName}`}
                  checked={endCondition === ec}
                  onChange={() => {
                    const payload: Partial<ScheduleDefinition> = {
                      end_condition: ec as ScheduleDefinition['end_condition'],
                    }
                    if (ec === 'after_occurrences' && !value.max_occurrences) {
                      payload.max_occurrences = 10
                    }
                    if (ec === 'on_date' && !value.end_date) {
                      payload.end_date = new Date().toISOString().split('T')[0]
                    }
                    update(payload)
                  }}
                  aria-label={label}
                  className="accent-primary cursor-pointer"
                />
                <span className="text-[11px] text-foreground">{label}</span>

                {ec === 'on_date' && endCondition === 'on_date' && (
                  <input
                    type="date"
                    aria-label="On date"
                    value={value.end_date || ''}
                    onChange={(e) => update({ end_date: e.target.value })}
                    className={inputClass + ' w-36 ml-1'}
                    {...invalidProps('end_date')}
                  />
                )}

                {ec === 'after_occurrences' && endCondition === 'after_occurrences' && (
                  <div className="flex items-center gap-1 ml-1">
                    <input
                      type="number"
                      min={1}
                      aria-label="After"
                      value={value.max_occurrences || 10}
                      onChange={(e) => update({ max_occurrences: parseInt(e.target.value) || 10 })}
                      className={inputClass + ' w-16'}
                    />
                    <span className="text-[10px] text-muted-foreground">occurrences</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === SUMMARY AND VALIDATION === */}
      {incomplete && (
        <p className="cal-rec__preview text-[11px] text-destructive" id={`${field}-validation`}>
          <code>(no recurrence)</code>
        </p>
      )}
      <p className="cal-rec__preview text-[11px] text-muted-foreground" aria-live="polite">
        <code>{summary || '(no recurrence)'}</code>
      </p>
    </div>
  )
}
