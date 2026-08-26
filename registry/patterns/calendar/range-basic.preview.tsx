import { useState } from 'react'

import { calendarDays } from './calendar.fixture.js'
import { CalendarRangeBasic, type DateRange } from './range-basic.js'

export const preview = { canvas: 'wide' } as const

export default function CalendarRangeBasicPreview() {
  const [value, setValue] = useState<DateRange>({})
  return <CalendarRangeBasic days={calendarDays} value={value} onValueChange={setValue} />
}
