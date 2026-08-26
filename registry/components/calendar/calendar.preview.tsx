import { useState } from 'react'

import { Calendar } from './calendar.js'

export const preview = { source: '@shadcn/calendar' } as const

export default function CalendarPreview() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 7, 26))
  return <Calendar mode="single" selected={date} onSelect={setDate} />
}
