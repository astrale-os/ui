import { useState } from 'react'

import { DatePickerRange, type DatePickerRangeValue } from './range.js'

export default function DatePickerRangePreview() {
  const [value, setValue] = useState<DatePickerRangeValue>({
    start: '2026-09-08',
    end: '2026-09-12',
  })
  return <DatePickerRange value={value} onValueChange={setValue} />
}
