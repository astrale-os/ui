import { useState } from 'react'

import { calendarDays } from './calendar.fixture.js'
import { CalendarSingleBasic } from './single-basic.js'

export const preview = { canvas: 'wide' } as const

export default function CalendarSingleBasicPreview() {
  const [value, setValue] = useState('2026-09-08')
  return <CalendarSingleBasic days={calendarDays} value={value} onValueChange={setValue} />
}
